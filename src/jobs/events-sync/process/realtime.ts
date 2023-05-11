import { Queue, QueueScheduler, Worker } from "bullmq";
import { randomUUID } from "crypto";

import { logger } from "@/common/logger";
import { redis } from "@/common/redis";
import { config } from "@/config/index";
import { EventsInfo, processEvents } from "@/events-sync/handlers";
import _ from "lodash";
import { oneDayInSeconds } from "@/utils/constants";

const QUEUE_NAME = "events-sync-process-realtime";

export const queue = new Queue(QUEUE_NAME, {
  connection: redis.duplicate(),
  defaultJobOptions: {
    attempts: 10,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: 100,
    removeOnFail: { count: 10000, age: oneDayInSeconds },
    timeout: 120000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: redis.duplicate() });

// BACKGROUND WORKER ONLY
if (config.doBackgroundWork) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const info = job.data as EventsInfo;

      try {
        await processEvents(info);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        logger.error(QUEUE_NAME, `Events processing failed: ${error.stack}`);
        throw error;
      }
    },
    { connection: redis.duplicate(), concurrency: 20 }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worker.on("error", (error: any) => {
    logger.error(QUEUE_NAME, `Worker errored: ${error.stack}`);
  });
}

export const addToQueue = async (infos: EventsInfo[]) => {
  const jobs: { name: string; data: EventsInfo }[] = [];
  infos.map((info) => {
    if (!_.isEmpty(info.events)) {
      jobs.push({ name: randomUUID(), data: info });
    }
  });

  if (!_.isEmpty(jobs)) {
    await queue.addBulk(jobs);
  }
};
