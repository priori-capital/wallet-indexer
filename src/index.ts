import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import "@/common/tracer";
import "@/jobs/index";

import { start } from "@/api/index";
import { logger } from "@/common/logger";
import { config } from "@/config/index";
import { ethereumNetworks, getNetworkSettings } from "@/config/network";
import { initiateProviders } from "./common/provider";
import { prepareAssetsList } from "./utils/currencies";

process.on("unhandledRejection", (error) => {
  logger.error("process", `Unhandled rejection: ${error}`);
});

const setup = async (chainId: number) => {
  if (config.doBackgroundWork) {
    const networkSettings = getNetworkSettings(chainId);
    if (networkSettings.onStartup) {
      await networkSettings.onStartup();
    }
    initiateProviders(networkSettings);
  }
};

const syncAllNetworks = async () => {
  await prepareAssetsList();
  const setupAll = ethereumNetworks.map((network) => setup(network.networkId));
  await Promise.all(setupAll);
};
syncAllNetworks().then(() => start());
