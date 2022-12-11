import { idb } from "@/common/db";
import { fromBuffer, toBuffer } from "@/common/utils";

export type Block = {
  hash: string;
  number: number;
  timestamp: number;
};

export const saveBlock = async (chainId: number, block: Block): Promise<Block> => {
  await idb.none(
    `
      INSERT INTO blocks_${chainId} (
        hash,
        number,
        "timestamp"
      ) VALUES (
        $/hash/,
        $/number/,
        $/timestamp/
      )
      ON CONFLICT DO NOTHING
    `,
    {
      hash: toBuffer(block.hash),
      number: block.number,
      timestamp: block.timestamp,
    }
  );

  return block;
};

export const deleteBlock = async (chainId: number, number: number, hash: string) =>
  idb.none(
    `
      DELETE FROM blocks_${chainId} as blocks
      WHERE blocks.hash = $/hash/
        AND blocks.number = $/number/
    `,
    {
      hash: toBuffer(hash),
      number,
    }
  );

export const getBlocks = async (chainId = 1, number: number): Promise<Block[]> => {
  return idb
    .manyOrNone(
      `
      SELECT
        blocks.hash,
        blocks.timestamp
      FROM blocks_${chainId} as blocks
      WHERE blocks.number = $/number/
    `,
      { number }
    )
    .then((result) =>
      result.map(({ hash, timestamp }) => ({
        hash: fromBuffer(hash),
        number,
        timestamp,
      }))
    );
};
