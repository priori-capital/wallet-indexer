import { redb } from "@/common/db";
import { fromBuffer, getDaysDifference, regex, toBuffer } from "@/common/utils";
import { RouteOptions, Request } from "@hapi/hapi";
import Joi from "joi";

interface HistoryQuery {
  address: string;
  startDate: Date;
  endDate: Date;
}

interface RawHistoryObject {
  timestamp: Date;
  contract_address: Buffer;
  wallet_address: Buffer;
  total_recieve: number;
  receive_count: number;
  total_transfer: number;
  transfer_count: number;
  total_amount: number;
  total_value: number;
  usd_price: number;
  chain_id: number;
  coingecko_id: string;
  symbol: string;
}
interface HistoryObject {
  timestamp: Date;
  contract: string;
  wallet: string;
  totalRecieve: number;
  recieveCount: number;
  totalTransfer: number;
  transferCount: number;
  totalAmount: number;
  totalValue: number;
  usdPrice: number;
  chainId: number;
  coingeckoId: string;
  symbol: string;
}

export const getHistoryDetails: RouteOptions = {
  description: "Historical token details",
  notes: "Get history details for specific period for any wallet.",
  tags: ["api", "Transfers", "history"],
  validate: {
    query: Joi.object({
      address: Joi.string()
        .lowercase()
        .pattern(regex.address)
        .description("Wallet, e.g. `0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63`"),
      startDate: Joi.date().timestamp("unix"),
      endDate: Joi.date().timestamp("unix").min(Joi.ref("startDate")).required(),
    }),
  },
  handler: async (request: Request) => {
    const query = request.query as HistoryQuery;
    const days = getDaysDifference(query);
    const address = toBuffer(query.address);
    const history: RawHistoryObject[] | null = await redb.manyOrNone(
      `select uav2.contract_address, uav2.wallet_address,  SUM(uav2.total_recieve/power(10, awp.decimals)) as total_recieve,
        SUM(total_transfer/power(10, awp.decimals)) as total_transfer, SUM(total_amount/power(10, awp.decimals)) as total_amount, SUM(awp.price*total_amount/power(10, awp.decimals)) as total_value,
        awp.coingecko_id as "coingecko_id", SUM(transfer_count) as transfer_count, SUM(receive_count) as receive_count, awp.chain_id, max(awp.symbol) as symbol
        from user_aggregated_transactions_details uav2 inner join (SELECT DISTINCT ON ("contract") *
        FROM assets_with_price ORDER  BY contract , "timestamp") awp on uav2.contract_address = awp.contract
        where wallet_address = $/address/
        group by uav2.wallet_address, awp.chain_id, uav2.contract_address, awp.coingecko_id
        `,
      {
        address,
        startDate: query.startDate,
        endDate: query.endDate,
        limit: days,
      }
    );
    const data = transformDetails(history);

    return data;
  },
};

const transformDetails = (data: RawHistoryObject[]): HistoryObject[] =>
  data.map((x: RawHistoryObject) => ({
    timestamp: x.timestamp,
    contract: fromBuffer(x.contract_address),
    wallet: fromBuffer(x.wallet_address),
    totalRecieve: x.total_recieve,
    recieveCount: x.receive_count,
    totalTransfer: x.total_transfer,
    transferCount: x.transfer_count,
    totalAmount: x.total_amount,
    totalValue: x.total_value,
    usdPrice: x.usd_price,
    chainId: x.chain_id,
    coingeckoId: x.coingecko_id,
    symbol: x.symbol,
  }));
