import { Log } from "@ethersproject/abstract-provider";

import { EventDataKind } from "@/events-sync/data";
import { BaseEventParams } from "@/events-sync/parser";

import * as es from "@/events-sync/storage";

import * as processActivityEvent from "@/jobs/activities/process-activity-event";
import { isValidAsset } from "@/utils/currencies";
// import * as fillUpdates from "@/jobs/fill-updates/queue";
// import * as orderUpdatesById from "@/jobs/order-updates/by-id-queue";
// import * as orderUpdatesByMaker from "@/jobs/order-updates/by-maker-queue";
// import * as orderbookOrders from "@/jobs/orderbook/orders-queue";
// import * as tokenUpdatesMint from "@/jobs/token-updates/mint-queue";

// Semi-parsed and classified event
export type EnhancedEvent = {
  kind: EventDataKind;
  baseEventParams: BaseEventParams;
  log: Log;
};

// Data extracted from purely on-chain information
export type OnChainData = {
  // Approvals
  // Due to some complexities around them, ft approvals are handled
  // differently (eg. ft approvals can decrease implicitly when the
  // spender transfers from the owner's balance, without any events
  // getting emitted)
  // nftApprovalEvents?: es.nftApprovals.Event[];

  // Transfers
  ftTransferEvents?: es.ftTransfers.Event[];
  // nftTransferEvents?: es.nftTransfers.Event[];
};

// Process on-chain data (save to db, trigger any further processes, ...)
export const processOnChainData = async (
  chainId: number,
  data: OnChainData,
  backfill?: boolean
) => {
  const ftTransferEvents = data.ftTransferEvents?.filter((event) =>
    isValidAsset(event?.baseEventParams?.address, event.chainId)
  );
  // Post-process fill events
  // const allFillEvents = concat(data.fillEvents, data.fillEventsPartial, data.fillEventsOnChain);
  // if (!backfill) {
  //   await Promise.all([
  //     assignSourceToFillEvents(allFillEvents),
  //     assignWashTradingScoreToFillEvents(allFillEvents),
  //   ]);
  // }

  // Persist events
  // WARNING! Fills should always come first in order to properly mark
  // the fillability status of orders as 'filled' and not 'no-balance'
  // await Promise.all([
  //   es.fills.addEvents(data.fillEvents ?? []),
  //   es.fills.addEventsPartial(data.fillEventsPartial ?? []),
  //   es.fills.addEventsOnChain(data.fillEventsOnChain ?? []),
  // ]);
  await Promise.all([
    // es.cancels.addEvents(data.cancelEvents ?? []),
    // es.cancels.addEventsOnChain(data.cancelEventsOnChain ?? []),
    // es.bulkCancels.addEvents(data.bulkCancelEvents ?? []),
    // es.nonceCancels.addEvents(data.nonceCancelEvents ?? []),
    // es.nftApprovals.addEvents(data.nftApprovalEvents ?? []),
    es.ftTransfers.addEvents(ftTransferEvents ?? [], Boolean(backfill), chainId),
    // es.nftTransfers.addEvents(data.nftTransferEvents ?? [], Boolean(backfill)),
  ]);

  // Trigger further processes:
  // - revalidate potentially-affected orders
  // - store on-chain orders
  // if (!backfill) {
  //   // WARNING! It's very important to guarantee that the previous
  //   // events are persisted to the database before any of the jobs
  //   // below are executed. Otherwise, the jobs can potentially use
  //   // stale data which will cause inconsistencies (eg. orders can
  //   // have wrong statuses)
  //   await Promise.all([
  //     orderUpdatesById.addToQueue(data.orderInfos ?? []),
  //     orderUpdatesByMaker.addToQueue(data.makerInfos ?? []),
  //     orderbookOrders.addToQueue(data.orders ?? []),
  //   ]);
  // }

  // Mints and last sales
  // await tokenUpdatesMint.addToQueue(data.mintInfos ?? []);

  // TODO: Is this the best place to handle activities?

  // Process transfer activities
  const transferActivityInfos: processActivityEvent.EventInfo[] = (ftTransferEvents ?? []).map(
    (event) => ({
      context: [
        processActivityEvent.EventKind.erc20TransferEvent,
        event.baseEventParams.txHash,
        event.baseEventParams.logIndex,
        event.baseEventParams.batchIndex,
      ].join(":"),
      kind: processActivityEvent.EventKind.erc20TransferEvent,
      data: {
        contract: event.baseEventParams.address,
        fromAddress: event.from,
        toAddress: event.to,
        amount: Number(event.amount),
        transactionHash: event.baseEventParams.txHash,
        logIndex: event.baseEventParams.logIndex,
        batchIndex: event.baseEventParams.batchIndex,
        blockHash: event.baseEventParams.blockHash,
        block: event.baseEventParams.block,
        timestamp: event.baseEventParams.timestamp,
        chainId: chainId,
      },
    })
  );
  await processActivityEvent.addToQueue(transferActivityInfos);
};
