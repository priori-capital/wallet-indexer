import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { uniqueId } from "lodash";
import { logger } from "./logger";
import { idb } from "./db";

export interface WebhookRequest {
  accountId: string;
  apiKey: string;
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
  address: string
): Promise<Omit<WebhookRequest, "data">[]> => {
  const query = `select * from "tracked_wallets" where address = $/address/ and status = 1 `;
  const params = { address };
  const trackedWallets = await idb.manyOrNone(query, params);

  if (!Array.isArray(trackedWallets)) {
    logger.warn(SERVICE_NAME, `No webhooks found for address: ${address}`);
    return [];
  }

  return (trackedWallets || []).map((wallet) => ({
    url: wallet.webhook_url,
    apiKey: wallet.api_key,
    accountId: wallet.accountId,
  }));
};

const generateCorrelationId = (serviceName?: string): string => uniqueId(serviceName);

const getAuthorizationHeader = (apiKey: string) => apiKey;

// TODO: Write axios logic in this
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

  const response = await makeRequest(request.url, request.apiKey, request.data);
  webhookInvocationRecord.response = response;
  return webhookInvocationRecord;
};
