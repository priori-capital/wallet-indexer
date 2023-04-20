import { syncRedis } from "@/common/redis";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { config } from "@/config/index";
import { logger } from "@/common/logger";
import { isCachedWallet, enableWalletTracking } from "@/utils/in-memory-cache";
import * as fetchHistoryQueue from "./fetch-history-queue";
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

export const processAddWalletRequest = async (
  accountId: string,
  address: string,
  workspaceId: string
) => {
  const isWalletCached = await isCachedWallet(address);

  await fetchHistoryQueue.addToQueue(address, accountId, workspaceId, isWalletCached);
  await enableWalletTracking(address, accountId);
};

if (config.syncPacman) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      try {
        logger.info(QUEUE_NAME, `${JSON.stringify(job.data)} --- ${job.name}`);

        const { accountId, address, workspaceId } = job.data;
        await processAddWalletRequest(accountId, address, workspaceId);
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
