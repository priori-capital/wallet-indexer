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
  recieve_count: number;
  total_transfer: number;
  transfer_count: number;
  total_amount: number;
  usd_price: number;
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
  usdPrice: number;
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
      `select uav2.timestamp, uav2.contract_address, uav2.wallet_address,  uav2.total_recieve/power(10, awp.decimals) as total_recieve,
        total_transfer/power(10, awp.decimals) as total_transfer, total_amount/power(10, awp.decimals) as total_amount, awp."name" "contractName",
        awp.coingecko_id as "coingeckoId", transfer_count, receive_count, awp.price as usd_price
        from user_activity_view uav2 right join assets_with_price awp on uav2.contract_address = awp.contract and uav2."timestamp" <= awp."timestamp" where uav2."timestamp" 
        in (select distinct uav.timestamp from user_activity_view uav
        where wallet_address = $/address/ and timestamp <= $/endDate/ 
        order by uav.timestamp limit $/limit/) 
        and wallet_address = $/address/ order by awp.timestamp desc, uav2.timestamp asc`,
      {
        address,
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
    recieveCount: x.recieve_count,
    totalTransfer: x.total_transfer,
    transferCount: x.transfer_count,
    totalAmount: x.total_amount,
    usdPrice: x.usd_price,
  }));
