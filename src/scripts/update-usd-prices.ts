/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import moment from "moment";

import { idb } from "@/common/db";
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

const fetchAssetMarketPriceInUSD = async () => {
  const assetsWithUSDPricesURL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10`;
  const assetsWithUSDPrices = await axios
    .get(assetsWithUSDPricesURL, { timeout: 10 * 1000 })
    .then(({ data }): any => data);
  return assetsWithUSDPrices.map(
    (asset: { id: string; current_price: string; last_updated: string }) => {
      return {
        id: asset.id,
        usdPrice: asset.current_price,
        timestamp: moment(asset.last_updated).unix(),
      };
    }
  );
};

const seedAssets = async () => {
  const assetsWithUSDPrices = await fetchAssetMarketPriceInUSD();
  await Promise.all(
    assetsWithUSDPrices.map((row: { id: any; timestamp: any; usdPrice: any }) => {
      idb.none(
        `
          INSERT INTO "usd_prices" (
            coingecko_id,
            timestamp,
            value
          ) VALUES (
            $/coingeckoCurrencyId/,
            date_trunc('day', to_timestamp($/timestamp/)),
            $/value/
          ) ON CONFLICT DO NOTHING
        `,
        {
          coingeckoCurrencyId: row.id,
          timestamp: row.timestamp,
          value: row.usdPrice,
        }
      );
    })
  );
};

seedAssets().then(() => console.log("Seeding completed for asset usd prices"));
