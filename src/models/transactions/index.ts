import { idb, pgp } from "@/common/db";
import { fromBuffer, toBuffer } from "@/common/utils";
import _ from "lodash";

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
export const saveTransactions = async (chainId: number, transactions: Transaction[]) => {
  if (_.isEmpty(transactions)) {
    return;
  }

  const columns = new pgp.helpers.ColumnSet(
    [
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
    ],
    { table: `transactions_${chainId}` }
  );

  const transactionsValues = _.map(transactions, (transaction) => ({
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
  }));

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
      ) VALUES ${pgp.helpers.values(transactionsValues, columns)}
      ON CONFLICT DO NOTHING
    `
  );
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
