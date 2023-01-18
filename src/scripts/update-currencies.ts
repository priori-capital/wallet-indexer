/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();
import data from "./data/erc20tokenlist1674058920336.json";
import { idb } from "@/common/db";
import { toBuffer } from "@/common/utils";

const seedAssets = async () => {
  await Promise.all(
    data.map(async (x) => {
      const { name, symbol, decimals, id, image } = x;
      const metadata = { coingeckoId: id, image };
      const dbrows = [];
      if (x.ethereum) {
        dbrows.push({ currencyAddress: x.ethereum, chainId: 1 });
      }
      if (x.polygonpos) {
        dbrows.push({ currencyAddress: x.polygonpos, chainId: 137 });
      }
      await Promise.all(
        dbrows.map((row) => {
          idb.none(
            `
                INSERT INTO "currencies-${row.chainId}" (
                    contract,
                    name,
                    symbol,
                    decimals,
                    metadata
                ) VALUES (
                    $/contract/,
                    $/name/,
                    $/symbol/,
                    $/decimals/,
                    $/metadata:json/
                ) ON CONFLICT DO NOTHING
                `,
            {
              contract: toBuffer(row.currencyAddress),
              name,
              symbol,
              decimals,
              metadata,
            }
          );
        })
      );
    })
  );
};

seedAssets().then(() => console.log("Seeding completed for asset currencies"));
