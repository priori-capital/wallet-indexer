import { syncRedis } from "@/common/redis";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { config } from "@/config/index";
import { logger } from "@/common/logger";
import { idb } from "@/common/db";
import { fromBuffer, toBuffer } from "@/common/utils";
import { randomUUID } from "crypto";
import { oneDayInSeconds } from "@/utils/constants";

import * as fetchHistoryBatchQueue from "./wallet-history-batch-queue";
import { IRawUserTransaction, IWebhookHistoryPayload } from "./wallet-history-webhook-service";

const QUEUE_NAME = "fetch-history-queue";
const ROW_COUNT = 100;

export const queue = new Queue(QUEUE_NAME, {
  connection: syncRedis.duplicate(),
  defaultJobOptions: {
    // In order to be as lean as possible, leave retrying
    // any failed processes to be done by subsequent jobs
    removeOnComplete: true,
    //todo: will make it true, when have fallback mechanism
    removeOnFail: { age: oneDayInSeconds },
    timeout: 60000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: syncRedis.duplicate() });

if (config.syncPacman) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      try {
        const { accountId, address, workspaceId, isWalletCached } = job.data;
        logger.info(QUEUE_NAME, `${JSON.stringify(job.data)} --- ${job.name}`);
        let limit = ROW_COUNT;
        const { count }: { count: string } = await idb.one(
          `select count(1) from user_transactions ut
              WHERE from_address = $/address/ or to_address = $/address/
          `,
          {
            address: toBuffer(address),
          }
        );
        const totalCount = parseInt(count);
        logger.info(
          QUEUE_NAME,
          `History Queue with transaction count #${totalCount} of ${address} processing... ${typeof totalCount}`
        );

        if (!totalCount) {
          const payload = {
            address,
            batch: 0,
            totalBatch: 0,
            transactions: [],
            workspaceId,
            isWalletCached,
          };
          const eventTimestamp = new Date();
          await fetchHistoryBatchQueue.addToQueue(payload, accountId, eventTimestamp);

          logger.info(
            QUEUE_NAME,
            `History Queue returning zero transaction for ${address} for workspace ${workspaceId}`
          );
          return;
        }

        const totalBatch = Math.ceil(totalCount / ROW_COUNT);
        let batch = 1,
          skip = 0;
        while (batch <= totalBatch) {
          if (batch === totalBatch && totalCount % ROW_COUNT > 0) {
            limit = totalCount % ROW_COUNT;
            logger.info(
              QUEUE_NAME,
              `History Queue with transaction #${totalCount} of ${address} processing queue with limit ${limit} less than ${ROW_COUNT}`
            );
          }

          const userActivities: IRawUserTransaction[] = await idb.manyOrNone(
            `select * from user_transactions ut
              WHERE from_address = $/address/ or to_address = $/address/
              ORDER BY event_timestamp ASC
              LIMIT $/limit/
              OFFSET $/skip/`,
            {
              limit,
              skip,
              address: toBuffer(address),
            }
          );

          const payload: IWebhookHistoryPayload = {
            address,
            batch,
            totalBatch,
            transactions: userActivities.map((activity) => ({
              ...activity,
              hash: fromBuffer(activity.hash),
              contract: fromBuffer(activity.contract),
              from_address: fromBuffer(activity.from_address),
              to_address: fromBuffer(activity.to_address),
              block_hash: fromBuffer(activity.block_hash),
            })),
            workspaceId,
            isWalletCached,
          };

          const timestamp = new Date();
          await fetchHistoryBatchQueue.addToQueue(payload, accountId, timestamp);

          logger.info(QUEUE_NAME, `History Queue ${batch} out of ${totalBatch} sent successfully`);

          if (userActivities?.length === ROW_COUNT) {
            skip += ROW_COUNT;
          } else {
            break;
          }
          batch++;
        }
      } catch (error) {
        logger.error(QUEUE_NAME, `${error}`);
        throw error;
      }
    },
    { connection: syncRedis.duplicate(), concurrency: 1 }
  );
  worker.on("error", (error) => {
    logger.error(QUEUE_NAME, `Worker errored: ${error}`);
  });
}

export const addToQueue = async (
  address: string,
  accountId: string,
  workspaceId: string,
  isWalletCached: boolean
) => {
  await queue.add(randomUUID(), { address, accountId, workspaceId, isWalletCached });
};
