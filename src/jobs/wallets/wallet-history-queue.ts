import { syncRedis } from "@/common/redis";
import { Queue, QueueScheduler } from "bullmq";
import { logger } from "@/common/logger";

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
    removeOnFail: false,
    timeout: 60000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: syncRedis.duplicate() });

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
