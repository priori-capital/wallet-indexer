import { idb } from "@/common/db";

const PACMAN_WALLETS = "pacman-wallets";

const inMemoryCache = () => {
  const cache: Map<string, unknown> = new Map<string, unknown>();
  return {
    get: function (key: string): any {
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
  const walletExists: string[] = cache.get(PACMAN_WALLETS);
  if (walletExists) {
    walletExists.push(address);
    cache.set(PACMAN_WALLETS, walletExists);
  } else {
    cache.set(PACMAN_WALLETS, [address]);
  }
};

export const getCacheWallets = async (): Promise<string[]> => {
  let wallets: string[] = cache.get(PACMAN_WALLETS);
  if (!wallets) {
    wallets = await idb.many("select address from pacman_wallets");
  }
  return wallets ?? [];
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
