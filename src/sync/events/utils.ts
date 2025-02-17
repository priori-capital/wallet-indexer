import { AddressZero } from "@ethersproject/constants";
import { getTxTrace } from "@georgeroman/evm-tx-simulator";
import { TransactionResponse } from "@ethersproject/abstract-provider";

import { getProvider } from "@/common/provider";
import { bn } from "@/common/utils";
import { getBlocks, saveBlock } from "@/models/blocks";
import { getTransactionLogs, saveTransactionLogs } from "@/models/transaction-logs";
import { getTransactionTrace, saveTransactionTrace } from "@/models/transaction-traces";
import { getTransaction, saveTransaction, saveTransactions } from "@/models/transactions";
import * as es from "@/events-sync/storage";
import { triggerProcessActivityEvent } from "./handlers/utils";
import { EventKind } from "@/jobs/activities/process-activity-event";

interface ITransactionResponse extends TransactionResponse {
  transactionIndex: number;
}

export const fetchBlock = async (chainId: number, blockNumber: number, force = false) => {
  return (
    getBlocks(chainId, blockNumber)
      // Only fetch a single block (multiple ones might be available due to reorgs)
      .then(async (blocks) => {
        if (blocks.length && !force) {
          return blocks[0];
        } else {
          const nativeTokenTransaction: es.ftTransfers.Event[] = [];
          const block = await getProvider(chainId).getBlockWithTransactions(blockNumber);
          // Create transactions array to store
          const transactions = (block.transactions as ITransactionResponse[]).map(
            (tx: ITransactionResponse) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawTx = tx.raw as any;

              const gasPrice = tx.gasPrice?.toString();
              const gasUsed = rawTx?.gas ? bn(rawTx.gas).toString() : undefined;
              const gasFee = gasPrice && gasUsed ? bn(gasPrice).mul(gasUsed).toString() : undefined;
              if (!bn(tx.value).isZero()) {
                nativeTokenTransaction.push({
                  from: tx.from.toLowerCase(),
                  to: (tx.to || AddressZero).toLowerCase(),
                  amount: tx.value.toString(),
                  baseEventParams: {
                    address: "0x00",
                    block: block.number,
                    blockHash: block.hash,
                    txHash: tx.hash.toLowerCase(),
                    txIndex: tx?.transactionIndex,
                    timestamp: block.timestamp,
                    logIndex: 0,
                    batchIndex: 1,
                  },
                  chainId,
                });
              }
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
            }
          );
          // Save all transactions within the block
          await saveTransactions(chainId, transactions);

          await triggerProcessActivityEvent(
            nativeTokenTransaction,
            chainId,
            EventKind.nativeTransferEvent
          );

          return saveBlock(chainId, {
            number: block.number,
            hash: block.hash,
            timestamp: block.timestamp,
          });
        }
      })
  );
};

export const fetchTransaction = async (chainId: number, txHash: string) =>
  getTransaction(chainId, txHash).catch(async () => {
    // TODO: This should happen very rarely since all transactions
    // should be readily available. The only case when data misses
    // is when a block reorg happens and the replacing block takes
    // in transactions that were missing in the previous block. In
    // this case we don't refetch the new block's transactions but
    // assume it cannot include new transactions. But that's not a
    // a good assumption so we should force re-fetch the new block
    // together with its transactions when a reorg happens.

    let tx = await getProvider(chainId).getTransaction(txHash);
    if (!tx) {
      tx = await getProvider(chainId).getTransaction(txHash);
    }

    // Also fetch all transactions within the block
    const blockTimestamp = (await fetchBlock(chainId, tx.blockNumber!, true)).timestamp;

    // TODO: Fetch gas fields via `eth_getTransactionReceipt`
    // Sometimes `effectiveGasPrice` can be null
    // const txReceipt = await baseProvider.getTransactionReceipt(txHash);
    // const gasPrice = txReceipt.effectiveGasPrice || tx.gasPrice || 0;

    return saveTransaction(chainId, {
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

export const fetchTransactionTrace = async (chainId: number, txHash: string) =>
  getTransactionTrace(chainId, txHash)
    .catch(async () => {
      const transactionTrace = await getTxTrace({ hash: txHash }, getProvider(chainId));

      return saveTransactionTrace(chainId, {
        hash: txHash,
        calls: transactionTrace,
      });
    })
    .catch(() => undefined);

export const fetchTransactionLogs = async (chainId: number, txHash: string) =>
  getTransactionLogs(chainId, txHash).catch(async () => {
    const receipt = await getProvider(chainId).getTransactionReceipt(txHash);

    return saveTransactionLogs(chainId, {
      hash: txHash,
      logs: receipt.logs,
    });
  });
