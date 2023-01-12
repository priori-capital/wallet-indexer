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


-- Down Migration

DROP TABLE "currencies-1";
DROP TABLE "currencies-137";

