/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, ResponseToolkit, RouteOptions } from "@hapi/hapi";

import { logger } from "@/common/logger";
import { regex } from "@/common/utils";
import Joi from "joi";
import { UserActivities } from "@/models/user-activities";
import { getTransaction } from "@/models/transactions";

const version = "v1";

export interface RequestTransactionLogDto {
  account_id: string;
  tx_hash: string;
  chain_id: number;
}

export const extractApiKeyFromAuthHeader = (authHeader: string) => {
  const [typePart, apiKeyPart] = authHeader.split(" ");
  if (typePart === "Bearer") return apiKeyPart;
  return null;
};

export const fetchTransactionLog: RouteOptions = {
  description: "Fetch user transaction by tx hash and chain id",
  notes: "Fetch user transaction by tx hash and chain id",
  tags: ["api", "activity"],
  plugins: {
    "hapi-swagger": {
      order: 10,
    },
  },
  auth: "webhook_client_auth",
  validate: {
    query: Joi.object({
      account_id: Joi.number().integer().min(1).required(),
      chain_id: Joi.number().integer().min(1).required(),
      tx_hash: Joi.string().pattern(regex.txhash).required(),
    }),
  },
  handler: async (request: Request, h: ResponseToolkit) => {
    const query = request.query as RequestTransactionLogDto;
    try {
      const { tx_hash: txHash, chain_id: chainId } = query;

      const transaction = await getTransaction(chainId, txHash);
      const userTransaction = UserActivities.getActivityDetails(txHash);

      return {
        transferEvent: userTransaction,
        transaction: transaction,
      };
    } catch (error) {
      logger.error(`fetch-transaction-log-${version}-handler`, `Handler failure: ${error}`);
      return h.response({ message: (error as Error).message }).code(500);
    }
  },
};
