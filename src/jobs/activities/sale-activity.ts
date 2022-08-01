import { ActivitiesEntityInsertParams, ActivityType } from "@/models/activities/activities-entity";
import { Tokens } from "@/models/tokens";
import _ from "lodash";
import { logger } from "@/common/logger";
import { Activities } from "@/models/activities";
import { getActivityHash } from "@/jobs/activities/utils";
import { UserActivitiesEntityInsertParams } from "@/models/user_activities/user-activities-entity";
import { UserActivities } from "@/models/user_activities";

export class SaleActivity {
  public static async handleEvent(data: FillEventData) {
    const token = await Tokens.getByContractAndTokenId(data.contract, data.tokenId, true);

    // If no token found
    if (_.isNull(token)) {
      logger.warn("sale-activity", `No token found for ${JSON.stringify(data)}`);
      return;
    }

    // If no collection found
    if (!token.collectionId) {
      logger.warn("sale-activity", `No collection found for ${JSON.stringify(data)}`);
    }

    const activityHash = getActivityHash(
      data.transactionHash,
      data.logIndex.toString(),
      data.batchIndex.toString()
    );

    const activity = {
      type: ActivityType.sale,
      hash: activityHash,
      contract: data.contract,
      collectionId: token.collectionId,
      tokenId: data.tokenId,
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      price: data.price,
      amount: data.amount,
      blockHash: data.blockHash,
      eventTimestamp: data.timestamp,
      metadata: {
        transactionHash: data.transactionHash,
        logIndex: data.logIndex,
        batchIndex: data.batchIndex,
        orderId: data.orderId,
      },
    } as ActivitiesEntityInsertParams;

    // One record for the user to address, One record for the user from address
    const toUserActivity = _.clone(activity) as UserActivitiesEntityInsertParams;
    const fromUserActivity = _.clone(activity) as UserActivitiesEntityInsertParams;

    toUserActivity.address = data.toAddress;
    fromUserActivity.address = data.fromAddress;

    await Promise.all([
      Activities.addActivities([activity]),
      UserActivities.addActivities([fromUserActivity, toUserActivity]),
    ]);
  }
}

export type FillEventData = {
  contract: string;
  tokenId: string;
  fromAddress: string;
  toAddress: string;
  price: number;
  amount: number;
  transactionHash: string;
  logIndex: number;
  batchIndex: number;
  blockHash: string;
  timestamp: number;
  orderId: string;
};
