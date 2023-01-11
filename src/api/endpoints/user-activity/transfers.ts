/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, RouteOptions } from "@hapi/hapi";

import { logger } from "@/common/logger";
import { regex } from "@/common/utils";
import { UserActivities } from "@/models/user-activities";
import Joi from "joi";

const version = "v1";

export const getTransfersV2Options: RouteOptions = {
  description: "Historical token transfers",
  notes: "Get recent transfers for a contract or token.",
  tags: ["api", "Transfers"],
  plugins: {
    "hapi-swagger": {
      order: 10,
    },
  },
  validate: {
    query: Joi.object({
      user: Joi.string()
        .lowercase()
        .pattern(regex.address)
        .description(
          "Filter to a particular user, e.g. `0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63`"
        ),
      limit: Joi.number().integer().min(1).max(100).default(20),
      continuation: Joi.string().pattern(regex.base64),
    }),
  },
  // response: {
  //   schema: Joi.object({
  //     transfers: Joi.array().items(
  //       Joi.object({
  //         token: Joi.object({
  //           contract: Joi.string().lowercase().pattern(regex.address),
  //           decimals: Joi.string().pattern(regex.number),
  //           name: Joi.string().allow(null, ""),
  //           image: Joi.string().allow(null, ""),
  //         }),
  //         type:Joi.string(),
  //         direction:Joi.string(),
  //         from: Joi.string().lowercase().pattern(regex.address),
  //         destination: Joi.string().lowercase().pattern(regex.address),
  //         account: Joi.string().lowercase().pattern(regex.address),
  //         amount: Joi.string(),
  //         txHash: Joi.string().lowercase().pattern(regex.bytes32),
  //         block: Joi.number(),
  //         logIndex: Joi.number(),
  //         batchIndex: Joi.number(),
  //         timestamp: Joi.number(),
  //         price: Joi.number().unsafe().allow(null),
  //       })
  //     ),
  //     continuation: Joi.string().pattern(regex.base64).allow(null),
  //   }).label(`getUserErc20Transfers${version.toUpperCase()}Response`),
  //   failAction: (_request, _h, error) => {
  //     logger.error(`get-user-erc20-transfers-${version}-handler`, `Wrong response schema: ${error}`);
  //     throw error;
  //   },
  // },
  handler: async (request: Request) => {
    const query = request.query as any;
    try {
      // TODO: map result to JOI object
      return UserActivities.getActivities([query.user]);
    } catch (error) {
      logger.error(`get-users-transfers-${version}-handler`, `Handler failure: ${error}`);
      throw error;
    }
  },
};
