import { Interface } from "@ethersproject/abi";
import { Contract } from "@ethersproject/contracts";
import axios from "axios";

import { idb, redb } from "@/common/db";
import { logger } from "@/common/logger";
import { getProvider } from "@/common/provider";
import { fromBuffer, toBuffer } from "@/common/utils";
import { getNetworkSettings } from "@/config/network";
import { storeUSDPrice } from "../prices";

type CurrencyMetadata = {
  coingeckoCurrencyId?: string;
  image?: string;
};

export type Currency = {
  contract: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  metadata?: CurrencyMetadata;
};

const CURRENCY_MEMORY_CACHE: Map<string, Currency> = new Map<string, Currency>();

export const getCurrency = async (
  currencyAddress: string,
  chainId: number,
  timestamp?: number
): Promise<Currency> => {
  if (!CURRENCY_MEMORY_CACHE.has(currencyAddress)) {
    const result = await idb.oneOrNone(
      `
        SELECT
          currencies.name,
          currencies.symbol,
          currencies.decimals,
          currencies.metadata
        FROM "currencies" as currencies
        WHERE currencies.contract = $/contract/ and currencies.chain_id = $/chainId/
      `,
      {
        contract: toBuffer(currencyAddress),
        chainId,
      }
    );

    if (result) {
      CURRENCY_MEMORY_CACHE.set(currencyAddress, {
        contract: currencyAddress,
        name: result.name,
        symbol: result.symbol,
        decimals: result.decimals,
        metadata: result.metadata,
      });
    } else {
      let name: string | undefined;
      let symbol: string | undefined;
      let decimals: number | undefined;
      let metadata: CurrencyMetadata | undefined;
      let coingeckoId: string | undefined;

      // If the currency is not available, then we try to retrieve its details
      try {
        ({ name, symbol, decimals, metadata, coingeckoId } = await tryGetCurrencyDetails(
          currencyAddress,
          chainId,
          timestamp
        ));
      } catch (error) {
        logger.error(
          "currencies",
          `Failed to initially fetch ${currencyAddress} currency details: ${error}`
        );

        // Retry fetching the currency details
        // await currenciesQueue.addToQueue({ currency: currencyAddress, chainId: chainId });
      }

      metadata = metadata || {};

      await idb.none(
        `
          INSERT INTO "currencies" (
            contract,
            name,
            symbol,
            decimals,
            metadata,
            chain_id,
            coingecko_id
          ) VALUES (
            $/contract/,
            $/name/,
            $/symbol/,
            $/decimals/,
            $/metadata:json/,
            $/chainId/,
            $/coingeckoId/
          ) ON CONFLICT DO NOTHING
        `,
        {
          contract: toBuffer(currencyAddress),
          name,
          symbol,
          decimals,
          metadata,
          chainId,
          coingeckoId,
        }
      );

      CURRENCY_MEMORY_CACHE.set(currencyAddress, {
        contract: currencyAddress,
        name,
        symbol,
        decimals,
        metadata,
      });
    }
  }

  return CURRENCY_MEMORY_CACHE.get(currencyAddress)!;
};

export const tryGetCurrencyDetails = async (
  currencyAddress: string,
  chainId: number,
  timestamp?: number
) => {
  // `name`, `symbol` and `decimals` are fetched from on-chain
  const iface = new Interface([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ]);

  const contract = new Contract(currencyAddress, iface, getProvider(chainId));
  const name = await contract.name();
  const symbol = await contract.symbol();
  const decimals = await contract.decimals();
  const metadata: CurrencyMetadata = {};
  let usdPrice = 0;
  const coingeckoNetworkId = getNetworkSettings(chainId).coingecko?.networkId;

  if (coingeckoNetworkId) {
    const result: {
      id?: string;
      image?: { large?: string };
      market_data: {
        current_price: { [symbol: string]: number };
      };
    } = await axios
      .get(
        `https://api.coingecko.com/api/v3/coins/${coingeckoNetworkId}/contract/${currencyAddress}`,
        { timeout: 10 * 1000 }
      )
      .then((response) => response.data);
    if (result.id) {
      metadata.coingeckoCurrencyId = result.id;
    }
    if (result.image?.large) {
      metadata.image = result.image.large;
    }
    usdPrice = result?.market_data?.current_price?.["usd"];

    if (metadata.coingeckoCurrencyId && timestamp && usdPrice) {
      storeUSDPrice(metadata.coingeckoCurrencyId, timestamp, usdPrice);
    }
  }

  return {
    name,
    symbol,
    decimals,
    metadata,
    coingeckoId: coingeckoNetworkId,
    chainId,
  };
};

let assets: { [key: string]: string[] } = {};

export const prepareAssetsList = async () => {
  const rawAssets = await redb.many(`select contract, chain_id as "chainId" from currencies c;`);
  assets = rawAssets.reduce((result, asset) => {
    const data: string = fromBuffer(asset.contract);
    if (result[asset.chainId]) result[asset.chainId].push(data);
    else result[asset.chainId] = [data];
    return result;
  }, {});
};

export const getAssetsList = (chainId: number) => assets[chainId];

export const isValidAsset = (address: string, chainId: number) => {
  if (!address || !chainId) return false;
  return getAssetsList(chainId)?.includes(address);
};
