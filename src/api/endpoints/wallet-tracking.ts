/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, RouteOptions } from "@hapi/hapi";

import { logger } from "@/common/logger";
import { regex } from "@/common/utils";
import { isCachedWallet, enableWalletTracking } from "@/utils/in-memory-cache";
import * as fetchHistoryQueue from "../../jobs/wallets/fetch-history-queue";
import Joi from "joi";

const version = "v1";

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
  validate: {
    payload: Joi.object({
      accountId: Joi.string().uuid({ version: "uuidv4" }).required(),
      address: Joi.string().lowercase().pattern(regex.address).required(),
      workspaceId: Joi.string().lowercase().uuid({ version: "uuidv4" }).optional(),
    }),
  },
  handler: async (request: Request) => {
    const body = request.payload as { accountId: string; address: string; workspaceId: string };
    const headers = request.headers;

    const authHeader = headers["authorization"];
    if (!authHeader) throw new Error("Missing authorization header");

    const apiKey = extractApiKeyFromAuthHeader(authHeader);
    if (!apiKey) throw new Error("Invalid authorization header");

    try {
      const { accountId, address, workspaceId } = body;
      return processAddWalletRequest(accountId, address, workspaceId);
    } catch (error) {
      logger.error(`request-wallet-tracking-${version}-handler`, `Handler failure: ${error}`);
      throw error;
    }
  },
};
