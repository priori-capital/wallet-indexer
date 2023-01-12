-- Up Migration
CREATE TABLE "usd_prices" (
  "currency" BYTEA NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  "value" NUMERIC NOT NULL,
  "chain_id" NUMERIC NOT NULL,
  "coingecko_id" TEXT NOT NULL
);

ALTER TABLE "usd_prices"
  ADD CONSTRAINT "usd_prices_pk"
  PRIMARY KEY ("currency", "chain_id", "timestamp");

-- Down Migration
DROP TABLE "usd_prices";
