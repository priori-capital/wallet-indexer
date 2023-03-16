import { syncRedis } from "@/common/redis";
import { Queue, QueueScheduler, Worker } from "bullmq";
import { config } from "@/config/index";
import { logger } from "@/common/logger";

const QUEUE_NAME = "add-wallet-queue";

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

// BACKGROUND WORKER ONLY
// if (1 === 1) {
const worker = new Worker(
  QUEUE_NAME,
  async (job: any) => {
    try {
      logger.info(QUEUE_NAME, `${JSON.stringify(job.data)} --- ${job.name}`);
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
// }
