import { redb } from "@/common/db";
import { fromBuffer, regex, toBuffer } from "@/common/utils";
import { RouteOptions, Request } from "@hapi/hapi";
import Joi from "joi";

interface BalanceQuery {
  address: string;
}

interface RawBalanceObject {
  contract: Buffer;
  wallet: Buffer;
  name: string;
  coingecko_id: number;
  chain_id: number;
  total_amount: number;
  total_price: number;
  usd_price: number;
}

interface BalanceObject {
  contract: string;
  wallet: string;
  coingeckoId: number;
  chainId: number;
  name: string;
  totalValue: number;
  totalAmount: number;
  usdPrice: number;
}

export const getBalance: RouteOptions = {
  description: "Historical token details",
  notes: "Get total balance for any wallet.",
  tags: ["api", "Transfers", "balance"],
  validate: {
    query: Joi.object({
      address: Joi.string()
        .lowercase()
        .pattern(regex.address)
        .description("Wallet, e.g. `0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63`"),
    }),
  },
  handler: async (request: Request) => {
    const query = request.query as BalanceQuery;
    const address = toBuffer(query.address);
    const history: RawBalanceObject[] | null = await redb.manyOrNone(
      `select y.sum_amount/power(10, awp.decimals) total_amount, awp.price*y.sum_amount/power(10, awp.decimals) total_price, encode(y.owner, 'hex') as wallet,
      encode(y.contract, 'hex') as contract, awp.name, awp.coingecko_id, awp.chain_id, awp.price as usd_price from (
      select SUM(amount) sum_amount, owner, contract from ft_balances fb  
      where "owner" = $/address/
      group by "owner" , "contract" order by SUM(amount) desc) y
      inner join (SELECT DISTINCT ON ("contract") * FROM  assets_with_price ORDER  BY contract , "timestamp") awp on y.contract = awp.contract where owner is not null `,
      {
        address,
      }
    );
    const data = transformBalance(history);

    return data;
  },
};

const transformBalance = (data: RawBalanceObject[]): BalanceObject[] =>
  data.map((x: RawBalanceObject) => ({
    contract: fromBuffer(x.contract),
    wallet: fromBuffer(x.wallet),
    name: x.name,
    coingeckoId: x.coingecko_id,
    chainId: x.chain_id,
    totalAmount: x.total_amount,
    totalValue: x.total_price,
    usdPrice: x.usd_price,
  }));
