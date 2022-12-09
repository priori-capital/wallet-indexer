// import { Tokens } from "@/models/tokens";
// import { UserActivitiesEntityInsertParams } from "@/models/user-activities/user-activities-entity";

import { UserActivities } from "@/models/user-activities";
import { getCurrency } from "@/utils/currencies";
import { AddressZero } from "@ethersproject/constants";
import _ from "lodash";

export enum ActivityType {
  sale = "sale",
  ask = "ask",
  transfer = "transfer",
  mint = "mint",
  bid = "bid",
  bid_cancel = "bid_cancel",
  ask_cancel = "ask_cancel",
}

export class TransferActivity {
  public static async handleEvent(data:TransferEventData) {
    const token = await getCurrency(data.contract)
    const activity = {
      type: data.fromAddress == AddressZero ? ActivityType.mint : ActivityType.transfer,
      hash: data.transactionHash,
      contract: data.contract,
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      price: 0,
      amount: data.amount,
      blockHash: data.blockHash,
      eventTimestamp: data.timestamp,
      metadata: {
        transactionHash: data.transactionHash,
        logIndex: data.logIndex,
        batchIndex: data.batchIndex,
      },
      token: token||null,
      address: "",
      direction: "",
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
  block: number,
  timestamp: number;
};
