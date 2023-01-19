import { AddressZero } from "@ethersproject/constants";
import * as Sdk from "@reservoir0x/sdk";
import axios from "axios";

import { idb } from "@/common/db";
import { logger } from "@/common/logger";
import { bn } from "@/common/utils";
import { getNetworkSettings } from "@/config/network";
import { getCurrency } from "@/utils/currencies";

// const USD_DECIMALS = 6;
// TODO: This should be a per-network setting
const NATIVE_UNIT = bn("1000000000000000000");

export type Price = {
  coingeckoCurrencyId: string;
  timestamp: number;
  value: string;
};

export const storeUSDPrice = async (
  coingeckoCurrencyId: string,
  timestamp: number,
  value: number
) => {
  await idb.none(
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
      coingeckoCurrencyId,
      timestamp: timestamp,
      value,
    }
  );
};

const getUpstreamUSDPrice = async (
  currencyAddress: string,
  timestamp: number,
  chainId = 1
): Promise<Price | undefined> => {
  try {
    const date = new Date(timestamp * 1000);
    const truncatedTimestamp = Math.floor(date.valueOf() / 1000);

    const currency = await getCurrency(currencyAddress, chainId, truncatedTimestamp);
    const coingeckoCurrencyId = currency?.metadata?.coingeckoCurrencyId;

    if (coingeckoCurrencyId) {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const url = `https://api.coingecko.com/api/v3/coins/${coingeckoCurrencyId}/history?date=${day}-${month}-${year}`;
      logger.info("prices", `Fetching price from Coingecko: ${url}`);

      const result: {
        market_data: {
          current_price: { [symbol: string]: number };
        };
      } = await axios.get(url, { timeout: 10 * 1000 }).then((response) => response.data);

      const usdPrice = result?.market_data?.current_price?.["usd"];
      if (usdPrice) {
        storeUSDPrice(coingeckoCurrencyId, truncatedTimestamp, usdPrice);
        return {
          coingeckoCurrencyId: coingeckoCurrencyId,
          timestamp: truncatedTimestamp,
          value: usdPrice.toString(),
        };
      }
    }
  } catch (error) {
    logger.error(
      "prices",
      `Failed to fetch upstream USD price for ${currencyAddress} and timestamp ${timestamp}: ${error}`
    );
  }

  return undefined;
};

const getCachedUSDPrice = async (
  coingeckoCurrencyId: string,
  timestamp: number
): Promise<Price | undefined> =>
  idb
    .oneOrNone(
      `
        SELECT
          extract('epoch' from usd_prices.timestamp) AS "timestamp",
          usd_prices.value
        FROM "usd_prices" as usd_prices
        WHERE usd_prices.coingecko_id = $/coingeckoId/
          AND usd_prices.timestamp <= date_trunc('day', to_timestamp($/timestamp/))
        ORDER BY usd_prices.timestamp DESC
        LIMIT 1
      `,
      {
        coingeckoId: coingeckoCurrencyId,
        timestamp,
      }
    )
    .then((data) =>
      data
        ? {
            coingeckoCurrencyId: coingeckoCurrencyId,
            timestamp: data.timestamp,
            value: data.value,
          }
        : undefined
    )
    .catch(() => undefined);

const USD_PRICE_MEMORY_CACHE = new Map<string, Price>();

const getAvailableUSDPrice = async (coingeckoCurrencyId: string, timestamp: number) => {
  // At the moment, we support day-level granularity for prices
  const DAY = 24 * 3600;

  const normalizedTimestamp = Math.floor(timestamp / DAY);
  const key = `${coingeckoCurrencyId}-${normalizedTimestamp}`.toLowerCase();
  if (!USD_PRICE_MEMORY_CACHE.has(key)) {
    // If the price is not available in the memory cache, use any available database cached price
    let cachedPrice = await getCachedUSDPrice(coingeckoCurrencyId, timestamp);
    if (
      // If the database cached price is not available
      !cachedPrice ||
      // Or if the database cached price is stale (older than what is requested)
      Math.floor(cachedPrice.timestamp / DAY) !== normalizedTimestamp
    ) {
      // Then try to fetch the price from upstream
      const upstreamPrice = await getUpstreamUSDPrice(coingeckoCurrencyId, timestamp);
      if (upstreamPrice) {
        cachedPrice = upstreamPrice;
      }
    }

    if (cachedPrice) {
      USD_PRICE_MEMORY_CACHE.set(key, cachedPrice);
    }
  }

  return USD_PRICE_MEMORY_CACHE.get(key);
};

type USDAndNativePrices = {
  usdPrice?: string;
  nativePrice?: string;
};

export const getUSDAndNativePrices = async (
  currencyAddress: string,
  price: string,
  timestamp: number,
  chainId: number,
  options?: {
    onlyUSD?: boolean;
  }
): Promise<USDAndNativePrices> => {
  let usdPrice: string | undefined;
  let nativePrice: string | undefined;

  const currency = await getCurrency(currencyAddress, chainId, timestamp);

  // Only try to get pricing data if the network supports it
  const force = false; // TODO: check if main network then make force = true
  // chainId === 5 && currencyAddress === "0x2f3a40a3db8a7e3d09b0adfefbce4f6f81927557";
  if (getNetworkSettings().coingecko?.networkId || force) {
    const currencyUSDPrice = await getAvailableUSDPrice(
      currency?.metadata?.coingeckoCurrencyId || "ethereum",
      timestamp
    );

    let nativeUSDPrice: Price | undefined;
    //TODO: check this later
    if (!options?.onlyUSD) {
      nativeUSDPrice = await getAvailableUSDPrice(AddressZero, timestamp);
    }

    if (currency.decimals && currencyUSDPrice) {
      const currencyUnit = bn(10).pow(currency.decimals);
      usdPrice = bn(price).mul(currencyUSDPrice.value).div(currencyUnit).toString();
      if (nativeUSDPrice) {
        nativePrice = bn(price)
          .mul(currencyUSDPrice.value)
          .mul(NATIVE_UNIT)
          .div(nativeUSDPrice.value)
          .div(currencyUnit)
          .toString();
      }
    }
  }

  // Make sure to handle the case where the currency is the native one (or the wrapped equivalent)
  if (
    [Sdk.Common.Addresses.Eth[chainId], Sdk.Common.Addresses.Weth[chainId]].includes(
      currencyAddress
    )
  ) {
    nativePrice = price;
  }

  return { usdPrice, nativePrice };
};
