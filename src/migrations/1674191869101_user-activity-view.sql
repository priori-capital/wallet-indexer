-- Up Migration
CREATE TABLE "user_activity_view" (
  "timestamp" TIMESTAMPTZ NOT NULL,
  "contract_address" BYTEA NOT NULL,
  "wallet_address" BYTEA NOT NULL,
  "total_recieve" NUMERIC(78, 0) NOT NULL,
  "receive_count" NUMERIC NOT NULL,
  "total_transfer" NUMERIC(78, 0) NOT NULL,
  "transfer_count" NUMERIC NOT NULL,
  "total_amount" NUMERIC(78, 0) NOT NULL,
  "usd_price" NUMERIC NOT NULL
);

ALTER TABLE "user_activity_view"
  ADD CONSTRAINT "user_activity_view_pk"
  PRIMARY KEY ("contract_address", "timestamp", "wallet_address");

-- Down Migration