-- Up Migration

CREATE TABLE "transactions_1" (
  "hash" BYTEA NOT NULL,
  "from" BYTEA NOT NULL,
  "to" BYTEA NOT NULL,
  "value" NUMERIC NOT NULL,
  -- Optimization: force the `data` column to be TOASTed
  "data" BYTEA,
  "block_number" INT,
  "block_timestamp" INT,
  "gas_used" NUMERIC,
  "gas_price" NUMERIC,
  "gas_fee" NUMERIC
);

CREATE TABLE "transactions_137" (
  "hash" BYTEA NOT NULL,
  "from" BYTEA NOT NULL,
  "to" BYTEA NOT NULL,
  "value" NUMERIC NOT NULL,
  -- Optimization: force the `data` column to be TOASTed
  "data" BYTEA,
  "block_number" INT,
  "block_timestamp" INT,
  "gas_used" NUMERIC,
  "gas_price" NUMERIC,
  "gas_fee" NUMERIC
);

ALTER TABLE "transactions_1"
  ADD CONSTRAINT "transactions_1_pk"
  PRIMARY KEY ("hash");

ALTER TABLE "transactions_137"
  ADD CONSTRAINT "transactions_137_pk"
  PRIMARY KEY ("hash");


CREATE INDEX "transactions_1_to_index"
  ON "transactions_1" ("to");

CREATE INDEX "transactions_137_to_index"
  ON "transactions_137" ("to");

-- Down Migration

DROP TABLE "transactions_1";
DROP TABLE "transactions_137";
