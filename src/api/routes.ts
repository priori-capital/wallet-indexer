// import * as userTransfersActivityEndpoints from "@/api/endpoints/user-activity/transfers";
import * as accounts from "@/api/endpoints/accounts/account";
// import { getHistory } from "@/api/endpoints/balance/history";
import { Server } from "@hapi/hapi";
// import { getHistoryDetails } from "./endpoints/balance/historyDetail";
// import { getBalance } from "./endpoints/balance/totalbalance";
// import { getAssetsDetails } from "./endpoints/balance/assetDetail";
import * as trackWalletEndpoints from "./endpoints/wallet-tracking";
import { addressLatestAddres } from "./endpoints/wallet/latest-activity";

export const setupRoutes = (server: Server) => {
  server.route({
    method: "POST",
    path: "/register-app",
    options: accounts.registerApp,
  });

  server.route({
    method: "POST",
    path: "/update-app",
    options: accounts.updateApp,
  });

  // server.route({
  //   method: "GET",
  //   path: "/user-transfer-activities",
  //   options: userTransfersActivityEndpoints.getTransfersV2Options,
  // });

  // server.route({
  //   method: "GET",
  //   path: "/user-activity-details",
  //   options: userTransfersActivityEndpoints.getTransferDetails,
  // });

  // server.route({
  //   method: "GET",
  //   path: "/history",
  //   options: getHistory,
  // });

  // server.route({
  //   method: "GET",
  //   path: "/history-details",
  //   options: getHistoryDetails,
  // });

  // server.route({
  //   method: "GET",
  //   path: "/balance",
  //   options: getBalance,
  // });

  // server.route({
  //   method: "GET",
  //   path: "/assets",
  //   options: getAssetsDetails,
  // });

  server.route({
    method: "POST",
    path: "/track-wallet",
    options: trackWalletEndpoints.requestWalletTracking,
  });

  server.route({
    method: "GET",
    path: "/address/{address}/latest",
    options: addressLatestAddres,
  });
};
