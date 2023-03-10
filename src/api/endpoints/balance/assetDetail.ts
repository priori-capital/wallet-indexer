import { redb } from "@/common/db";
import { fromBuffer, getDaysDifference, regex, toBuffer } from "@/common/utils";
import { RouteOptions, Request } from "@hapi/hapi";
import Joi from "joi";

interface AssetQuery {
  address: string[];
  chainIds?: number[];
}

interface RawAssetObject {
  timestamp: Date;
  contract: Buffer;
  owner: Buffer;
  total_unit: number;
  total_value: number;
  price: number;
  chain_id: number;
  coingecko_id: string;
  decimals: number;
  symbol: string;
  name: string;
  metadata: any;
}
interface AssetObject {
  timestamp: Date;
  contract: string;
  wallet: string;
  balance: number;
  balanceInUsd: number;
  usdPrice: number;
  chainId: number;
  coingeckoId: string;
  decimals: number;
  symbol: string;
  name: string;
  metaData: any;
}

export const getAssetsDetails: RouteOptions = {
  description: "Assets details",
  notes: "Get details for assets of any wallet.",
  tags: ["api", "Assets", "history"],
  validate: {
    query: Joi.object({
      address: Joi.array().items(
        Joi.string()
          .lowercase()
          .pattern(regex.address)
          .description("Wallet, e.g. `0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63`")
      ),
      chainIds: Joi.array().items(Joi.string().description("chain, e.g. `1`")).optional(),
    }),
  },
  handler: async (request: Request) => {
    const query = request.query as AssetQuery;
    const values: { [key: string]: Buffer } = {};
    const chainIdValues: { [key: string]: number } = {};
    const subQuery = query.address
      .map((addr, index: number) => {
        const key = `user${index}`;
        values[key] = toBuffer(addr);
        return `$/${key}/`;
      })
      .join(",");
    let whereQuery = `fb."owner" in (${subQuery})`;
    if (query.chainIds?.length) {
      const subChainIdQuery = query.chainIds
        .map((id, index: number) => {
          const key = `chain${index}`;
          chainIdValues[key] = id;
          return `$/${key}/`;
        })
        .join(",");
      whereQuery += ` and fb.chain_id in (${subChainIdQuery})`;
    }
    const history: RawAssetObject[] | null = await redb.manyOrNone(
      `select *, amount/power(10, awp.decimals) as total_unit, (awp.price * amount)/power(10, awp.decimals) as total_value from (
      select SUM(fb.amount) as amount, contract, "owner", max(fb.chain_id) as chain_id from ft_balances fb 
      where ${whereQuery} group by "owner", fb.contract)
      as y inner join (SELECT DISTINCT ON ("contract") * FROM  assets_with_price ORDER BY contract , "timestamp" desc) as awp on y.contract = awp.contract`,
      {
        ...values,
        ...chainIdValues,
      }
    );

    const data = transformDetails(history);

    return data;
  },
};

const transformDetails = (data: RawAssetObject[]): AssetObject[] =>
  data.map((x: RawAssetObject) => ({
    timestamp: x.timestamp,
    contract: fromBuffer(x.contract),
    wallet: fromBuffer(x.owner),
    balance: x.total_unit,
    balanceInUsd: x.total_value,
    usdPrice: x.price,
    chainId: x.chain_id,
    coingeckoId: x.coingecko_id,
    symbol: x.symbol,
    name: x.name,
    decimals: x.decimals,
    metaData: x.metadata,
  }));
