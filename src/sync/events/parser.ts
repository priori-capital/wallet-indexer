import { Log } from "@ethersproject/abstract-provider";

import * as syncEventsUtils from "@/events-sync/utils";
import * as blocksModel from "@/models/blocks";

export type BaseEventParams = {
  address: string;
  block: number;
  blockHash: string;
  txHash: string;
  txIndex: number;
  logIndex: number;
  timestamp: number;
  batchIndex: number;
};

export const parseEvent = async (
  log: Log,
  blocksCache: Map<string, blocksModel.Block>,
  batchIndex = 1,
  chainId = 1
): Promise<BaseEventParams> => {
  const address = log.address.toLowerCase();
  const block = log.blockNumber;
  const blockHash = log.blockHash.toLowerCase();
  const txHash = log.transactionHash.toLowerCase();
  const txIndex = log.transactionIndex;
  const logIndex = log.logIndex;

  let blockResult = blocksCache.get(`${chainId}-${block}`);
  if (!blockResult) {
    blocksCache.set(`${chainId}-${block}`, await syncEventsUtils.fetchBlock(chainId, block));
    blockResult = blocksCache.get(`${chainId}-${block}`)!;
  }

  return {
    address,
    txHash,
    txIndex,
    block,
    blockHash,
    logIndex,
    timestamp: blockResult.timestamp,
    batchIndex,
  };
};
