import { syncRedis } from "@/common/redis";
import { Queue, QueueScheduler, Worker } from "bullmq";
import { config } from "@/config/index";
import { logger } from "@/common/logger";
import { redb } from "@/common/db";
import { toBuffer } from "@/common/utils";
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
    async (job: any) => {
      try {
        const { address } = job.data;
        logger.info(QUEUE_NAME, `${JSON.stringify(job.data)} --- ${job.name}`);
        const limit = ROW_COUNT;
        let batch = 0,
          skip = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const userActivities: walletHistoryQueue.IUserTransaction[] = await redb.manyOrNone(
            `select * from user_transactions ua
             WHERE from_address = $/address/ or to_address = $/address/
             ORDER BY created_at ASC
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
            batch: ++batch,
            transactions: userActivities,
          });
          if (userActivities?.length === ROW_COUNT) {
            skip += ROW_COUNT;
          } else {
            break;
          }
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

export const addToQueue = async (address: number) => {
  await queue.add(randomUUID(), { address });
};
