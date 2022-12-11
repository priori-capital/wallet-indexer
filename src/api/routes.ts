import * as userTransfersActivityEndpoints from "@/api/endpoints/user-activity/transfers";
import { Server } from "@hapi/hapi";

export const setupRoutes = (server: Server) => {
  server.route({
    method: "GET",
    path: "/user-transfer-activity",
    options: userTransfersActivityEndpoints.getTransfersV2Options,
  });
};
