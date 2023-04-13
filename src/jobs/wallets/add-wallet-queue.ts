import { syncRedis } from "@/common/redis";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { config } from "@/config/index";
import { logger } from "@/common/logger";
import { isCachedWallet, enableWalletTracking } from "@/utils/in-memory-cache";
import { addToQueue } from "./fetch-history-queue";
import { oneDayInSeconds } from "@/utils/constants";

const QUEUE_NAME = "add-wallet-queue";

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
        const { address, workspaceId } = job.data;
        logger.info(QUEUE_NAME, `${JSON.stringify(job.data)} --- ${job.name}`);
        const isWalletCached = await isCachedWallet(address);
        await addToQueue(address, workspaceId, isWalletCached);
        await enableWalletTracking(address);
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
