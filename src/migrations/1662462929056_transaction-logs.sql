-- Up Migration

CREATE TABLE "transaction_logs_1" (
  "hash" BYTEA NOT NULL,
  "logs" JSONB NOT NULL
);

CREATE TABLE "transaction_logs_137" (
  "hash" BYTEA NOT NULL,
  "logs" JSONB NOT NULL
);


ALTER TABLE "transaction_logs_1"
  ADD CONSTRAINT "transaction_logs_1_pk"
  PRIMARY KEY ("hash");

ALTER TABLE "transaction_logs_137"
  ADD CONSTRAINT "transaction_logs_137_pk"
  PRIMARY KEY ("hash");

-- Down Migration

DROP TABLE "transaction_logs_1";
DROP TABLE "transaction_logs_137";
