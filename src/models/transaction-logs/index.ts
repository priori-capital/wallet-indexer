import { Log } from "@ethersproject/abstract-provider";

import { idb } from "@/common/db";
import { toBuffer } from "@/common/utils";

export type TransactionLogs = {
  hash: string;
  logs: Log[];
};

export const saveTransactionLogs = async (chainId: number, transactionLogs: TransactionLogs) => {
  await idb.none(
    `
      INSERT INTO transaction_logs_${chainId} (
        hash,
        logs
      ) VALUES (
        $/hash/,
        $/logs:json/
      )
      ON CONFLICT DO NOTHING
    `,
    {
      hash: toBuffer(transactionLogs.hash),
      logs: transactionLogs.logs,
    }
  );

  return transactionLogs;
};

export const getTransactionLogs = async (
  chainId: number,
  hash: string
): Promise<TransactionLogs> => {
  const result = await idb.oneOrNone(
    `
      SELECT
        transaction_logs.hash,
        transaction_logs.logs
      FROM transaction_logs_${chainId} as transaction_logs
      WHERE transaction_logs.hash = $/hash/
    `,
    { hash: toBuffer(hash) }
  );

  return {
    hash,
    logs: result.logs,
  };
};
