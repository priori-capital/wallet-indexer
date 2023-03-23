-- Up Migration
CREATE TABLE "tracked_wallets" (
  "address" VARCHAR NOT NULL,
  "status" smallint DEFAULT 1,
  "created_at" timestamp with time zone DEFAULT NOW()
);

ALTER TABLE "tracked_wallets"
  ADD CONSTRAINT "tracked_wallets_pk"
  PRIMARY KEY ("address");

-- Down Migration

DROP TABLE "tracked_wallets";
