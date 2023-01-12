-- Up Migration
CREATE TABLE "usd_prices" (
  "currency" BYTEA NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  "value" NUMERIC NOT NULL,
  "chain_d" NUMERIC NOT NULL,
  "coingecko_id" TEXT NOT NULL,
);

ALTER TABLE "usd_prices"
  ADD CONSTRAINT "usd_prices_pk"
  PRIMARY KEY ("currency", "chainId", "timestamp");

-- Down Migration
DROP TABLE "usd_prices-1";
