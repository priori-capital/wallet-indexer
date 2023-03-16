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

export const updateWalletCache = (address: string) => {
  const walletExists: string[] = cache.get("pacman-wallets");
  if (walletExists) {
    walletExists.push(address);
    cache.set("pacman-wallets", walletExists);
  } else {
    cache.set("pacman-wallets", [address]);
  }
};

export const getCacheWallets = (): string[] => {
  return cache.get("pacman-wallets") ?? [];
};
