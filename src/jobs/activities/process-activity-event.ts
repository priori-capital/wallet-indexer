/* eslint-disable @typescript-eslint/no-explicit-any */

import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { randomUUID } from "crypto";
import _ from "lodash";

import { logger } from "@/common/logger";
import { redis } from "@/common/redis";
import { config } from "@/config/index";
import { TransferActivity, TransferEventData } from "@/jobs/activities/transfer-activity";

const QUEUE_NAME = "process-activity-event-queue";

export const queue = new Queue(QUEUE_NAME, {
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
});
new QueueScheduler(QUEUE_NAME, { connection: redis.duplicate() });

// BACKGROUND WORKER ONLY
if (config.doBackgroundWork) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const { kind, data } = job.data as EventInfo;

      switch (kind) {
        case EventKind.erc20TransferEvent:
          await TransferActivity.handleEvent(data as TransferEventData);
          break;
      }
    },
    { connection: redis.duplicate(), concurrency: 15 }
  );

  worker.on("error", (error) => {
    logger.error(QUEUE_NAME, `Worker errored: ${error}`);
  });
}

export enum EventKind {
  erc20TransferEvent = "erc20TransferEvent",
}

export type EventInfo = {
  kind: EventKind.erc20TransferEvent;
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
