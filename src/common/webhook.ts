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
  request?: WebhookRequest;
  response?: WebhookResponse;
}

const SERVICE_NAME = "WebhookService";

export const getWebhookRequestsForAddress = async (
  address: string,
  accountId?: string
): Promise<Omit<WebhookRequest, "data">[]> => {
  let query = `select 
    tw."webhook_url" as "webhookUrl",
    tw."webhook_auth_key" as "authKey",
    tw."account_id" as "accountId"
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
  payload: Record<string, any>
): Promise<WebhookResponse> => {
  const authHeader = getAuthorizationHeader(apiKey);

  const config: AxiosRequestConfig = {
    auth: { username: "", password: "" },
    headers: { Authorization: authHeader },
  };

  const { data, status } = await axios.post(url, payload, config);

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
  serviceName?: string
): Promise<WebhookInvocation> => {
  const correlationId = generateCorrelationId(serviceName);
  logger.info("WebhookService", `correlationId: ${correlationId}`);

  const webhookInvocationRecord: WebhookInvocation = {
    correlationId: correlationId,
    request: request,
  };

  const response = await makeRequest(request.url, request.authKey, request.data);
  webhookInvocationRecord.response = response;
  return webhookInvocationRecord;
};
