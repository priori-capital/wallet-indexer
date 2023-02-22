/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { idb, pgp } from "@/common/db";
import axios from "axios";
import moment from "moment";

const wait = async (time: number) => new Promise((r) => setTimeout(r, time));

const getCoinHistory = async (id: string) =>
  axios
    .get(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart/range?vs_currency=usd&from=1420070400&to=${new Date().getTime()}`
    )
    .then((res: any) => res.data?.prices);

const getTime = (time: number) => {
  const a = moment.unix(time).utc();
  console.log(a.toISOString(), "checking time");
  return a.toISOString();
};

const backfillUsdPrice = async () => {
  const results = await idb.manyOrNone(
    `
          SELECT
            distinct coingecko_id
          FROM currencies
        `
  );
  for (const result of results) {
    try {
      const data: any[] = await getCoinHistory(result.coingecko_id);
      const usdPrices = data.map((x) => ({
        coingecko_id: result.coingecko_id,
        timestamp: getTime(x[0] / 1000),
        value: x[1],
      }));
      const columns = new pgp.helpers.ColumnSet(["coingecko_id", "timestamp", "value"], {
        table: "usd_prices",
      });
      const queries = `
      INSERT INTO "usd_prices" (
            coingecko_id,
            timestamp,
            value
          ) VALUES ${pgp.helpers.values(usdPrices, columns)}
        ON CONFLICT DO NOTHING`;
      await idb.none(pgp.helpers.concat([queries]));
      await wait(6000);
    } catch (err) {
      console.log(err, "error");
    }
  }
};

backfillUsdPrice().then(() => console.log("completed backfill"));
