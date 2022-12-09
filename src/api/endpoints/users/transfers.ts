/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, RouteOptions } from "@hapi/hapi";

import { redb } from "@/common/db";
import { logger } from "@/common/logger";
import { buildContinuation, formatEth, fromBuffer, regex, toBuffer } from "@/common/utils";
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
      // contract: Joi.string()
      //   .lowercase()
      //   .pattern(regex.address)
      //   .description(
      //     "Filter to a particular contract, e.g. `0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63`"
      //   ),
      // token: Joi.string()
      //   .lowercase()
      //   .pattern(regex.token)
      //   .description(
      //     "Filter to a particular token, e.g. `0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63:123`"
      //   ),
      // collection: Joi.string()
      //   .lowercase()
      //   .description(
      //     "Filter to a particular collection, e.g. `0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63`"
      //   ),
      // attributes: Joi.object()
      //   .unknown()
      //   .description("Filter to a particular attribute, e.g. `attributes[Type]=Original`"),
      limit: Joi.number().integer().min(1).max(100).default(20),
      continuation: Joi.string().pattern(regex.base64),
    }),
    // .oxor("contract", "token", "collection")
    // .or("contract", "token", "collection")
    // .with("attributes", "collection"),
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
  //   }).label(`getUsersErc20Transfers${version.toUpperCase()}Response`),
  //   failAction: (_request, _h, error) => {
  //     logger.error(`get-users-erc20-transfers-${version}-handler`, `Wrong response schema: ${error}`);
  //     throw error;
  //   },
  // },
  handler: async (request: Request) => {
    const query = request.query as any;
    try {
      // Associating sales to transfers is done by searching for transfer
      // and sale events that occurred close to each other. In most cases
      // we will first have the transfer followed by the sale but we have
      // some exceptions.
      let baseQuery = `select * from user_activities ua`;
      // Filters
      const conditions: string[] = [];
      if (query.user) {
        query.user = toBuffer(query.user);
        conditions.push(`ua.address = $/user/`);
      }

      if (conditions.length) {
        baseQuery += " WHERE " + conditions.map((c) => `(${c})`).join(" AND ");
      }

      // Sorting
      baseQuery += `
        ORDER BY
          ua.event_timestamp DESC
      `;

      // Pagination
      baseQuery += ` LIMIT $/limit/`;
      const rawResult = await redb.manyOrNone(baseQuery, query);

      let continuation = null;
      if (rawResult.length === query.limit) {
        continuation = buildContinuation(
          rawResult[rawResult.length - 1].event_timestamp
          // +
          // "_" +
          // rawResult[rawResult.length - 1].log_index +
          // "_" +
          // rawResult[rawResult.length - 1].batch_index
        );
      }

      const result = rawResult.map((r) => ({
        type: r.type,
        direction: r.direction,
        token: r.token,
        from: fromBuffer(r.from_address),
        destination: fromBuffer(r.to_address),
        amount: String(r.amount),
        account: fromBuffer(r.address),
        block: r.block,
        txHash: fromBuffer(r.hash),
        logIndex: r.metadata.logIndex,
        batchIndex: r.metadata.batchIndex,
        timestamp: r.eventTimestamp,
        price: r.price ? formatEth(r.price) : null,
      }));
      return {
        transfers: result,
        continuation,
      };
    } catch (error) {
      logger.error(`get-users-transfers-${version}-handler`, `Handler failure: ${error}`);
      throw error;
    }
  },
};
