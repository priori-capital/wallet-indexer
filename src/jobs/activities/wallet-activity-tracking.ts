import { redis } from '@/common/redis';
import { Queue, QueueOptions } from 'bullmq';

import { TransferEventData } from './transfer-activity';

const WALLET_TRANSACTION_LOGS_QUEUE_NAME = "wallet-transaction-logs-queue";
const WALLET_TRANSACTION_LOGS_JOB_NAME = "wallet-transaction-logs";

const queueOptions: QueueOptions = {
  connection: redis.duplicate(),
  defaultJobOptions: {
    attempts: 10,
    removeOnComplete: 100,
    removeOnFail: 50000,
    backoff: {
      type: "fixed",
      delay: 5000,
    },
  },
}; 

export const walletTransactionLogsQueue = new Queue(WALLET_TRANSACTION_LOGS_QUEUE_NAME, queueOptions);

export class WalletActivityTracking {
  // TODO: Write logic to read tracked wallets from cache
  private static async getTrackedWallets(): Promise<string[]> {
    return [];
  }

  // TODO: Write logic to check, from cache, if address is a tracked wallets
  private static async isTrackedWalletAddress(address: string): Promise<boolean> {
    return false;
  }

  static async handleEvent(data: TransferEventData): Promise<void> {
    const trackedWallets = await WalletActivityTracking.getTrackedWallets();

    const isFromAddressTracked = await WalletActivityTracking.isTrackedWalletAddress(data.fromAddress);
    let isToAddressTracked = false;
    if (!isFromAddressTracked) {
      isToAddressTracked = await WalletActivityTracking.isTrackedWalletAddress(data.fromAddress);
    }

    const isTrackedAddressTransaction = isFromAddressTracked || isToAddressTracked;

    if (isTrackedAddressTransaction) {
      await walletTransactionLogsQueue.add(WALLET_TRANSACTION_LOGS_JOB_NAME, data);
    }
  }
}
