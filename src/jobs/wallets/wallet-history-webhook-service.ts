import { logger } from "@/common/logger";
import { WebhookEventTypes, callWebhookUrl, getWebhookRequestsForAddress } from "@/common/webhook";
import { TransactionStatus } from "@/models/transactions";

export interface IRawUserTransaction {
  hash: Buffer;
  ut_hash: Buffer;
  type: string;
  contract: Buffer;
  from_address: Buffer;
  to_address: Buffer;
  amount: number;
  metadata: {
    logIndex: number;
    BatchIndex: number;
  };
  block_hash: Buffer;
  block: number;
  event_timestamp: number;
  chain_id: number;
  created_at: Date;
  t1_gas_used: string | null;
  t1_gas_price: string | null;
  t1_gas_fee: string | null;
  t1_gas_limit: string | null;
  t1_status: TransactionStatus;
  t2_gas_used: string | null;
  t2_gas_price: string | null;
  t2_gas_fee: string | null;
  t2_gas_limit: string | null;
  t2_status: TransactionStatus;
}

export interface IUserTransaction {
  hash: string;
  type: string;
  contract: string;
  from_address: string;
  to_address: string;
  amount: number;
  metadata: {
    logIndex: number;
    BatchIndex: number;
  };
  block_hash: string;
  block: number;
  event_timestamp: number;
  chain_id: number;
  created_at: Date;
  gasPrice: string | null;
  gasUsed: string | null;
  gasLimit: string | null;
  gasFee: string | null;
  status: TransactionStatus;
}

const SERVICE_NAME = "INVOKE_WEBHOOK";

export interface IWebhookHistoryPayload {
  address: string;
  batch: number;
  totalBatch: number;
  transactions: IUserTransaction[];
  workspaceId: string;
  isWalletCached: boolean;
}

export const invokeWebhookEndpoints = async (
  payload: IWebhookHistoryPayload,
  accountId: number,
  timestamp: Date
) => {
  const { address, batch, totalBatch } = payload;

  const logObject = { accountId, batch, totalBatch, address };
  logger.info(
    SERVICE_NAME,
    `Invoked history webhook for accountId:: ${accountId} for addres ${address}`
  );
  logger.info(SERVICE_NAME, JSON.stringify(logObject));

  const webhookRequests = await getWebhookRequestsForAddress(payload.address, accountId);
  if (!webhookRequests.length) {
    logger.error(SERVICE_NAME, `Account id: ${accountId} is invalid or inactive`);
    return;
  }

  try {
    const [webhookRequest] = webhookRequests;
    const { response } = await callWebhookUrl(
      { ...webhookRequest, data: payload },
      WebhookEventTypes.TRANSACTION_HISTORY,
      timestamp
    );

    if (!response?.success) {
      throw new Error(response?.message);
    }

    logger.info(
      SERVICE_NAME,
      `History webhook ${batch} out of ${totalBatch} for address ${address} invoked successfully`
    );
  } catch (err) {
    logger.error(
      SERVICE_NAME,
      `History webhook ${batch} out of ${totalBatch} for address ${address}`
    );
    throw err;
  }
};
