import { redb } from "@/common/db";
import { fromBuffer, regex, toBuffer } from "@/common/utils";
import { RouteOptions, Request } from "@hapi/hapi";
import Joi from "joi";

interface HistoryQuery {
  address: string;
  startDate: Date;
  endDate: Date;
}

export const getHistory: RouteOptions = {
  description: "Historical token transfer details",
  notes: "Get historic data for specific date for any wallet.",
  tags: ["api", "Transfers"],
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
    const history: any | null = await redb.manyOrNone(
      `select uav2.contract_address, uav2.wallet_address,  uav2.total_recieve/power(10, awp.decimals) as total_recieve,
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
    const data = transformHistory(history);
    return data;
  },
};

const getDaysDifference = (query: Omit<HistoryQuery, "address">) => {
  const startDate = new Date(query.startDate);
  const endDate = new Date(query.endDate);
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
};

const transformHistory = (data: any) =>
  data.map((x: any) => ({
    timestamp: x.timestamp,
    contract: fromBuffer(x.contract_address),
    wallet: fromBuffer(x.wallet_address),
    totalRecieve: x.total_recieve,
    recieveCount: x.receive_count,
    totalTransfer: x.total_transfer,
    transferCount: x.transfer_count,
    totalAmount: x.total_amount,
    usdPrice: x.usd_price,
  }));

const defaultDayData = (data: { timestamp: Date; contract: string; wallet: string }) => ({
  ...data,
  totalRecieve: 0,
  recieveCount: 0,
  totalTransfer: 0,
  transferCount: 0,
  totalAmount: 0,
  usdPrice: 0,
});
