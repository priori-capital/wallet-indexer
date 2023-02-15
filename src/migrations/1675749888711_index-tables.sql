-- Up Migration

CREATE INDEX "usd_prices_timestamp_coingecko_index"
  ON "usd_prices" ("timestamp", "coingecko_id")
  INCLUDE ("value");

CREATE INDEX "user_activity_view_timestamp_contract_wallet_index"
  ON "user_activity_view" ("timestamp", "contract_address", "wallet_address")
  INCLUDE ("total_recieve", "receive_count", "total_transfer", "transfer_count", "total_amount", "usd_price");

CREATE INDEX "user_activity_view_contract_wallet_index"
  ON "user_activity_view" ("contract_address", "wallet_address")
  INCLUDE ("timestamp", "total_recieve", "receive_count", "total_transfer", "transfer_count", "total_amount", "usd_price");

CREATE INDEX "user_activity_view_wallet_index"
  ON "user_activity_view" ("wallet_address")
  INCLUDE ("timestamp", "contract_address", "total_recieve", "receive_count", "total_transfer", "transfer_count", "total_amount", "usd_price");


CREATE INDEX "currencies_coingecko_chain_index"
  ON "currencies" ("coingecko_id", "chain_id")
  INCLUDE ("name", "symbol", "decimals", "contract");

CREATE INDEX "currencies_coingecko_chain_contract_index"
  ON "currencies" ("coingecko_id", "chain_id", "contract")
  INCLUDE ("name", "symbol", "decimals");

-- Down Migration