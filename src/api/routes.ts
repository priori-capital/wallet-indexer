import * as userTransfersActivityEndpoints from "@/api/endpoints/user-activity/transfers";
import { Server } from "@hapi/hapi";

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
    options: userTransfersActivityEndpoints.getHistory,
  });
};
