/* eslint-disable no-fallthrough */

// Any new network that is supported should have a corresponding
// entry in the configuration methods below

import { idb } from "@/common/db";
import { config } from "@/config/index";

export const ethereumNetworks = [
  {
    id: 1,
    networkId: 1,
    name: "Ethereum",
    decimals: 18,
    color: "#690497",
    symbol: "ETH",
    historyHost: "https://etherscan.io/",
    alias: "ethereum",
    rpc: "https://eth-mainnet.g.alchemy.com/v2/",
    ws: "wss://eth-mainnet.g.alchemy.com/v2/",
  },
  {
    id: 137,
    networkId: 137,
    name: "Polygon",
    decimals: 18,
    color: "#690496",
    symbol: "MATIC",
    historyHost: "https://polygonscan.com/",
    alias: "matic",
    rpc: "https://eth-mainnet.g.alchemy.com/v2/",
    ws: "wss://eth-mainnet.g.alchemy.com/v2/",
  },
];

export const getNetworkName = (chainId = 1) => {
  switch (chainId) {
    case 1:
      return "mainnet";
    case 5:
      return "goerli";
    case 10:
      return "optimism";
    case 137:
      return "polygon";
    default:
      return "unknown";
  }
};

export const getServiceName = (chainId = 1) => {
  const isRailway = config.railwayStaticUrl !== "";
  return `indexer-${isRailway ? "" : "fc-"}${config.version}-${getNetworkName(chainId)}`;
};
// todo: can we initate provider here?
export type NetworkSettings = {
  enableWebSocket: boolean;
  enableReorgCheck: boolean;
  reorgCheckFrequency: number[];
  realtimeSyncFrequencySeconds: number;
  realtimeSyncMaxBlockLag: number;
  backfillBlockBatchSize: number;
  coingecko?: {
    networkId: string;
  };
  onStartup?: () => Promise<void>;
  rpc: string;
  ws: string;
  chainId: number;
};

export const getNetworkSettings = (chainId = 1): NetworkSettings => {
  const defaultNetworkSettings: NetworkSettings = {
    enableWebSocket: true,
    enableReorgCheck: true,
    realtimeSyncFrequencySeconds: 15,
    realtimeSyncMaxBlockLag: 16,
    backfillBlockBatchSize: 16,
    reorgCheckFrequency: [1, 5, 10, 30, 60],
    rpc: "https://eth-mainnet.g.alchemy.com/v2/erYSuGZK8mNfFhMVvUIKAHw08kP6wTq0",
    ws: "wss://eth-mainnet.g.alchemy.com/v2/erYSuGZK8mNfFhMVvUIKAHw08kP6wTq0",
    chainId: 1,
  };

  switch (chainId) {
    // Ethereum
    case 1:
      return {
        ...defaultNetworkSettings,
        coingecko: {
          networkId: "ethereum",
        },
        onStartup: async () => {
          // Insert the native currency
          await Promise.all([
            idb.none(
              `
                INSERT INTO "currencies-1" (
                  contract,
                  name,
                  symbol,
                  decimals,
                  metadata
                ) VALUES (
                  '\\x0000000000000000000000000000000000000000',
                  'Ether',
                  'ETH',
                  18,
                  '{"coingeckoCurrencyId": "ethereum", "image": "https://assets.coingecko.com/coins/images/279/large/ethereum.png"}'
                ) ON CONFLICT DO NOTHING
              `
            ),
          ]);
        },
        rpc: "https://eth-mainnet.g.alchemy.com/v2/erYSuGZK8mNfFhMVvUIKAHw08kP6wTq0",
        ws: "wss://eth-mainnet.g.alchemy.com/v2/erYSuGZK8mNfFhMVvUIKAHw08kP6wTq0",
        chainId: 1,
      };
    // Goerli
    case 5: {
      return {
        ...defaultNetworkSettings,
        backfillBlockBatchSize: 128,
        onStartup: async () => {
          // Insert the native currency
          await Promise.all([
            idb.none(
              `
                INSERT INTO currencies (
                  contract,
                  name,
                  symbol,
                  decimals,
                  metadata
                ) VALUES (
                  '\\x0000000000000000000000000000000000000000',
                  'Ether',
                  'ETH',
                  18,
                  '{}'
                ) ON CONFLICT DO NOTHING
              `
            ),
          ]);
        },
        rpc: "https://eth-goerli.g.alchemy.com/v2/45D7qyrzT4Lm7s586NoSQgpTeQeB5AEf",
        ws: "wss://eth-goerli.g.alchemy.com/v2/45D7qyrzT4Lm7s586NoSQgpTeQeB5AEf",
        chainId: 137,
      };
    }
    // Optimism
    case 10: {
      return {
        ...defaultNetworkSettings,
        enableWebSocket: false,
        enableReorgCheck: false,
        realtimeSyncFrequencySeconds: 10,
        realtimeSyncMaxBlockLag: 128,
        backfillBlockBatchSize: 512,
        coingecko: {
          networkId: "optimistic-ethereum",
        },
        onStartup: async () => {
          // Insert the native currency
          await Promise.all([
            idb.none(
              `
                INSERT INTO "currencies" (
                  contract,
                  name,
                  symbol,
                  decimals,
                  metadata
                ) VALUES (
                  '\\x0000000000000000000000000000000000000000',
                  'Ether',
                  'ETH',
                  18,
                  '{"coingeckoCurrencyId": "ethereum", "image": "https://assets.coingecko.com/coins/images/279/large/ethereum.png"}'
                ) ON CONFLICT DO NOTHING
              `
            ),
          ]);
        },
        rpc: "https://eth-mainnet.g.alchemy.com/v2/",
        ws: "wss://eth-mainnet.g.alchemy.com/v2/",
      };
    }
    // Polygon
    case 137: {
      return {
        ...defaultNetworkSettings,
        enableWebSocket: false,
        enableReorgCheck: true,
        realtimeSyncFrequencySeconds: 10,
        realtimeSyncMaxBlockLag: 128,
        backfillBlockBatchSize: 20,
        reorgCheckFrequency: [30],
        coingecko: {
          networkId: "polygon-pos",
        },
        onStartup: async () => {
          // Insert the native currency
          await Promise.all([
            idb.none(
              `
                INSERT INTO "currencies-137" (
                  contract,
                  name,
                  symbol,
                  decimals,
                  metadata
                ) VALUES (
                  '\\x0000000000000000000000000000000000000000',
                  'Matic',
                  'MATIC',
                  18,
                  '{"coingeckoCurrencyId": "matic-network"}'
                ) ON CONFLICT DO NOTHING
              `
            ),
          ]);
        },
        rpc: "https://eth-mainnet.g.alchemy.com/v2/erYSuGZK8mNfFhMVvUIKAHw08kP6wTq0",
        ws: "wss://eth-mainnet.g.alchemy.com/v2/erYSuGZK8mNfFhMVvUIKAHw08kP6wTq0",
        chainId: 137,
      };
    }
    // Default
    default:
      return {
        ...defaultNetworkSettings,
      };
  }
};
