-- Up Migration

CREATE TABLE "currencies-1" (
  "contract" BYTEA NOT NULL,
  "name" TEXT,
  "symbol" TEXT,
  "decimals" SMALLINT,
  "metadata" JSONB
);

CREATE TABLE "currencies-137" (
  "contract" BYTEA NOT NULL,
  "name" TEXT,
  "symbol" TEXT,
  "decimals" SMALLINT,
  "metadata" JSONB
);

ALTER TABLE "currencies-1"
  ADD CONSTRAINT "currencies-1_pk"
  PRIMARY KEY ("contract");

ALTER TABLE "currencies-137"
  ADD CONSTRAINT "currencies-137_pk"
  PRIMARY KEY ("contract");

CREATE TABLE "usd_prices-1" (
  "currency" BYTEA NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  "value" NUMERIC NOT NULL
);


CREATE TABLE "usd_prices-137" (
  "currency" BYTEA NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL,
  "value" NUMERIC NOT NULL
);

ALTER TABLE "usd_prices-1"
  ADD CONSTRAINT "usd_prices-1_pk"
  PRIMARY KEY ("currency", "timestamp");

ALTER TABLE "usd_prices-137"
  ADD CONSTRAINT "usd_prices-137_pk"
  PRIMARY KEY ("currency", "timestamp");

-- Down Migration

DROP TABLE "currencies-1";
DROP TABLE "currencies-137";
DROP TABLE "usd_prices-1";
DROP TABLE "usd_prices-137";
