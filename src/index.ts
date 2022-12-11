import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import "@/common/tracer";
import "@/jobs/index";

// import { start } from "@/api/index";
import { logger } from "@/common/logger";
import { config } from "@/config/index";
import { ethereumNetworks, getNetworkSettings } from "@/config/network";
import { initiateProviders } from "./common/provider";

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

// setup().then(() => start());
ethereumNetworks.forEach((network) => {
  setup(network.networkId).then(() => console.log("setup service for ", network.name));
});
// setup().then(() => console.log("testing microservices"));
