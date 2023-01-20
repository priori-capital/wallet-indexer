-- Up Migration

CREATE TABLE "currencies" (
  "contract" BYTEA NOT NULL,
  "name" TEXT,
  "symbol" TEXT,
  "decimals" SMALLINT NOT NULL,
  "metadata" JSONB,
  "chain_id" SMALLINT NOT NULL,
  "coingecko_id" TEXT NOT NULL
);

ALTER TABLE "currencies"
  ADD CONSTRAINT "currencies_pk"
  PRIMARY KEY ("contract", "chain_id");

-- Down Migration

DROP TABLE "currencies";

