import { idb, pgp } from "@/common/db";
import { logger } from "@/common/logger";
import { toBuffer } from "@/common/utils";
import { BaseEventParams } from "@/events-sync/parser";
import * as ftTransfersWriteBuffer from "@/jobs/events-sync/write-buffers/ft-transfers";

export type Event = {
  from: string;
  to: string;
  amount: string;
  baseEventParams: BaseEventParams;
  chainId: number;
};

type DbEvent = {
  address: Buffer;
  block: number;
  block_hash: Buffer;
  tx_hash: Buffer;
  tx_index: number;
  log_index: number;
  timestamp: number;
  from: Buffer;
  to: Buffer;
  amount: string;
  chainId: number;
};

const wait = () => new Promise((r) => setTimeout(r, 2000));

export const addEvents = async (events: Event[], backfill: boolean, chainId: number, retry = 0) => {
  const transferValues: DbEvent[] = [];
  try {
    // events.sort((a, b) => {
    //   if (a.baseEventParams.address < b.baseEventParams.address) {
    //     return -1;
    //   }
    //   if (a.baseEventParams.address > b.baseEventParams.address) {
    //     return 1;
    //   }
    //   return 0;
    // });
    for (const event of events) {
      transferValues.push({
        address: toBuffer(event.baseEventParams.address),
        block: event.baseEventParams.block,
        block_hash: toBuffer(event.baseEventParams.blockHash),
        tx_hash: toBuffer(event.baseEventParams.txHash),
        tx_index: event.baseEventParams.txIndex,
        log_index: event.baseEventParams.logIndex,
        timestamp: event.baseEventParams.timestamp,
        from: toBuffer(event.from),
        to: toBuffer(event.to),
        amount: event.amount,
        chainId: chainId,
      });
    }

    // transferValues.sort((a, b) => Buffer.compare(a.address, b.address));
    const queries: string[] = [];

    if (transferValues.length) {
      const columns = new pgp.helpers.ColumnSet(
        [
          "address",
          "block",
          "block_hash",
          "tx_hash",
          "tx_index",
          "log_index",
          "timestamp",
          "from",
          "to",
          "amount",
          "chainId",
        ],
        { table: "ft_transfer_events" }
      );

      // Atomically insert the transfer events and update balances
      queries.push(`
        INSERT INTO "ft_transfer_events" (
          "address",
          "block",
          "block_hash",
          "tx_hash",
          "tx_index",
          "log_index",
          "timestamp",
          "from",
          "to",
          "amount",
          "chainId"
        ) VALUES ${pgp.helpers.values(transferValues, columns)}
        ON CONFLICT DO NOTHING
    `);
    }

    if (queries.length) {
      if (backfill) {
        // When backfilling, use the write buffer to avoid deadlocks
        await ftTransfersWriteBuffer.addToQueue(pgp.helpers.concat(queries));
      } else {
        // Otherwise write directly since there might be jobs that depend
        // on the events to have been written to the database at the time
        // they get to run and we have no way to easily enforce this when
        // using the write buffer.
        await idb.none(pgp.helpers.concat(queries));
      }
    }
    logger.info("ft-events-deadlock", `succedssfull completiom free_chain_id:${chainId}`);
  } catch (err) {
    await wait();
    logger.error(
      "ft-events-deadlock",
      `${err} >>>>>>>>>>>/\n  >>>>>>>>>>/\n deadlock_id:${chainId} :: ${retry}`
    );
    if (retry < 10) {
      await addEvents(events, backfill, chainId, retry + 1);
    } else {
      throw err;
    }
  }
};

export const removeEvents = async (block: number, blockHash: string) => {
  // Atomically delete the transfer events and revert balance updates
  await idb.any(
    `
      WITH "x" AS (
        DELETE FROM "ft_transfer_events"
        WHERE "block" = $/block/ AND "block_hash" = $/blockHash/
        RETURNING
          "address",
          ARRAY["from", "to"] AS "owners",
          ARRAY["amount", -"amount"] AS "amount_deltas"
      )
      INSERT INTO "ft_balances" (
        "contract",
        "owner",
        "amount"
      ) (
        SELECT
          "y"."address",
          "y"."owner",
          SUM("y"."amount_delta")
        FROM (
          SELECT
            "address",
            unnest("owners") AS "owner",
            unnest("amount_deltas") AS "amount_delta"
          FROM "x"
        ) "y"
        GROUP BY "y"."address", "y"."owner"
      )
      ON CONFLICT ("contract", "owner") DO
      UPDATE SET "amount" = "ft_balances"."amount" + "excluded"."amount"
    `,
    {
      block,
      blockHash: toBuffer(blockHash),
    }
  );
};
