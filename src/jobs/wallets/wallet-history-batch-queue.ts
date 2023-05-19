import { redis } from "@/common/redis";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { config } from "@/config/index";
import { logger } from "@/common/logger";
import { randomUUID } from "crypto";
import * as walletHistoryQueue from "./wallet-history-webhook-service";
import { oneDayInSeconds } from "@/utils/constants";

const QUEUE_NAME = "wallet-history-batch-queue";

export const queue = new Queue(QUEUE_NAME, {
  connection: redis.duplicate(),
  defaultJobOptions: {
    // In order to be as lean as possible, leave retrying
    // any failed processes to be done by subsequent jobs
    removeOnComplete: true,
    //todo: will make it true, when have fallback mechanism
    removeOnFail: { age: oneDayInSeconds },
    timeout: 60000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: redis.duplicate() });

if (config.syncPacman) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      try {
        const { payload, accountId, timestamp } = job.data;

        await walletHistoryQueue.invokeWebhookEndpoints(payload, accountId, timestamp);
      } catch (error) {
        logger.error(QUEUE_NAME, `${error}`);
        throw error;
      }
    },
    { connection: redis.duplicate(), concurrency: 1 }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worker.on("error", (error: any) => {
    logger.error(QUEUE_NAME, `Worker errored: ${error.stack}`);
  });
}

export const addToQueue = async (
  payload: walletHistoryQueue.IWebhookHistoryPayload,
  accountId: number,
  timestamp: Date
) => {
  await queue.add(randomUUID(), { payload, accountId, timestamp });
};
