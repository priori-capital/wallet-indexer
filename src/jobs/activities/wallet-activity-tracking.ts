import { redis } from "@/common/redis";
import { getTransaction, Transaction } from "@/models/transactions";
import { isCachedWallet } from "@/utils/in-memory-cache";
import { Queue, QueueOptions } from "bullmq";

import { TransferEventData } from "./transfer-activity";

const WALLET_TRANSACTION_LOGS_QUEUE_NAME = "wallet-transaction-logs-queue";
const WALLET_TRANSACTION_LOGS_JOB_NAME = "wallet-transaction-logs";

export interface WalletActivityEvent {
  transaction: Transaction;
  transferEvent: TransferEventData;
}

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
  static async handleEvent(transferEvent: TransferEventData): Promise<void> {
    const isFromAddressTracked = await isCachedWallet(transferEvent.fromAddress);
    let isToAddressTracked = false;
    if (!isFromAddressTracked) {
      isToAddressTracked = await isCachedWallet(transferEvent.toAddress);
    }

    const isTrackedAddressTransaction = isFromAddressTracked || isToAddressTracked;

    if (isTrackedAddressTransaction) {
      const transaction = await getTransaction(
        transferEvent.chainId,
        transferEvent.transactionHash
      );
      const payload: WalletActivityEvent = {
        transaction,
        transferEvent,
      };

      await walletTransactionLogsQueue.add(WALLET_TRANSACTION_LOGS_JOB_NAME, payload);
    }
  }
}
