import { redis } from "@/common/redis";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { config } from "@/config/index";
import { logger } from "@/common/logger";
import { idb } from "@/common/db";
import { fromBuffer, toBuffer } from "@/common/utils";
import { randomUUID } from "crypto";
import { oneDayInSeconds } from "@/utils/constants";

import * as fetchHistoryBatchQueue from "./wallet-history-batch-queue";
import { IRawUserTransaction, IWebhookHistoryPayload } from "./wallet-history-webhook-service";

const QUEUE_NAME = "fetch-history-queue";
const ROW_COUNT = 100;

export const queue = new Queue(QUEUE_NAME, {
  connection: redis.duplicate(),
  defaultJobOptions: {
    // In order to be as lean as possible, leave retrying
    // any failed processes to be done by subsequent jobs
    removeOnComplete: true,
    //todo: will make it true, when have fallback mechanism
    removeOnFail: { age: oneDayInSeconds },
    timeout: 60000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: redis.duplicate() });

if (config.syncPacman) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      try {
        const { accountId, address, workspaceId, isWalletCached } = job.data;
        logger.info(QUEUE_NAME, `${JSON.stringify(job.data)} --- ${job.name}`);
        let limit = ROW_COUNT;
        const { count }: { count: string } = await idb.one(
          `select count(1) from user_transactions ut
              WHERE from_address = $/address/ or to_address = $/address/
          `,
          {
            address: toBuffer(address),
          }
        );
        const totalCount = parseInt(count);
        logger.info(
          QUEUE_NAME,
          `History Queue with transaction count #${totalCount} of ${address} processing...`
        );

        if (!totalCount) {
          const payload = {
            address,
            batch: 0,
            totalBatch: 0,
            transactions: [],
            workspaceId,
            isWalletCached,
          };
          const eventTimestamp = new Date();
          await fetchHistoryBatchQueue.addToQueue(payload, accountId, eventTimestamp);

          logger.info(
            QUEUE_NAME,
            `History Queue returning zero transaction for ${address} for workspace ${workspaceId}`
          );
          return;
        }

        const totalBatch = Math.ceil(totalCount / ROW_COUNT);
        let batch = 1,
          skip = 0;
        while (batch <= totalBatch) {
          if (batch === totalBatch && totalCount % ROW_COUNT > 0) {
            limit = totalCount % ROW_COUNT;
            logger.info(
              QUEUE_NAME,
              `History Queue with transaction #${totalCount} of ${address} processing queue with limit ${limit} less than ${ROW_COUNT}`
            );
          }

          const userActivities: IRawUserTransaction[] = await idb.manyOrNone(
            `select *, ut.hash as ut_hash, t1.gas_used as t1_gas_used, t1.gas_price as t1_gas_price, t1.gas_fee as t1_gas_fee, t1.gas_limit as t1_gas_limit, t1.status as t1_status,
              t2.gas_used as t2_gas_used, t2.gas_price as t2_gas_price, t2.gas_fee as t2_gas_fee, t2.gas_limit as t2_gas_limit, t2.status as t2_status
              from user_transactions ut
              left outer join transactions_1 t1 ON ut.hash = t1.hash
  	          left outer join transactions_137 t2 on ut.hash = t2.hash
              WHERE from_address = $/address/ or to_address = $/address/
              ORDER BY event_timestamp ASC
              LIMIT $/limit/
              OFFSET $/skip/`,
            {
              limit,
              skip,
              address: toBuffer(address),
            }
          );

          const payload: IWebhookHistoryPayload = {
            address,
            batch,
            totalBatch,
            transactions: userActivities.map((activity) => ({
              ...activity,
              ...gasDetails(activity),
              hash: fromBuffer(activity.ut_hash),
              contract: fromBuffer(activity.contract),
              from_address: fromBuffer(activity.from_address),
              to_address: fromBuffer(activity.to_address),
              block_hash: fromBuffer(activity.block_hash),
            })),
            workspaceId,
            isWalletCached,
          };

          const timestamp = new Date();
          await fetchHistoryBatchQueue.addToQueue(payload, accountId, timestamp);

          logger.info(QUEUE_NAME, `History Queue ${batch} out of ${totalBatch} sent successfully`);

          if (userActivities?.length === ROW_COUNT) {
            skip += ROW_COUNT;
          } else {
            break;
          }
          batch++;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        logger.error(QUEUE_NAME, `${error} ${error.stack}`);
        throw error;
      }
    },
    { connection: redis.duplicate(), concurrency: 1 }
  );
  worker.on("error", (error) => {
    logger.error(QUEUE_NAME, `Worker errored: ${error}`);
  });
}

const gasDetails = (activity: IRawUserTransaction) => {
  switch (activity.chain_id) {
    case 1:
      return {
        gasUsed: activity.t1_gas_used,
        gasPrice: activity.t1_gas_price,
        gasFee: activity.t1_gas_fee,
        gasLimit: activity.t1_gas_limit,
        status: activity.t1_status,
      };
    case 137:
      return {
        gasUsed: activity.t2_gas_used,
        gasPrice: activity.t2_gas_price,
        gasFee: activity.t2_gas_fee,
        gasLimit: activity.t2_gas_limit,
        status: activity.t2_status,
      };
    default:
      return {
        gasUsed: activity.t1_gas_used,
        gasPrice: activity.t1_gas_price,
        gasFee: activity.t1_gas_fee,
        gasLimit: activity.t1_gas_limit,
        status: activity.t1_status,
      };
  }
};

export const addToQueue = async (
  address: string,
  accountId: string,
  workspaceId: string,
  isWalletCached: boolean
) => {
  await queue.add(randomUUID(), { address, accountId, workspaceId, isWalletCached });
};
