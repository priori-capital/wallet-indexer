import * as userTransfersActivityEndpoints from "@/api/endpoints/user-activity/transfers";
import { getHistory } from "@/api/endpoints/balance/history";
import { Server } from "@hapi/hapi";
import { getHistoryDetails } from "./endpoints/balance/historyDetail";
import { getBalance } from "./endpoints/balance/totalbalance";

export const setupRoutes = (server: Server) => {
  server.route({
    method: "GET",
    path: "/user-transfer-activities",
    options: userTransfersActivityEndpoints.getTransfersV2Options,
  });

  server.route({
    method: "GET",
    path: "/user-activity-details",
    options: userTransfersActivityEndpoints.getTransferDetails,
  });

  server.route({
    method: "GET",
    path: "/history",
    options: getHistory,
  });

  server.route({
    method: "GET",
    path: "/history-details",
    options: getHistoryDetails,
  });

  server.route({
    method: "GET",
    path: "/balance",
    options: getBalance,
  });
};
