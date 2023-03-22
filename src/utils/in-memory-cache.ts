import { idb } from "@/common/db";

const PACMAN_WALLETS = "pacman-wallets";

const inMemoryCache = () => {
  const cache: Map<string, unknown> = new Map<string, unknown>();
  return {
    get: function (key: string): unknown {
      return cache.get(key);
    },
    set: function (key: string, val: unknown) {
      cache.set(key, val);
    },
  };
};

export const cache = inMemoryCache();

export const updateWalletCache = async (address: string) => {
  await saveWallet(address);
  const walletExists: Record<string, boolean> = cache.get(PACMAN_WALLETS);
  if (walletExists) {
    walletExists[address] = true;
    cache.set(PACMAN_WALLETS, walletExists);
  } else {
    cache.set(PACMAN_WALLETS, { [address]: true });
  }
};

export const getCacheWallets = async (): Promise<Record<string, boolean>> => {
  let wallets: string[] = cache.get(PACMAN_WALLETS);
  if (!wallets) {
    wallets = await idb.manyOrNone("select address from pacman_wallets where status = 1");
    // wallets = await idb.many("select address from pacman_wallets where status = 1");
  }
  return (
    wallets.reduce((acc: Record<string, boolean>, address) => {
      acc[address] = true;
      return acc;
    }, {}) ?? {}
  );
};

export const saveWallet = async (address: string) => {
  return idb.none(
    `
      INSERT INTO pacman_wallets (
        address
      ) VALUES (
        $/address/
      )
      ON CONFLICT DO NOTHING
    `,
    {
      address,
    }
  );
};

export const isCachedWallet = async (address: string) => {
  const cachedWallets: Record<string, boolean> = await getCacheWallets();

  if (!cachedWallets || !cachedWallets[address]) return false;

  return true;
};
