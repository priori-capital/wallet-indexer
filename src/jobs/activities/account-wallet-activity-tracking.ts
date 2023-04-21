import { syncRedis } from "@/common/redis";
import { Transaction } from "@/models/transactions";
import { randomUUID } from "crypto";
import { Job, Queue, QueueOptions, QueueScheduler, Worker } from "bullmq";
import { logger } from "@/common/logger";
import { callWebhookUrl, WebhookRequest } from "@/common/webhook";

import { TransferEventData } from "./transfer-activity";

const QUEUE_NAME = "account-wallet-transaction-logs-queue";

export interface WalletActivityEvent {
  transaction: Transaction;
  transferEvent: TransferEventData;
}

const queueOptions: QueueOptions = {
  connection: syncRedis.duplicate(),
  defaultJobOptions: {
    attempts: 10,
    removeOnComplete: 100,
    removeOnFail: false,
    backoff: {
      type: "fixed",
      delay: 5000,
    },
  },
};

new QueueScheduler(QUEUE_NAME, { connection: syncRedis.duplicate() });

export const accountWalletTransactionLogsQueue = new Queue(QUEUE_NAME, queueOptions);

const worker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    try {
      const { webhookRequest, eventName, eventTimestamp } = job.data;
      const { response } = await callWebhookUrl(webhookRequest, eventName, eventTimestamp);

      if (!response?.success) await job.retry();
      return true;
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

export const addToQueue = async (
  webhookRequest: WebhookRequest,
  eventName: string,
  eventTimestamp: Date
) => {
  await accountWalletTransactionLogsQueue.add(randomUUID(), {
    webhookRequest,
    eventName,
    eventTimestamp,
  });
};
