import { syncRedis } from "@/common/redis";
import { Queue, QueueScheduler } from "bullmq";
import { logger } from "@/common/logger";
import { oneDayInSeconds } from "@/utils/constants";
import { callWebhookUrl, getWebhookRequestsForAddress } from "@/common/webhook";

const QUEUE_NAME = "wallet-history-queue";

export interface IRawUserTransaction {
  hash: Buffer;
  type: string;
  contract: Buffer;
  from_address: Buffer;
  to_address: Buffer;
  amount: number;
  metadata: {
    logIndex: number;
    BatchIndex: number;
  };
  block_hash: Buffer;
  block: number;
  event_timestamp: number;
  chain_id: number;
  created_at: Date;
}
export interface IUserTransaction {
  hash: string;
  type: string;
  contract: string;
  from_address: string;
  to_address: string;
  amount: number;
  metadata: {
    logIndex: number;
    BatchIndex: number;
  };
  block_hash: string;
  block: number;
  event_timestamp: number;
  chain_id: number;
  created_at: Date;
}

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

export const invokeWebhookEndpoints = async (payload: {
  address: string;
  batch: number;
  totalBatch: number;
  transactions: IUserTransaction[];
  workspaceId: string;
  isWalletCached: boolean;
}) => {
  const { address, batch, totalBatch } = payload;

  // TODO: Correct log message
  logger.info(QUEUE_NAME, `Added Batch #${batch} of transction to queue for ${address}`);

  const webhookRequests = await getWebhookRequestsForAddress(payload.address);

  for await (const webhookRequest of webhookRequests) {
    try {
      const { response } = await callWebhookUrl({ ...webhookRequest, data: payload });

      if (!response?.success) {
        throw new Error(response?.message);
      }

      // TODO: Correct log message
      logger.info(QUEUE_NAME, `History Queue ${batch} out of ${totalBatch} sent successfully`);
    } catch (err) {
      // TODO: Correct log message
      logger.info(QUEUE_NAME, `Error: History Queue ${batch} out of ${totalBatch}`);
      throw err;
    }
  }
};

export const addToQueue = async (data: {
  address: string;
  batch: number;
  totalBatch: number;
  transactions: IUserTransaction[];
  workspaceId: string;
  isWalletCached: boolean;
}) => {
  logger.info(QUEUE_NAME, `Added Batch #${data.batch} of transction to queue for ${data.address}`);
  await queue.add("wallet-history-job", data);
};
