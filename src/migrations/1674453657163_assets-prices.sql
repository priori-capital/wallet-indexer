-- Up Migration

create or replace view assets_with_price as
select c.*, up.value as price, up."timestamp" as timestamp from currencies c
inner join usd_prices up
on c.coingecko_id = up.coingecko_id;

-- Down Migration
DROP view "assets_with_price";
