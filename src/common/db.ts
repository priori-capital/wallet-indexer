import PgPromise from "pg-promise";

import { config } from "@/config/index";

export const pgp = PgPromise();

const ssl: { rejectUnauthorized?: boolean } = {};
if (config.databaseSSL) {
  ssl.rejectUnauthorized = false;
}
// Database connection for external public-facing APIs
export const edb1 = pgp({
  connectionString:
    "postgres://postgres:fS3IHKK82grxeF4X7bMQ@indexer-db.cpzqu7zonmga.ap-south-1.rds.amazonaws.com:5432/indexer",
  keepAlive: true,
  max: 60,
  connectionTimeoutMillis: 10 * 1000,
  query_timeout: 10 * 1000,
  statement_timeout: 10 * 1000,
  allowExitOnIdle: true,
  ...ssl,
});

// Database connection for internal processes/APIs
export const idb = pgp({
  connectionString: config.databaseUrl,
  keepAlive: true,
  max: 60,
  connectionTimeoutMillis: 30 * 1000,
  query_timeout: 5 * 60 * 1000,
  statement_timeout: 5 * 60 * 1000,
  allowExitOnIdle: true,
  ...ssl,
});

// Database connection for health checks
export const hdb = pgp({
  connectionString: config.databaseUrl,
  keepAlive: true,
  max: 5,
  connectionTimeoutMillis: 30 * 1000,
  query_timeout: 10 * 1000,
  statement_timeout: 10 * 1000,
  allowExitOnIdle: true,
  ...ssl,
});

// Database connection for external public-facing APIs using a read replica DB
export const redb = pgp({
  connectionString: config.readReplicaDatabaseUrl,
  keepAlive: true,
  max: 60,
  connectionTimeoutMillis: 10 * 1000,
  query_timeout: 10 * 1000,
  statement_timeout: 10 * 1000,
  allowExitOnIdle: true,
  ...ssl,
});

// Database connection for internal processes/APIs using a read replica DB
export const ridb = pgp({
  connectionString: config.readReplicaDatabaseUrl,
  keepAlive: true,
  max: 60,
  connectionTimeoutMillis: 30 * 1000,
  query_timeout: 5 * 60 * 1000,
  statement_timeout: 5 * 60 * 1000,
  allowExitOnIdle: true,
  ...ssl,
});

// Common types

export type PgPromiseQuery = {
  query: string;
  values?: object;
};
