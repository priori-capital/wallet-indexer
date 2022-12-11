-- Up Migration

CREATE TABLE "currencies-137" (
  "contract" BYTEA NOT NULL,
  "name" TEXT,
  "symbol" TEXT,
  "decimals" SMALLINT,
  "metadata" JSONB
);

ALTER TABLE "currencies-137"
  ADD CONSTRAINT "currencies-137_pk"
  PRIMARY KEY ("contract");

CREATE TABLE "usd_prices-137" (
  "currency" BYTEA NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  "value" NUMERIC NOT NULL
);

ALTER TABLE "usd_prices-137"
  ADD CONSTRAINT "usd_prices-137_pk"
  PRIMARY KEY ("currency", "timestamp");

-- Down Migration

DROP TABLE "currencies-137";
