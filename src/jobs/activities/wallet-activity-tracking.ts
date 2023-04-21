import { syncRedis } from "@/common/redis";
import { getTransaction, Transaction } from "@/models/transactions";
import { isCachedWallet } from "@/utils/in-memory-cache";
import { Queue, QueueOptions } from "bullmq";
import { logger } from "@/common/logger";
import { callWebhookUrl, getWebhookRequestsForAddress, WebhookRequest } from "@/common/webhook";

import { TransferEventData } from "./transfer-activity";
import * as accountWalletActivityTracking from "./account-wallet-activity-tracking";
const WALLET_TRANSACTION_LOGS_QUEUE_NAME = "wallet-transaction-logs-queue";

const EVENT_NAME = "NEW_TRANSACTION";

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

export const walletTransactionLogsQueue = new Queue(
  WALLET_TRANSACTION_LOGS_QUEUE_NAME,
  queueOptions
);

const getCacheKey = (accountId: string, txHash: string) => `${accountId}:${txHash}`;

const invokeWebhookEndpoints = async (
  transferEvent: TransferEventData,
  payload: WalletActivityEvent
) => {
  const txHash = transferEvent.transactionHash;

  const accountTransactionCache = new Map<string, WebhookRequest>();
  const webhookRequestsForSender = await getWebhookRequestsForAddress(transferEvent.fromAddress);
  const webhookRequestsForRecipient = await getWebhookRequestsForAddress(transferEvent.fromAddress);

  for (const webhookRequest of webhookRequestsForSender) {
    const { accountId } = webhookRequest;
    const cacheKey = getCacheKey(accountId, txHash);
    accountTransactionCache.set(cacheKey, { ...webhookRequest, data: payload });
  }

  for (const webhookRequest of webhookRequestsForRecipient) {
    const { accountId } = webhookRequest;
    const cacheKey = getCacheKey(accountId, txHash);
    accountTransactionCache.set(cacheKey, { ...webhookRequest, data: payload });
  }

  const webhookRequests = accountTransactionCache.values();

  const eventTimestamp = new Date(transferEvent.timestamp);

  for await (const webhookRequest of webhookRequests) {
    await accountWalletActivityTracking.addToQueue(webhookRequest, EVENT_NAME, eventTimestamp);
  }
};

export class WalletActivityTracking {
  static async handleEvent(transferEvent: TransferEventData): Promise<void> {
    try {
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
        logger.info(`WalletActivityTracker`, `Tracking: TxHash: ${transaction?.hash}`);
        logger.info(
          `WalletActivityTracker`,
          `Adding Job Data: chainId: ${transferEvent?.chainId},  TxHash: ${transferEvent?.transactionHash}`
        );

        await invokeWebhookEndpoints(transferEvent, payload);
      }
    } catch (err) {
      logger.info(
        `WalletActivityTracker`,
        `chainId: ${transferEvent?.chainId},  TxHash: ${transferEvent?.transactionHash}`
      );
      logger.error(`WalletActivityTracker`, `${err}`);
      throw err;
    }
  }
}
