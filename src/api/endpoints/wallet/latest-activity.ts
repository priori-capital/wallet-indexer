import { idb } from "@/common/db";
import { logger } from "@/common/logger";
import { fromBuffer, regex, toBuffer } from "@/common/utils";
import { Request, ResponseToolkit, RouteOptions } from "@hapi/hapi";
import Joi from "joi";

export const addressLatestAddres: RouteOptions = {
  description: "Request for a address latest activity",
  notes: "Request for a address for getting latest activity of all the chains.",
  tags: ["api", "tracking", "wallet"],
  plugins: {
    "hapi-swagger": {
      order: 11,
    },
  },
  auth: "webhook_client_auth",
  validate: {
    params: Joi.object({
      address: Joi.string().lowercase().pattern(regex.address).required(),
    }),
  },
  handler: async (request: Request, h: ResponseToolkit) => {
    const address = request.params.address;

    try {
      const result = await idb.manyOrNone(
        `select distinct on (chain_id) chain_id , *  from user_transactions ut 
          where from_address = $/address/ or to_address = $/address/ 
          order by chain_id, ut.event_timestamp desc;`,
        { address: toBuffer(address) }
      );
      logger.info(
        `address-latest-transaction-api`,
        `For address: ${address} found ${result.length} transactions`
      );
      return result.map((activity) => ({
        type: activity.type,
        txHash: fromBuffer(activity.hash),
        fromAddress: fromBuffer(activity.from_address),
        toAddress: fromBuffer(activity.to_address),
        contract: fromBuffer(activity.contract),
        amount: activity.amount,
        blockNumber: activity.block,
        logIndex: activity.metadata?.logIndex || null,
        batchIndex: activity.metadata?.batchIndex || null,
        timestamp: activity.event_timestamp,
        chainId: activity.chain_id,
      }));
    } catch (error) {
      logger.error(`address-latest-transaction-api`, `Handler failure: ${error}`);
      return h.response({ message: (error as Error).message }).code(500);
    }
  },
};
