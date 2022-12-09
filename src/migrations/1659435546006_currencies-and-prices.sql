-- Up Migration

CREATE TABLE "currencies" (
  "contract" BYTEA NOT NULL,
  "name" TEXT,
  "symbol" TEXT,
  "decimals" SMALLINT,
  "metadata" JSONB
);

ALTER TABLE "currencies"
  ADD CONSTRAINT "currencies_pk"
  PRIMARY KEY ("contract");

CREATE TABLE "usd_prices" (
  "currency" BYTEA NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  "value" NUMERIC NOT NULL
);

ALTER TABLE "usd_prices"
  ADD CONSTRAINT "usd_prices_pk"
  PRIMARY KEY ("currency", "timestamp");

-- Down Migration

DROP TABLE "currencies";
