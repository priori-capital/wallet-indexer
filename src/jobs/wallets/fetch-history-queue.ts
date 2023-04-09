import { idb } from "@/common/db";
import { logger } from "@/common/logger";
import { syncRedis } from "@/common/redis";
import { fromBuffer, toBuffer } from "@/common/utils";
import { config } from "@/config/index";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { randomUUID } from "crypto";
import * as walletHistoryQueue from "./wallet-history-queue";

const QUEUE_NAME = "fetch-history-queue";
const ROW_COUNT = 100;

export const queue = new Queue(QUEUE_NAME, {
  connection: syncRedis.duplicate(),
  defaultJobOptions: {
    // In order to be as lean as possible, leave retrying
    // any failed processes to be done by subsequent jobs
    removeOnComplete: true,
    //todo: will make it true, when have fallback mechanism
    removeOnFail: false,
    timeout: 60000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: syncRedis.duplicate() });

if (config.syncPacman) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      try {
        const { address, workspaceId, isWalletCached } = job.data;
        logger.info(QUEUE_NAME, `${JSON.stringify(job.data)} --- ${job.name}`);
        const limit = ROW_COUNT;
        const { count: totalCount }: { count: number } = await idb.one(
          `
              select count(1) from user_transactions ut2
              WHERE from_address = $/address/ or to_address = $/address/
`,
          {
            address: toBuffer(address),
          }
        );

        const totalBatch = Math.ceil(totalCount / ROW_COUNT);
        let batch = 1,
          skip = 0;
        while (batch <= totalBatch) {
          const userActivities: walletHistoryQueue.IRawUserTransaction[] = await idb.manyOrNone(
            `
              select * from user_transactions ut2
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
          await walletHistoryQueue.addToQueue({
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
          });
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

export const addToQueue = async (address: number, workspaceId: string, isWalletCached: boolean) => {
  await queue.add(randomUUID(), { address, workspaceId, isWalletCached });
};
