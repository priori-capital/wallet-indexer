import { AddressZero } from "@ethersproject/constants";
import { getTxTrace } from "@georgeroman/evm-tx-simulator";

import { baseProvider } from "@/common/provider";
import { bn } from "@/common/utils";
import { getBlocks, saveBlock } from "@/models/blocks";
import { getTransactionLogs, saveTransactionLogs } from "@/models/transaction-logs";
import { getTransactionTrace, saveTransactionTrace } from "@/models/transaction-traces";
import { getTransaction, saveTransaction, saveTransactions } from "@/models/transactions";

export const fetchBlock = async (blockNumber: number, force = false) =>
  getBlocks(blockNumber)
    // Only fetch a single block (multiple ones might be available due to reorgs)
    .then(async (blocks) => {
      if (blocks.length && !force) {
        return blocks[0];
      } else {
        const block = await baseProvider.getBlockWithTransactions(blockNumber);

        // Create transactions array to store
        const transactions = block.transactions.map((tx) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawTx = tx.raw as any;

          const gasPrice = tx.gasPrice?.toString();
          const gasUsed = rawTx?.gas ? bn(rawTx.gas).toString() : undefined;
          const gasFee = gasPrice && gasUsed ? bn(gasPrice).mul(gasUsed).toString() : undefined;

          return {
            hash: tx.hash.toLowerCase(),
            from: tx.from.toLowerCase(),
            to: (tx.to || AddressZero).toLowerCase(),
            value: tx.value.toString(),
            data: tx.data.toLowerCase(),
            blockNumber: block.number,
            blockTimestamp: block.timestamp,
            gasPrice,
            gasUsed,
            gasFee,
          };
        });

        // Save all transactions within the block
        await saveTransactions(transactions);

        return saveBlock({
          number: block.number,
          hash: block.hash,
          timestamp: block.timestamp,
        });
      }
    });

export const fetchTransaction = async (txHash: string) =>
  getTransaction(txHash).catch(async () => {
    // TODO: This should happen very rarely since all transactions
    // should be readily available. The only case when data misses
    // is when a block reorg happens and the replacing block takes
    // in transactions that were missing in the previous block. In
    // this case we don't refetch the new block's transactions but
    // assume it cannot include new transactions. But that's not a
    // a good assumption so we should force re-fetch the new block
    // together with its transactions when a reorg happens.

    let tx = await baseProvider.getTransaction(txHash);
    if (!tx) {
      tx = await baseProvider.getTransaction(txHash);
    }

    // Also fetch all transactions within the block
    const blockTimestamp = (await fetchBlock(tx.blockNumber!, true)).timestamp;

    // TODO: Fetch gas fields via `eth_getTransactionReceipt`
    // Sometimes `effectiveGasPrice` can be null
    // const txReceipt = await baseProvider.getTransactionReceipt(txHash);
    // const gasPrice = txReceipt.effectiveGasPrice || tx.gasPrice || 0;

    return saveTransaction({
      hash: tx.hash.toLowerCase(),
      from: tx.from.toLowerCase(),
      to: (tx.to || AddressZero).toLowerCase(),
      value: tx.value.toString(),
      data: tx.data.toLowerCase(),
      blockNumber: tx.blockNumber!,
      blockTimestamp,
      // gasUsed: txReceipt.gasUsed.toString(),
      // gasPrice: gasPrice.toString(),
      // gasFee: txReceipt.gasUsed.mul(gasPrice).toString(),
    });
  });

export const fetchTransactionTrace = async (txHash: string) =>
  getTransactionTrace(txHash)
    .catch(async () => {
      const transactionTrace = await getTxTrace({ hash: txHash }, baseProvider);

      return saveTransactionTrace({
        hash: txHash,
        calls: transactionTrace,
      });
    })
    .catch(() => undefined);

export const fetchTransactionLogs = async (txHash: string) =>
  getTransactionLogs(txHash).catch(async () => {
    const receipt = await baseProvider.getTransactionReceipt(txHash);

    return saveTransactionLogs({
      hash: txHash,
      logs: receipt.logs,
    });
  });
