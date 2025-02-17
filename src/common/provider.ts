import { StaticJsonRpcProvider, WebSocketProvider } from "@ethersproject/providers";
import Arweave from "arweave";

import { logger } from "@/common/logger";
import { NetworkSettings } from "@/config/network";

// Use a static provider to avoid redundant `eth_chainId` calls
// export const baseProvider=(rpc:string, chainId=1) => new StaticJsonRpcProvider(rpc, chainId);
const providers: { [key: string]: { rpc: StaticJsonRpcProvider } } = {};

export const initiateProviders = (network: NetworkSettings) => {
  providers[network.chainId] = {
    rpc: new StaticJsonRpcProvider(network.rpc, network.chainId),
  };
};

export const getProvider = (chainId: number) => providers[chainId].rpc;

// https://github.com/ethers-io/ethers.js/issues/1053#issuecomment-808736570
export const safeWebSocketSubscription = (
  wsUrl: string,
  callback: (provider: WebSocketProvider) => Promise<void>
) => {
  const webSocketProvider = new WebSocketProvider(wsUrl);
  webSocketProvider.on("error", (error) => {
    logger.error("websocket-provider", `WebSocket subscription failed: ${error}`);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webSocketProvider._websocket.on("error", (error: any) => {
    logger.error("websocket-provider", `WebSocket subscription failed: ${error}`);
  });

  let pingTimeout: NodeJS.Timeout | undefined;
  let keepAliveInterval: NodeJS.Timer | undefined;

  const EXPECTED_PONG_BACK = 15000;
  const KEEP_ALIVE_CHECK_INTERVAL = 7500;
  webSocketProvider._websocket.on("open", async () => {
    keepAliveInterval = setInterval(() => {
      webSocketProvider._websocket.ping();

      pingTimeout = setTimeout(() => {
        webSocketProvider._websocket.terminate();
      }, EXPECTED_PONG_BACK);
    }, KEEP_ALIVE_CHECK_INTERVAL);

    await callback(webSocketProvider);
  });

  webSocketProvider._websocket.on("close", () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
    if (pingTimeout) {
      clearTimeout(pingTimeout);
    }
    safeWebSocketSubscription(wsUrl, callback);
  });

  webSocketProvider._websocket.on("pong", () => {
    if (pingTimeout) {
      clearInterval(pingTimeout);
    }
  });
};

export const arweaveGateway = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});
