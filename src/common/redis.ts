import { BulkJobOptions, RedisOptions } from "bullmq";
import { randomUUID } from "crypto";
import Redis from "ioredis";
import Redlock from "redlock";

import { config } from "@/config/index";

// TODO: Research using a connection pool rather than
// creating a new connection every time, as we do now.

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const redisSubscriber = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const rateLimitRedis = new Redis(config.rateLimitRedisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  enableOfflineQueue: false,
  commandTimeout: 1000,
});

// https://redis.io/topics/distlock
export const redlock = new Redlock([redis.duplicate()], { retryCount: 0 });

// Common types

export type BullMQBulkJob = {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  opts?: BulkJobOptions;
};

export const acquireLock = async (name: string, expirationInSeconds = 0) => {
  const id = randomUUID();
  let acquired;

  if (expirationInSeconds) {
    acquired = await redis.set(name, id, "EX", expirationInSeconds, "NX");
  } else {
    acquired = await redis.set(name, id, "NX");
  }

  return acquired === "OK";
};

export const extendLock = async (name: string, expirationInSeconds: number) => {
  const id = randomUUID();
  const extended = await redis.set(name, id, "EX", expirationInSeconds, "XX");
  return extended === "OK";
};

export const releaseLock = async (name: string) => {
  await redis.del(name);
};

export const getLockExpiration = async (name: string) => {
  return await redis.ttl(name);
};

const syncRedisConfig: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

if (config.syncRedisTls === true) {
  syncRedisConfig.tls = {
    host: config.syncRedisHost,
    port: config.syncRedisPort,
    checkServerIdentity: () => undefined,
  };
}

export const syncRedis = new Redis(config.syncRedisUrl, syncRedisConfig);
