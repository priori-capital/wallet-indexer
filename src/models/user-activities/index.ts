/* eslint-disable @typescript-eslint/no-explicit-any */

import { idb, pgp, redb } from "@/common/db";
import { formatEth, fromBuffer, toBuffer } from "@/common/utils";
import _ from "lodash";

export class UserActivities {
  public static async addActivities(activities: any[]) {
    if (!activities.length) {
      return;
    }

    const columns = new pgp.helpers.ColumnSet(
      [
        "hash",
        "type",
        "contract",
        "address",
        "from_address",
        "to_address",
        "price",
        "amount",
        "block_hash",
        "block",
        "event_timestamp",
        "token",
        "metadata",
        "direction",
        "chain_id",
      ],
      { table: "user_activities" }
    );

    const data = activities.map((activity) => ({
      type: activity.type,
      hash: toBuffer(activity.hash),
      token: activity.token,
      contract: toBuffer(activity.contract),
      address: toBuffer(activity.address),
      from_address: toBuffer(activity.fromAddress),
      to_address: activity.toAddress ? toBuffer(activity.toAddress) : null,
      price: activity.price,
      amount: activity.amount,
      block: activity.block,
      block_hash: activity.blockHash ? toBuffer(activity.blockHash) : null,
      event_timestamp: activity.eventTimestamp,
      metadata: activity.metadata,
      direction: activity.direction,
      chain_id: activity.chainId,
    }));

    const query = pgp.helpers.insert(data, columns) + " ON CONFLICT DO NOTHING";

    await idb.none(query);
  }
  public static async getActivities(
    users: string[],
    createdBefore: null | string = null,
    limit = 20,
    sortBy = "eventTimestamp"
  ) {
    const sortByColumn = sortBy == "eventTimestamp" ? "event_timestamp" : "created_at";
    const continuation = "";
    let usersFilter = "";
    let i = 0;
    const values = {
      limit,
      createdBefore: sortBy == "eventTimestamp" ? Number(createdBefore) : createdBefore,
    };

    const addUsersToFilter = (user: string) => {
      ++i;
      (values as any)[`user${i}`] = toBuffer(user);
      usersFilter = `${usersFilter}$/user${i}/, `;
    };

    users.forEach(addUsersToFilter);

    usersFilter = `address IN (${usersFilter.substring(0, usersFilter.lastIndexOf(", "))})`;

    const activities: any[] | null = await redb.manyOrNone(
      `SELECT *
               FROM user_activities
               WHERE ${usersFilter}
               ${continuation}
               ORDER BY ${sortByColumn} DESC NULLS LAST
               LIMIT $/limit/`,
      values
    );

    if (activities) {
      return _.map(activities, (activity) => ({
        type: activity.type,
        txHash: fromBuffer(activity.hash),
        direction: activity.direction,
        token: fromBuffer(activity.contract),
        from: fromBuffer(activity.from_address),
        destination: fromBuffer(activity.to_address),
        amount: String(activity.amount),
        account: fromBuffer(activity.address),
        blockNumber: activity.block,
        logIndex: activity.metadata.logIndex,
        batchIndex: activity.metadata.batchIndex,
        timestamp: activity.eventTimestamp,
        price: activity.price ? formatEth(activity.price) : null,
        chainId: activity.chainId,
      }));
    }

    return [];
  }

  // public static async deleteByBlockHash(blockHash: string) {
  //   const query = `DELETE FROM user_activities
  //                  WHERE block_hash = $/blockHash/`;

  //   return await idb.none(query, { blockHash });
  // }

  // public static async updateMissingCollectionId(
  //   contract: string,
  //   tokenId: string,
  //   collectionId: string
  // ) {
  //   const query = `
  //           UPDATE user_activities
  //           SET collection_id = $/collectionId/
  //           WHERE user_activities.contract = $/contract/
  //           AND user_activities.token_id = $/tokenId/
  //           AND user_activities.collection_id IS NULL
  //       `;

  //   return await idb.none(query, {
  //     contract: toBuffer(contract),
  //     tokenId,
  //     collectionId,
  //   });
  // }
}
