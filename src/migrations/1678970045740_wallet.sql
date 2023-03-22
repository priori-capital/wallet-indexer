-- Up Migration
CREATE TABLE "pacman_wallets" (
  "address" VARCHAR NOT NULL,
  "status" smallint DEFAULT 1,
  "created_at" timestamp with time zone DEFAULT NOW()
);

ALTER TABLE "pacman_wallets"
  ADD CONSTRAINT "pacman_wallets_pk"
  PRIMARY KEY ("address");

-- Down Migration