-- Up Migration

CREATE TABLE "transaction_traces_1" (
  "hash" BYTEA NOT NULL,
  "calls" JSONB NOT NULL
);

CREATE TABLE "transaction_traces_137" (
  "hash" BYTEA NOT NULL,
  "calls" JSONB NOT NULL
);

ALTER TABLE "transaction_traces_1"
  ADD CONSTRAINT "transaction_traces_1_pk"
  PRIMARY KEY ("hash");

ALTER TABLE "transaction_traces_137"
  ADD CONSTRAINT "transaction_traces_137_pk"
  PRIMARY KEY ("hash");

-- Down Migration

DROP TABLE "transaction_traces_1";

DROP TABLE "transaction_traces_137";
