-- Up Migration
CREATE TABLE "usd_prices" (
  "timestamp" TIMESTAMPTZ NOT NULL,
  "value" NUMERIC NOT NULL,
  "coingecko_id" TEXT NOT NULL);

ALTER TABLE "usd_prices"
  ADD CONSTRAINT "usd_prices_pk"
  PRIMARY KEY ("coingecko_id");

-- Down Migration
DROP TABLE "usd_prices";
