-- Up Migration

CREATE TABLE "currencies_1" (
  "contract" BYTEA NOT NULL,
  "name" TEXT,
  "symbol" TEXT,
  "decimals" SMALLINT,
  "metadata" JSONB
);

CREATE TABLE "currencies_137" (
  "contract" BYTEA NOT NULL,
  "name" TEXT,
  "symbol" TEXT,
  "decimals" SMALLINT,
  "metadata" JSONB
);

ALTER TABLE "currencies_1"
  ADD CONSTRAINT "currencies_1_pk"
  PRIMARY KEY ("contract");

ALTER TABLE "currencies_137"
  ADD CONSTRAINT "currencies_137_pk"
  PRIMARY KEY ("contract");


-- Down Migration

DROP TABLE "currencies_1";
DROP TABLE "currencies_137";

