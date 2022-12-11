import { EnhancedEvent, OnChainData, processOnChainData } from "@/events-sync/handlers/utils";

import * as erc20 from "@/events-sync/handlers/erc20";
// import * as erc1155 from "@/events-sync/handlers/erc1155";
// import * as erc721 from "@/events-sync/handlers/erc721";

export type EventsInfo = {
  kind: "erc20" | "erc721" | "erc1155";
  events: EnhancedEvent[];
  backfill?: boolean;
  chainId: number;
};

export const processEvents = async (info: EventsInfo) => {
  let data: OnChainData | undefined;
  switch (info.kind) {
    case "erc20": {
      data = await erc20.handleEvents(info.events, info.chainId);
      break;
    }

    // case "erc721": {
    //   data = await erc721.handleEvents(info.events);
    //   break;
    // }

    // case "erc1155": {
    //   data = await erc1155.handleEvents(info.events);
    //   break;
    // }
  }

  if (data) {
    await processOnChainData(info.chainId, data, info.backfill);
  }
};
