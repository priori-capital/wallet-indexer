// import { Tokens } from "@/models/tokens";
// import { UserActivitiesEntityInsertParams } from "@/models/user-activities/user-activities-entity";

import { UserActivities } from "@/models/user-activities";
import { AddressZero } from "@ethersproject/constants";
import _ from "lodash";

export enum ActivityType {
  transfer = "transfer",
  mint = "mint",
}

export class TransferActivity {
  public static async handleEvent(data: TransferEventData) {
    //TODO: fix prices
    // const [token, price] = await Promise.all([
    //   getCurrency(data.contract, data.chainId),
    //   getUSDAndNativePrices(data.contract, data.amount.toString(), data.timestamp, data.chainId, {
    //     onlyUSD: true,
    //   }),
    // ]);

    const activity = {
      type: data.fromAddress == AddressZero ? ActivityType.mint : ActivityType.transfer,
      hash: data.transactionHash,
      contract: data.contract,
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      price: null,
      amount: data.amount,
      block: data.block,
      blockHash: data.blockHash,
      eventTimestamp: data.timestamp,
      metadata: {
        transactionHash: data.transactionHash,
        logIndex: data.logIndex,
        batchIndex: data.batchIndex,
      },
      token: null,
      address: "",
      direction: "",
      chainId: data.chainId,
    };

    const userActivities = [];

    // One record for the user to address
    const toUserActivity = _.clone(activity);
    toUserActivity.address = data.toAddress;
    toUserActivity.direction = "incoming";
    userActivities.push(toUserActivity);

    if (data.fromAddress != AddressZero) {
      // One record for the user from address if not a mint event
      const fromUserActivity = _.clone(activity);
      fromUserActivity.address = data.fromAddress;
      fromUserActivity.direction = "outgoing";
      userActivities.push(fromUserActivity);
    }

    await Promise.all([UserActivities.addActivities(userActivities)]);
  }
}

export type TransferEventData = {
  contract: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  transactionHash: string;
  logIndex: number;
  batchIndex: number;
  blockHash: string;
  block: number;
  timestamp: number;
  chainId: number;
};
