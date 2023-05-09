import { Queue, QueueScheduler, Worker } from "bullmq";
import { randomUUID } from "crypto";

import { logger } from "@/common/logger";
import { getProvider } from "@/common/provider";
import { redis } from "@/common/redis";
import { config } from "@/config/index";
import { getNetworkSettings } from "@/config/network";
import { syncEvents } from "@/events-sync/index";
import * as eventsSyncBackfill from "@/jobs/events-sync/backfill-queue";

const QUEUE_NAME = "events-sync-realtime";

export const queue = new Queue(QUEUE_NAME, {
  connection: redis.duplicate(),
  defaultJobOptions: {
    // In order to be as lean as possible, leave retrying
    // any failed processes to be done by subsequent jobs
    removeOnComplete: true,
    removeOnFail: true,
    timeout: 60000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: redis.duplicate() });

// BACKGROUND WORKER ONLY
if (config.doBackgroundWork) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { chainId } = job.data;
      try {
        // We allow syncing of up to `maxBlocks` blocks behind the head
        // of the blockchain. If we lag behind more than that, then all
        // previous blocks that we cannot cover here will be relayed to
        // the backfill queue.
        const maxBlocks = getNetworkSettings(chainId).realtimeSyncMaxBlockLag;

        // here we need to give the block number for allowing from where we want to start the indexing
        const headBlock = await getProvider(chainId).getBlockNumber();
        // Fetch the last synced blocked
        let localBlock = Number(await redis.get(`${QUEUE_NAME}-chain${chainId}-last-block`));
        if (localBlock >= headBlock) {
          // Nothing to sync
          return;
        }

        if (localBlock === 0) {
          localBlock = headBlock;
        } else {
          localBlock++;
        }

        const fromBlock = Math.max(localBlock, headBlock - maxBlocks + 1);
        logger.info(
          QUEUE_NAME,
          `Events realtime syncing for chain ${chainId} for  block range [${fromBlock}, ${headBlock}] for chainId ${chainId}`
        );

        await syncEvents(chainId, fromBlock, headBlock);

        // Send any remaining blocks to the backfill queue
        if (localBlock < fromBlock) {
          logger.info(
            QUEUE_NAME,
            `Out of sync: chain ${chainId} local block ${localBlock} and upstream block ${fromBlock}`
          );
          await eventsSyncBackfill.addToQueue(chainId, localBlock, fromBlock - 1);
        }

        // To avoid missing any events, save the last synced block with a delay
        // in order to ensure that the latest blocks will get queried more than
        // once, which is exactly what we are looking for (since events for the
        // latest blocks might be missing due to upstream chain reorgs):
        // https://ethereum.stackexchange.com/questions/109660/eth-getlogs-and-some-missing-logs
        await redis.set(`${QUEUE_NAME}-chain${chainId}-last-block`, headBlock - 5);
      } catch (error: any) {
        logger.error(
          QUEUE_NAME,
          `Events realtime syncing failed for chain ${chainId}: ${error.stack}`
        );
        throw error;
      }
    },
    { connection: redis.duplicate(), concurrency: 3 }
  );
  worker.on("error", (error: any) => {
    logger.error(QUEUE_NAME, `Worker errored: ${error.stack}`);
  });
}

export const addToQueue = async (chainId: number) => {
  await queue.add(randomUUID(), { chainId });
};
