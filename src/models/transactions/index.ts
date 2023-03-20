import { idb, pgp } from "@/common/db";
import { fromBuffer, toBuffer } from "@/common/utils";
import _ from "lodash";
import { TransactionReceipt } from "@ethersproject/abstract-provider";

export type TransactionStatus = 0 | 1;

export type Transaction = {
  hash: string;
  from: string;
  to: string;
  value: string;
  data: string;
  blockNumber: number;
  blockTimestamp: number;
  gasPrice?: string;
  gasUsed?: string;
  gasFee?: string;
  nonce?: number;
  status?: TransactionStatus;
};

/**
 * Store single transaction and return it
 * @param transaction
 * @return Transaction
 */
export const saveTransaction = async (chainId: number, transaction: Transaction) => {
  await idb.none(
    `
      INSERT INTO transactions_${chainId} (
        hash,
        "from",
        "to",
        value,
        data,
        block_number,
        block_timestamp,
        gas_price,
        gas_used,
        gas_fee
      ) VALUES (
        $/hash/,
        $/from/,
        $/to/,
        $/value/,
        $/data/,
        $/blockNumber/,
        $/blockTimestamp/,
        $/gasPrice/,
        $/gasUsed/,
        $/gasFee/
      )
      ON CONFLICT DO NOTHING
    `,
    {
      hash: toBuffer(transaction.hash),
      from: toBuffer(transaction.from),
      to: toBuffer(transaction.to),
      value: transaction.value,
      data: toBuffer(transaction.data),
      blockNumber: transaction.blockNumber,
      blockTimestamp: transaction.blockTimestamp,
      gasPrice: transaction.gasPrice,
      gasUsed: transaction.gasUsed,
      gasFee: transaction.gasFee,
    }
  );

  return transaction;
};

/**
 * Store batch transactions and return nothing
 * @param transactions
 */
export const saveTransactions = async (
  chainId: number,
  transactions: Transaction[],
  receipts?: TransactionReceipt[]
) => {
  if (_.isEmpty(transactions)) {
    return;
  }

  const shouldParseReceipts = Array.isArray(receipts) && receipts.length;

  const columnset = [
    "hash",
    "from",
    "to",
    "value",
    "data",
    "block_number",
    "block_timestamp",
    "gas_price",
    "gas_used",
    "gas_fee",
  ];

  const receiptBasedColumns = ["nonce", "status"];

  if (shouldParseReceipts) {
    columnset.push(...receiptBasedColumns);
  }

  const columns = new pgp.helpers.ColumnSet(columnset, { table: `transactions_${chainId}` });

  const transactionsValues = _.map(transactions, (transaction, index) => {
    const txnObject: Record<string, any> = {
      hash: toBuffer(transaction.hash),
      from: toBuffer(transaction.from),
      to: toBuffer(transaction.to),
      value: transaction.value,
      data: toBuffer(transaction.data),
      block_number: transaction.blockNumber,
      block_timestamp: transaction.blockTimestamp,
      gas_price: transaction.gasPrice,
      gas_used: transaction.gasUsed,
      gas_fee: transaction.gasFee,
      nonce: transaction.nonce,
      status: 1,
    };

    if (shouldParseReceipts) {
      txnObject.status = receipts[index]?.status;
    }

    return txnObject;
  });

  const fieldNamesPart = columnset.map((i) => `"${i}"`).join(", ");

  const query = `
      INSERT INTO transactions_${chainId} (${fieldNamesPart}) VALUES ${pgp.helpers.values(
    transactionsValues,
    columns
  )}
      ON CONFLICT DO NOTHING
    `;

  await idb.none(query);
};

export const getTransaction = async (
  chainId: number,
  hash: string
): Promise<Pick<Transaction, "hash" | "from" | "to" | "value" | "data">> => {
  const result = await idb.oneOrNone(
    `
      SELECT
        transactions.from,
        transactions.to,
        transactions.value,
        transactions.data
      FROM transactions_${chainId} as transactions
      WHERE transactions.hash = $/hash/
    `,
    { hash: toBuffer(hash) }
  );

  return {
    hash,
    from: fromBuffer(result.from),
    to: fromBuffer(result.to),
    value: result.value,
    data: fromBuffer(result.data),
  };
};
