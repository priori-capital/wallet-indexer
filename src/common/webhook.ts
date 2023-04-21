/* eslint-disable @typescript-eslint/no-explicit-any */

import axios, { AxiosRequestConfig } from "axios";
import { uniqueId } from "lodash";
import { logger } from "./logger";
import { idb } from "./db";

export interface WebhookRequest {
  accountId: string;
  authKey: string;
  url: string;
  data: Record<string, any>;
}

export interface WebhookResponse {
  success: boolean;
  data: Record<string, any>;
  status: number;
  message?: any;
}

export interface WebhookInvocation {
  correlationId: string;
  event: string;
  timestamp: Date;
  request?: WebhookRequest;
  response?: WebhookResponse;
}

const SERVICE_NAME = "WebhookService";

export const getWebhookRequestsForAddress = async (
  address: string,
  accountId?: number
): Promise<Omit<WebhookRequest, "data">[]> => {
  let query = `select 
    a."webhook_url" as "webhookUrl",
    a."webhook_auth_key" as "authKey",
    a."id" as "accountId"
  from "tracked_wallets" tw inner join "accounts" a on tw.account_id = a.id and a.active
  where tw.address = $/address/ and tw.status = 1 `;

  if (accountId) query += "and tx.account_id = $/accountId/ ";

  const params = { address, accountId };
  const trackedWallets = await idb.manyOrNone(query, params);

  if (!Array.isArray(trackedWallets)) {
    logger.warn(SERVICE_NAME, `No webhooks found for address: ${address}`);
    return [];
  }

  return (trackedWallets || []).map((wallet) => ({
    url: wallet.webhookUrl,
    authKey: wallet.authKey,
    accountId: wallet.accountId,
  }));
};

const generateCorrelationId = (serviceName?: string): string => uniqueId(serviceName);

const getAuthorizationHeader = (apiKey: string) => apiKey;

const makeRequest = async (
  url: string,
  apiKey: string,
  payload: Record<string, any>,
  eventName: string,
  eventTimestamp: Date
): Promise<WebhookResponse> => {
  const authHeader = getAuthorizationHeader(apiKey);

  const config: AxiosRequestConfig = {
    auth: { username: "", password: "" },
    headers: { Authorization: authHeader },
  };

  const body = {
    event: eventName,
    timestamp: eventTimestamp,
    data: payload,
  };

  const { data, status } = await axios.post(url, body, config);

  let success = false;
  if (status >= 200 && status < 400) success = true;

  const message = data?.message;

  return {
    status,
    success,
    data,
    message,
  };
};

export const callWebhookUrl = async (
  request: WebhookRequest,
  eventName: string,
  eventTimestamp: Date,
  serviceName?: string
): Promise<WebhookInvocation> => {
  const correlationId = generateCorrelationId(serviceName);
  logger.info("WebhookService", `correlationId: ${correlationId}`);

  const webhookInvocationRecord: WebhookInvocation = {
    event: eventName,
    timestamp: eventTimestamp,
    correlationId: correlationId,
    request: request,
  };

  const response = await makeRequest(
    request.url,
    request.authKey,
    request.data,
    eventName,
    eventTimestamp
  );
  webhookInvocationRecord.response = response;
  return webhookInvocationRecord;
};
