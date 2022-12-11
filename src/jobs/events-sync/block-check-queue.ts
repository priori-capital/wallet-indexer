import { HashZero } from "@ethersproject/constants";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";

import { idb } from "@/common/db";
import { logger } from "@/common/logger";
import { getProvider } from "@/common/provider";
import { redis } from "@/common/redis";
import { fromBuffer } from "@/common/utils";
import { config } from "@/config/index";
import { unsyncEvents } from "@/events-sync/index";
import * as backfillEventsSync from "@/jobs/events-sync/backfill-queue";
import * as blocksModel from "@/models/blocks";

const QUEUE_NAME = "events-sync-block-check";

export const queue = new Queue(QUEUE_NAME, {
  connection: redis.duplicate(),
  defaultJobOptions: {
    attempts: 10,
    backoff: {
      type: "exponential",
      delay: 30000,
    },
    removeOnComplete: 10000,
    removeOnFail: 10000,
    timeout: 60000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: redis.duplicate() });

// BACKGROUND WORKER ONLY
if (config.doBackgroundWork) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const { block, blockHash, chainId }: { block: number; blockHash?: string; chainId: number } =
        job.data;

      try {
        // Generic method for handling an orphan block
        const handleOrphanBlock = async (block: { number: number; hash: string }) => {
          // Resync the detected orphaned block
          await backfillEventsSync.addToQueue(chainId, block.number, block.number, {
            prioritized: true,
          });
          await unsyncEvents(block.number, block.hash);

          // Delete the orphaned block from the `blocks` table
          await blocksModel.deleteBlock(chainId, block.number, block.hash);

          // TODO: Also delete transactions associated to the orphaned
          // block and fetch the transactions of the replacement block
        };

        // Fetch the latest upstream hash for the specified block
        const upstreamBlockHash = (await getProvider(chainId).getBlock(block)).hash.toLowerCase();

        // When `blockHash` is empty, force recheck all event tables
        if (!blockHash) {
          const result = await idb.manyOrNone(
            `
              (SELECT
                ft_transfer_events.block_hash
              FROM ft_transfer_events
              WHERE ft_transfer_events.block = $/block/)
            `,
            { block }
          );

          for (const { block_hash } of result) {
            const blockHash = fromBuffer(block_hash);
            if (blockHash.toLowerCase() !== upstreamBlockHash.toLowerCase()) {
              logger.info(QUEUE_NAME, `Detected orphan block ${block} with hash ${blockHash}}`);
              await handleOrphanBlock({ number: block, hash: blockHash });
            }
          }
        } else {
          if (upstreamBlockHash.toLowerCase() !== blockHash.toLowerCase()) {
            logger.info(QUEUE_NAME, `Detected orphan block ${block} with hash ${blockHash}}`);
            await handleOrphanBlock({ number: block, hash: blockHash });
          }
        }
      } catch (error) {
        logger.error(QUEUE_NAME, `Block check failed: ${error}`);
        throw error;
      }
    },
    { connection: redis.duplicate(), concurrency: 10 }
  );
  worker.on("error", (error) => {
    logger.error(QUEUE_NAME, `Worker errored: ${error}`);
  });
}

export const addToQueue = async (
  chainId: number,
  block: number,
  blockHash?: string,
  delayInSeconds = 0
) => {
  return queue.add(
    `${block}-${blockHash ?? HashZero}-${delayInSeconds}`,
    {
      block,
      blockHash,
      chainId,
    },
    {
      jobId: `${block}-${blockHash ?? HashZero}-${delayInSeconds}`,
      delay: delayInSeconds * 1000,
    }
  );
};
