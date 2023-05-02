-- Up Migration

ALTER TABLE "tracked_wallets" DROP CONSTRAINT tracked_wallets_pk;
ALTER TABLE "tracked_wallets" ADD CONSTRAINT tracked_wallets_pk PRIMARY KEY ("address", "account_id");

-- Down Migration

ALTER TABLE "tracked_wallets" DROP CONSTRAINT tracked_wallets_pk;
ALTER TABLE "tracked_wallets" ADD CONSTRAINT tracked_wallets_pk PRIMARY KEY ("address");
