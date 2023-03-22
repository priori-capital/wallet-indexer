import { redis } from "@/common/redis";
import { isCachedWallet } from "@/utils/in-memory-cache";
import { Queue, QueueOptions } from "bullmq";

import { TransferEventData } from "./transfer-activity";

const WALLET_TRANSACTION_LOGS_QUEUE_NAME = "wallet-transaction-logs-queue";
const WALLET_TRANSACTION_LOGS_JOB_NAME = "wallet-transaction-logs";

const queueOptions: QueueOptions = {
  connection: redis.duplicate(),
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

export const walletTransactionLogsQueue = new Queue(
  WALLET_TRANSACTION_LOGS_QUEUE_NAME,
  queueOptions
);

export class WalletActivityTracking {
  static async handleEvent(data: TransferEventData): Promise<void> {
    const isFromAddressTracked = await isCachedWallet(data.fromAddress);
    let isToAddressTracked = false;
    if (!isFromAddressTracked) {
      isToAddressTracked = await isCachedWallet(data.fromAddress);
    }

    const isTrackedAddressTransaction = isFromAddressTracked || isToAddressTracked;

    if (isTrackedAddressTransaction) {
      await walletTransactionLogsQueue.add(WALLET_TRANSACTION_LOGS_JOB_NAME, data);
    }
  }
}
