// WARNING! For ease of accounting, make sure to keep the below lists sorted!

// Initialize all background job queues and crons

// import "@/jobs/arweave-relay";
// import "@/jobs/arweave-sync";
// import "@/jobs/backfill";
// import "@/jobs/bid-updates";
// import "@/jobs/cache-check";
// import "@/jobs/collection-updates";
// import "@/jobs/collections-refresh";
// import "@/jobs/currencies";
// import "@/jobs/daily-volumes";
// import "@/jobs/data-export";
import "@/jobs/events-sync";
// import "@/jobs/fill-updates";
// import "@/jobs/metadata-index";
// import "@/jobs/nft-balance-updates";
// import "@/jobs/oracle";
// import "@/jobs/order-fixes";
// import "@/jobs/order-updates";
// import "@/jobs/orderbook";
// import "@/jobs/sources";
// import "@/jobs/token-updates";
// import "@/jobs/update-attribute";

// Export all job queues for monitoring through the BullMQ UI

// import * as processActivityEvent from "@/jobs/activities/process-activity-event";

// import * as currencies from "@/jobs/currencies/index";

export const allJobQueues = [
  // fixActivitiesMissingCollection.queue,
  // processActivityEvent.queue,
  // removeUnsyncedEventsActivities.queue,
  // arweaveSyncBackfill.queue,
  // arweaveSyncRealtime.queue,
  // backfillBlurSales.queue,
  // backfillMints.queue,
  // backCollectionsNonFlaggedFloorAsk.queue,
  // currencies.queue,
  // topBidUpdate.queue,
  // collectionsRefresh.queue,
  // collectionsRefreshCache.queue,
  // collectionUpdatesFloorAsk.queue,
  // collectionUpdatesNormalizedFloorAsk.queue,
  // collectionUpdatesNonFlaggedFloorAsk.queue,
  // collectionUpdatesMetadata.queue,
  // rarity.queue,
  // collectionUpdatesTopBid.queue,
  // collectionRecalcFloorAsk.queue,
  // refreshContractCollectionsMetadata.queue,
  // dailyVolumes.queue,
  // exportData.queue,
  // eventsSyncProcessResyncRequest.queue,
  // eventsSyncBackfill.queue,
  // eventsSyncBlockCheck.queue,
  // eventsSyncBackfillProcess.queue,
  // eventsSyncRealtimeProcess.queue,
  // eventsSyncRealtime.queue,
  // eventsSyncFtTransfersWriteBuffer.queue,
  // eventsSyncNftTransfersWriteBuffer.queue,
  // fillUpdates.queue,
  // flagStatusProcessJob.queue,
  // flagStatusSyncJob.queue,
  // flagStatusGenerateAttributeTokenSet.queue,
  // flagStatusGenerateCollectionTokenSet.queue,
  // metadataIndexFetch.queue,
  // metadataIndexProcess.queue,
  // metadataIndexWrite.queue,
  // updateNftBalanceFloorAskPrice.queue,
  // updateNftBalanceTopBid.queue,
  // orderFixes.queue,
  // orderUpdatesById.queue,
  // orderUpdatesByMaker.queue,
  // bundleOrderUpdatesByMaker.queue,
  // orderbookOrders.queue,
  // orderbookPostOrderExternal.queue,
  // orderbookTokenSets.queue,
  // fetchSourceInfo.queue,
  // tokenUpdatesMint.queue,
  // tokenRefreshCache.queue,
  // fetchCollectionMetadata.queue,
  // tokenUpdatesFloorAsk.queue,
  // tokenUpdatesNormalizedFloorAsk.queue,
  // handleNewSellOrder.queue,
  // handleNewBuyOrder.queue,
  // resyncAttributeCache.queue,
  // resyncAttributeCollection.queue,
  // resyncAttributeFloorSell.queue,
  // resyncAttributeKeyCounts.queue,
  // resyncAttributeValueCounts.queue,
];
