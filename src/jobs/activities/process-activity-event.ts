/* eslint-disable @typescript-eslint/no-explicit-any */

import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { randomUUID } from "crypto";
import _ from "lodash";

import { logger } from "@/common/logger";
import { redis } from "@/common/redis";
import { config } from "@/config/index";
import { TransferActivity, TransferEventData } from "@/jobs/activities/transfer-activity";
import { WalletActivityTracking } from "@/jobs/activities/wallet-activity-tracking";
import { oneDayInSeconds } from "@/utils/constants";

const QUEUE_NAME = "process-activity-event-queue";

export const queue = new Queue(QUEUE_NAME, {
  connection: redis.duplicate(),
  defaultJobOptions: {
    attempts: 10,
    removeOnComplete: true,
    // TODO: Set to true after fallback mechanism is added to repo
    removeOnFail: { age: oneDayInSeconds },
    backoff: {
      type: "fixed",
      delay: 5000,
    },
  },
});
new QueueScheduler(QUEUE_NAME, { connection: redis.duplicate() });

// BACKGROUND WORKER ONLY
if (config.doBackgroundWork) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      try {
        const { kind, data } = job.data as EventInfo;

        switch (kind) {
          case EventKind.erc20TransferEvent:
            await TransferActivity.handleEvent(data as TransferEventData);
            break;
          case EventKind.nativeTransferEvent:
            await TransferActivity.handleEvent(data as TransferEventData);
            break;
        }

        await WalletActivityTracking.handleEvent(data as TransferEventData);
      } catch (err) {
        logger.error(QUEUE_NAME, `${err}`);
        throw err;
      }
    },
    { connection: redis.duplicate(), concurrency: 50 }
  );

  worker.on("error", (error) => {
    logger.error(QUEUE_NAME, `Worker errored: ${error}`);
  });
}

export enum EventKind {
  erc20TransferEvent = "erc20TransferEvent",
  nativeTransferEvent = "nativeTransferEvent",
}

export type EventInfo = {
  kind: EventKind;
  data: TransferEventData;
  context?: string;
};

export const addToQueue = async (events: EventInfo[]) => {
  await queue.addBulk(
    _.map(events, (event) => ({
      name: randomUUID(),
      data: event,
      opts: {
        jobId: event.context,
      },
    }))
  );
};
