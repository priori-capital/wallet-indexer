// WARNING! For ease of accounting, make sure to keep the below lists sorted!

// Initialize all background job queues and crons

// import "@/jobs/arweave-relay";
// import "@/jobs/arweave-sync";
// import "@/jobs/backfill";
// import "@/jobs/bid-updates";
// import "@/jobs/cache-check";
// import "@/jobs/collections-refresh";
// import "@/jobs/collection-updates";
// import "@/jobs/currencies";
// import "@/jobs/daily-volumes";
// import "@/jobs/data-export";
import "@/jobs/events-sync";
// import "@/jobs/fill-updates";

import * as processActivityEvent from "@/jobs/activities/process-activity-event";

// import * as dailyVolumes from "@/jobs/daily-volumes/daily-volumes";
// import * as eventsSyncBackfillProcess from "@/jobs/events-sync/process/backfill";
// import * as backfillUserTransfers from "@/jobs/backfill/backfill-user-transfers";
// import * as eventsSyncRealtimeProcess from "@/jobs/events-sync/process/realtime";
// import * as eventsSyncRealtime from "@/jobs/events-sync/realtime-queue";
// import * as eventsSyncFtTransfersWriteBuffer from "@/jobs/events-sync/write-buffers/ft-transfers";
// import * as eventsSyncNftTransfersWriteBuffer from "@/jobs/events-sync/write-buffers/nft-transfers";

// import * as fillUpdates from "@/jobs/fill-updates/queue";

// import * as flagStatusProcessJob from "@/jobs/flag-status/process-queue";
// import * as flagStatusSyncJob from "@/jobs/flag-status/sync-queue";
// import * as flagStatusGenerateAttributeTokenSet from "@/jobs/flag-status/generate-attribute-token-set";
// import * as flagStatusGenerateCollectionTokenSet from "@/jobs/flag-status/generate-collection-token-set";

// import * as metadataIndexFetch from "@/jobs/metadata-index/fetch-queue";
// import * as metadataIndexProcess from "@/jobs/metadata-index/process-queue";
// import * as metadataIndexWrite from "@/jobs/metadata-index/write-queue";

// import * as updateNftBalanceFloorAskPrice from "@/jobs/nft-balance-updates/update-floor-ask-price-queue";
// import * as updateNftBalanceTopBid from "@/jobs/nft-balance-updates/update-top-bid-queue";

// import * as orderFixes from "@/jobs/order-fixes/queue";
// import * as orderUpdatesById from "@/jobs/order-updates/by-id-queue";
// import * as orderUpdatesByMaker from "@/jobs/order-updates/by-maker-queue";
// import * as bundleOrderUpdatesByMaker from "@/jobs/order-updates/by-maker-bundle-queue";

// import * as orderbookOrders from "@/jobs/orderbook/orders-queue";
// import * as orderbookPostOrderExternal from "@/jobs/orderbook/post-order-external";
// import * as orderbookTokenSets from "@/jobs/orderbook/token-sets-queue";

// import * as fetchSourceInfo from "@/jobs/sources/fetch-source-info";

// import * as tokenUpdatesMint from "@/jobs/token-updates/mint-queue";
// import * as tokenRefreshCache from "@/jobs/token-updates/token-refresh-cache";
// import * as fetchCollectionMetadata from "@/jobs/token-updates/fetch-collection-metadata";

// import * as handleNewSellOrder from "@/jobs/update-attribute/handle-new-sell-order";
// import * as handleNewBuyOrder from "@/jobs/update-attribute/handle-new-buy-order";
// import * as resyncAttributeCache from "@/jobs/update-attribute/resync-attribute-cache";
// import * as resyncAttributeCollection from "@/jobs/update-attribute/resync-attribute-collection";
// import * as resyncAttributeFloorSell from "@/jobs/update-attribute/resync-attribute-floor-sell";
// import * as resyncAttributeKeyCounts from "@/jobs/update-attribute/resync-attribute-key-counts";
// import * as resyncAttributeValueCounts from "@/jobs/update-attribute/resync-attribute-value-counts";

export const allJobQueues = [
  // fixActivitiesMissingCollection.queue,
  processActivityEvent.queue,
  // removeUnsyncedEventsActivities.queue,

  // arweaveSyncBackfill.queue,
  // arweaveSyncRealtime.queue,

  // backfillCollectionsRoyalties.queue,
  // backfillFixOpenSeaOrders.queue,

  // currencies.queue,

  // topBidUpdate.queue,

  // collectionsRefresh.queue,
  // collectionsRefreshCache.queue,

  // collectionUpdatesFloorAsk.queue,
  // collectionUpdatesMetadata.queue,
  // rarity.queue,
  // collectionUpdatesTopBid.queue,
  // collectionRecalcFloorAsk.queue,

  // dailyVolumes.queue,

  // exportData.queue,

  // eventsSyncBackfill.queue,
  // eventsSyncBlockCheck.queue,
  // eventsSyncBackfillProcess.queue,
  // eventsSyncRealtimeProcess.queue,
  // eventsSyncRealtime.queue,
  // eventsSyncFtTransfersWriteBuffer.queue,
  // backfillUserTransfers.queue,
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

  // handleNewSellOrder.queue,
  // handleNewBuyOrder.queue,
  // resyncAttributeCache.queue,
  // resyncAttributeCollection.queue,
  // resyncAttributeFloorSell.queue,
  // resyncAttributeKeyCounts.queue,
  // resyncAttributeValueCounts.queue,
];
