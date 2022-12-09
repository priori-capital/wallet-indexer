import { Interface } from "@ethersproject/abi";

import * as weth from "@/events-sync/data/weth";
// All events we're syncing should have an associated `EventData`
// entry which dictates the way the event will be parsed and then
// handled (eg. persisted to the database and relayed for further
// processing to any job queues)

export type EventDataKind =
  // | "erc721-transfer"
  // | "erc1155-transfer-single"
  // | "erc1155-transfer-batch"
  // | "erc721/1155-approval-for-all"
  "erc20-approval" | "erc20-transfer" | "weth-deposit" | "weth-withdrawal";

export type EventData = {
  kind: EventDataKind;
  addresses?: { [address: string]: boolean };
  topic: string;
  numTopics: number;
  abi: Interface;
};

export const getEventData = (eventDataKinds?: EventDataKind[]) => {
  if (!eventDataKinds) {
    return [
      // erc721.transfer,
      // erc721.approvalForAll,
      // erc1155.transferSingle,
      // erc1155.transferBatch,
      weth.approval,
      weth.transfer,
      weth.deposit,
      weth.withdrawal,
      // foundation.buyPriceAccepted,
      // foundation.buyPriceCancelled,
      // foundation.buyPriceInvalidated,
      // foundation.buyPriceSet,
      // looksRare.cancelAllOrders,
      // looksRare.cancelMultipleOrders,
      // looksRare.takerAsk,
      // looksRare.takerBid,
      // seaport.counterIncremented,
      // seaport.orderCancelled,
      // seaport.orderFulfilled,
      // wyvernV2.ordersMatched,
      // wyvernV23.ordersMatched,
      // zeroExV4.erc721OrderCancelled,
      // zeroExV4.erc1155OrderCancelled,
      // zeroExV4.erc721OrderFilled,
      // zeroExV4.erc1155OrderFilled,
      // x2y2.orderCancelled,
      // x2y2.orderInventory,
      // rarible.match,
      // rarible.cancel,
      // element.erc721BuyOrderFilled,
      // element.erc721BuyOrderFilledV2,
      // element.erc721SellOrderFilled,
      // element.erc721SellOrderFilledV2,
      // element.erc1155BuyOrderFilled,
      // element.erc1155BuyOrderFilledV2,
      // element.erc1155SellOrderFilled,
      // element.erc1155SellOrderFilledV2,
      // element.erc721OrderCancelled,
      // element.erc1155OrderCancelled,
      // element.hashNonceIncremented,
      // quixotic.orderFulfilled,
      // zora.askFilled,
      // zora.askCreated,
      // zora.askCancelled,
      // zora.askPriceUpdated,
      // zora.auctionEnded,
      // nouns.auctionSettled,
      // cryptoPunks.punkOffered,
      // cryptoPunks.punkNoLongerForSale,
      // cryptoPunks.punkBought,
      // cryptoPunks.punkTransfer,
      // cryptoPunks.assign,
      // cryptoPunks.transfer,
      // sudoswap.buy,
      // sudoswap.sell,
      // sudoswap.tokenDeposit,
      // sudoswap.tokenWithdrawal,
      // universe.match,
      // universe.cancel,
      // nftx.minted,
      // nftx.redeemed,
      // blur.ordersMatched,
      // blur.orderCancelled,
      // blur.nonceIncremented,
      // forward.orderFilled,
      // forward.orderCancelled,
      // forward.counterIncremented,
    ];
  } else {
    return (
      eventDataKinds
        .map(internalGetEventData)
        .filter(Boolean)
        // Force TS to remove `undefined`
        .map((x) => x!)
    );
  }
};

const internalGetEventData = (kind: EventDataKind): EventData | undefined => {
  switch (kind) {
    // case "erc721-transfer":
    //   return erc721.transfer;
    // case "erc721/1155-approval-for-all":
    //   return erc721.approvalForAll;
    // case "erc1155-transfer-batch":
    //   return erc1155.transferBatch;
    // case "erc1155-transfer-single":
    //   return erc1155.transferSingle;
    case "erc20-approval":
      return weth.approval;
    case "erc20-transfer":
      return weth.transfer;
    case "weth-deposit":
      return weth.deposit;
    case "weth-withdrawal":
      return weth.withdrawal;
    // case "foundation-buy-price-accepted":
    //   return foundation.buyPriceAccepted;
    // case "foundation-buy-price-cancelled":
    //   return foundation.buyPriceCancelled;
    // case "foundation-buy-price-invalidated":
    //   return foundation.buyPriceInvalidated;
    // case "foundation-buy-price-set":
    //   return foundation.buyPriceSet;
    // case "wyvern-v2-orders-matched":
    //   return wyvernV2.ordersMatched;
    // case "wyvern-v2.3-orders-matched":
    //   return wyvernV23.ordersMatched;
    // case "looks-rare-cancel-all-orders":
    //   return looksRare.cancelAllOrders;
    // case "looks-rare-cancel-multiple-orders":
    //   return looksRare.cancelMultipleOrders;
    // case "looks-rare-taker-ask":
    //   return looksRare.takerAsk;
    // case "looks-rare-taker-bid":
    //   return looksRare.takerBid;
    // case "zeroex-v4-erc721-order-cancelled":
    //   return zeroExV4.erc721OrderCancelled;
    // case "zeroex-v4-erc1155-order-cancelled":
    //   return zeroExV4.erc1155OrderCancelled;
    // case "zeroex-v4-erc721-order-filled":
    //   return zeroExV4.erc721OrderFilled;
    // case "zeroex-v4-erc1155-order-filled":
    //   return zeroExV4.erc1155OrderFilled;
    // case "x2y2-order-cancelled":
    //   return x2y2.orderCancelled;
    // case "x2y2-order-inventory":
    //   return x2y2.orderInventory;
    // case "seaport-counter-incremented":
    //   return seaport.counterIncremented;
    // case "seaport-order-cancelled":
    //   return seaport.orderCancelled;
    // case "seaport-order-filled":
    //   return seaport.orderFulfilled;
    // case "rarible-match":
    //   return rarible.match;
    // case "rarible-cancel":
    //   return rarible.cancel;
    // case "element-erc721-sell-order-filled":
    //   return element.erc721SellOrderFilled;
    // case "element-erc721-sell-order-filled-v2":
    //   return element.erc721SellOrderFilledV2;
    // case "element-erc721-buy-order-filled":
    //   return element.erc721BuyOrderFilled;
    // case "element-erc721-buy-order-filled-v2":
    //   return element.erc721BuyOrderFilledV2;
    // case "element-erc1155-sell-order-filled":
    //   return element.erc1155SellOrderFilled;
    // case "element-erc1155-sell-order-filled-v2":
    //   return element.erc1155SellOrderFilledV2;
    // case "element-erc1155-buy-order-filled":
    //   return element.erc1155BuyOrderFilled;
    // case "element-erc1155-buy-order-filled-v2":
    //   return element.erc1155BuyOrderFilledV2;
    // case "element-erc721-order-cancelled":
    //   return element.erc721OrderCancelled;
    // case "element-erc1155-order-cancelled":
    //   return element.erc1155OrderCancelled;
    // case "element-hash-nonce-incremented":
    //   return element.hashNonceIncremented;
    // case "quixotic-order-filled":
    //   return quixotic.orderFulfilled;
    // case "zora-ask-filled":
    //   return zora.askFilled;
    // case "zora-ask-created":
    //   return zora.askCreated;
    // case "zora-ask-cancelled":
    //   return zora.askCancelled;
    // case "zora-ask-price-updated":
    //   return zora.askPriceUpdated;
    // case "zora-auction-ended":
    //   return zora.auctionEnded;
    // case "nouns-auction-settled":
    //   return nouns.auctionSettled;
    // case "cryptopunks-punk-offered":
    //   return cryptoPunks.punkOffered;
    // case "cryptopunks-punk-no-longer-for-sale":
    //   return cryptoPunks.punkNoLongerForSale;
    // case "cryptopunks-punk-bought":
    //   return cryptoPunks.punkBought;
    // case "cryptopunks-punk-transfer":
    //   return cryptoPunks.punkTransfer;
    // case "cryptopunks-assign":
    //   return cryptoPunks.assign;
    // case "cryptopunks-transfer":
    //   return cryptoPunks.transfer;
    // case "sudoswap-buy":
    //   return sudoswap.buy;
    // case "sudoswap-sell":
    //   return sudoswap.sell;
    // case "sudoswap-token-deposit":
    //   return sudoswap.tokenDeposit;
    // case "sudoswap-token-withdrawal":
    //   return sudoswap.tokenWithdrawal;
    // case "universe-match":
    //   return universe.match;
    // case "universe-cancel":
    //   return universe.cancel;
    // case "nftx-minted":
    //   return nftx.minted;
    // case "nftx-redeemed":
    //   return nftx.redeemed;
    // case "blur-orders-matched":
    //   return blur.ordersMatched;
    // case "blur-order-cancelled":
    //   return blur.orderCancelled;
    // case "blur-nonce-incremented":
    //   return blur.nonceIncremented;
    // case "forward-order-filled":
    //   return forward.orderFilled;
    // case "forward-order-cancelled":
    //   return forward.orderCancelled;
    // case "forward-counter-incremented":
    //   return forward.counterIncremented;
    default:
      return undefined;
  }
};
