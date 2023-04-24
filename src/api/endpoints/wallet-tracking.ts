/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, ResponseToolkit, RouteOptions } from "@hapi/hapi";

import { logger } from "@/common/logger";
import { regex } from "@/common/utils";
import { isCachedWallet, enableWalletTracking } from "@/utils/in-memory-cache";
import * as fetchHistoryQueue from "../../jobs/wallets/fetch-history-queue";
import Joi from "joi";

const version = "v1";

export interface RequestWalletTrackingDto {
  address: string;
  workspaceId: string;
}

export const processAddWalletRequest = async (
  accountId: string,
  address: string,
  workspaceId: string
) => {
  const isWalletCached = await isCachedWallet(address);

  try {
    await fetchHistoryQueue.addToQueue(address, accountId, workspaceId, isWalletCached);
    await enableWalletTracking(accountId, address);
    return { success: true };
  } catch (err) {
    logger.error("WalletTracking", (err as Error).message);
    return { success: false };
  }
};

export const extractApiKeyFromAuthHeader = (authHeader: string) => {
  const [typePart, apiKeyPart] = authHeader.split(" ");
  if (typePart === "Bearer") return apiKeyPart;
  return null;
};

export const requestWalletTracking: RouteOptions = {
  description: "Request tracking for a wallet address",
  notes: "Request tracking for a wallet address using apiKey.",
  tags: ["api", "tracking", "wallet"],
  plugins: {
    "hapi-swagger": {
      order: 10,
    },
  },
  auth: "webhook_client_auth",
  validate: {
    query: Joi.object({
      account_id: Joi.number().integer().min(1).required(),
    }),
    payload: Joi.object({
      address: Joi.string().lowercase().pattern(regex.address).required(),
      workspaceId: Joi.string().lowercase().uuid({ version: "uuidv4" }).optional(),
    }),
  },
  handler: async (request: Request, h: ResponseToolkit) => {
    const body = request.payload as RequestWalletTrackingDto;
    const accountId = request.query.account_id;

    try {
      const { address, workspaceId } = body;
      return processAddWalletRequest(accountId, address, workspaceId);
    } catch (error) {
      logger.error(`request-wallet-tracking-${version}-handler`, `Handler failure: ${error}`);
      return h.response({ message: (error as Error).message }).code(500);
    }
  },
};
