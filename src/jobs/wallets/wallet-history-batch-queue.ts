import { syncRedis } from "@/common/redis";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { config } from "@/config/index";
import { logger } from "@/common/logger";
import { randomUUID } from "crypto";
import * as walletHistoryQueue from "./wallet-history-webhook-service";
import { oneDayInSeconds } from "@/utils/constants";

const QUEUE_NAME = "wallet-history-batch-queue";

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
        const { payload, accountId, timestamp } = job.data;

        await walletHistoryQueue.invokeWebhookEndpoints(payload, accountId, timestamp);
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
  payload: Record<string, any>,
  accountId: number,
  timestamp: Date
) => {
  // console.log(randomUUID(), { payload, accountId, timestamp });
  await queue.add(randomUUID(), { payload, accountId, timestamp });
};
