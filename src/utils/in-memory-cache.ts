import { idb, redb } from "@/common/db";
import { logger } from "@/common/logger";
import { isEmpty } from "lodash";

const TRACKED_WALLETS = "pacman-wallets";

const inMemoryCache = () => {
  const cache: Map<string, unknown> = new Map<string, unknown>();
  return {
    get: function <T>(key: string): T {
      return cache.get(key) as T;
    },
    set: function (key: string, val: unknown) {
      cache.set(key, val);
    },
  };
};

export const cache = inMemoryCache();

export const updateWalletCache = async (address: string) => {
  logger.info("saving-wallet", `${address} getting to save in DB`);
  await saveWallet(address);
  logger.info("saving-wallet", `${address} after saving in DB`);
  const walletExists = cache.get<Record<string, boolean>>(TRACKED_WALLETS);
  if (walletExists) {
    walletExists[address] = true;
    cache.set(TRACKED_WALLETS, walletExists);
  } else {
    cache.set(TRACKED_WALLETS, { [address]: true });
  }
};

export const getCacheWallets = async (): Promise<Record<string, boolean>> => {
  const wallets = cache.get<Record<string, boolean>>(TRACKED_WALLETS);

  if (!isEmpty(wallets)) return wallets;

  const trackedWallets = await redb.manyOrNone(
    "select address from tracked_wallets where status = 1"
  );
  logger.info("save-wallet-address", `got this wallets from db ${trackedWallets?.length}`);
  return (
    trackedWallets.reduce((acc: Record<string, boolean>, address) => {
      acc[address] = true;
      return acc;
    }, {}) ?? {}
  );
};

export const saveWallet = async (address: string) => {
  logger.info("save-wallet-address", `${address} adding to tracked wallet`);
  try {
    const data = await idb.one(
      `
      INSERT INTO tracked_wallets (
        address
      ) VALUES (
        $/address/
      )
      ON CONFLICT DO NOTHING
      RETURNING
      "address"
    `,
      {
        address,
      }
    );
    logger.info("save-wallet-address", `data after saving ${JSON.stringify(data)}`);
  } catch (err: any) {
    logger.error("save-wallet-address", err.message as string);
    throw err;
  }
};

export const isCachedWallet = async (address: string) => {
  try {
    const cachedWallets: Record<string, boolean> = await getCacheWallets();
    if (!cachedWallets || !cachedWallets[address]) return false;

    return true;
  } catch (err) {
    return false;
  }
};
