/* eslint-disable @typescript-eslint/no-explicit-any */

import { idb, pgp, redb } from "@/common/db";
import { fromBuffer, toBuffer } from "@/common/utils";
import _ from "lodash";

export class UserActivities {
  public static async addActivities(activities: any[]) {
    if (!activities.length) {
      return;
    }
    // const schema = config.korsoSchema || 'public'
    // const [query, kquery] = await Promise.all([
    //   this.prepareActivityColumnWithSchema(activities, schema),
    //   this.prepareActivityColumnWithSchema(activities)
    // ])
    const query = await this.prepareActivityColumnWithSchema(activities);

    await idb.none(query);

    // await Promise.all([idb.none(query), kdb.none(kquery)]);
  }

  private static async prepareActivityColumnWithSchema(activities: any[], schema = "public") {
    const columns = new pgp.helpers.ColumnSet(
      [
        "hash",
        "type",
        "contract",
        "from_address",
        "to_address",
        "amount",
        "block_hash",
        "block",
        "event_timestamp",
        "metadata",
        "chain_id",
      ],
      { table: { table: "user_activities", schema: schema } }
    );
    const data = activities.map((activity) => ({
      type: activity.type,
      hash: toBuffer(activity.hash),
      contract: toBuffer(activity.contract),
      // address: toBuffer(activity.address),
      from_address: toBuffer(activity.fromAddress),
      to_address: activity.toAddress ? toBuffer(activity.toAddress) : null,
      amount: activity.amount,
      block: activity.block,
      block_hash: activity.blockHash ? toBuffer(activity.blockHash) : null,
      event_timestamp: activity.eventTimestamp,
      metadata: activity.metadata,
      // direction: activity.direction,
      chain_id: activity.chainId,
    }));

    const query = pgp.helpers.insert(data, columns) + " ON CONFLICT DO NOTHING";
    return query;
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
      `select ua.*, ua.amount/power(10, awp.decimals) as formatted_amount, awp."name", awp.symbol, awp.decimals, awp.metadata, awp.price from user_activities ua
      left join assets_with_price awp
      on ua .contract = awp .contract
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
        token: {
          name: activity.name,
          symbol: activity.symbol,
          decimals: activity.decimals,
          price: activity.price,
          image: activity.metadata.image,
        },
        from: fromBuffer(activity.from_address),
        destination: fromBuffer(activity.to_address),
        amount: activity.formatted_amount,
        blockNumber: activity.block,
        logIndex: activity.metadata.logIndex,
        batchIndex: activity.metadata.batchIndex,
        timestamp: activity.event_timestamp,
        chainId: activity.chain_id,
      }));
    }

    return [];
  }

  public static async getActivityDetails(txHash: string) {
    const values = toBuffer(txHash);

    const activities: any | null = await redb.manyOrNone(
      `SELECT ua.*, ua.amount/power(10, awp.decimals) as formatted_amount, awp."name", awp.symbol, awp.decimals, awp.metadata, awp.price
      FROM user_activities ua
      right join assets_with_price awp
       on ua.contract = awp .contract
      WHERE ua.hash = $/values/`,
      { values }
    );
    if (activities) {
      const s = _.map(activities, (activity) => {
        const sp = {
          type: activity.type,
          txHash: fromBuffer(activity.hash),
          token: {
            name: activity.name,
            symbol: activity.symbol,
            decimals: activity.decimals,
            price: activity.price,
            image: activity.metadata.image,
          },
          from: fromBuffer(activity.from_address),
          destination: fromBuffer(activity.to_address),
          amount: activity.formatted_amount,
          blockNumber: activity.block,
          logIndex: activity.metadata.logIndex,
          batchIndex: activity.metadata.batchIndex,
          timestamp: activity.event_timestamp,
          chainId: activity.chain_id,
        };
        return sp;
      });
      return s;
    }
    return [];
  }

  // public static async deleteByBlockHash(blockHash: string) {
  //   const query = `DELETE FROM user_activities
  //                  WHERE block_hash = $/blockHash/`;

  //   return await idb.none(query, { blockHash });
  // }
}
