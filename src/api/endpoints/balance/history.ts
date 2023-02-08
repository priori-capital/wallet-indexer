import { redb } from "@/common/db";
import { fromBuffer, regex, toBuffer } from "@/common/utils";
import { RouteOptions, Request } from "@hapi/hapi";
import Joi from "joi";

interface HistoryQuery {
  address: string;
  startDate: Date;
  endDate: Date;
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

class History {
  private timestamp = new Date();
  private contract = "";
  private wallet = "";
  private totalRecieve = 0;
  private recieveCount = 0;
  private totalTransfer = 0;
  private transferCount = 0;
  private totalAmount = 0;
  private usdPrice = 0;
  public get getHistory(): HistoryObject {
    return {
      timestamp: this.timestamp,
      contract: this.contract,
      wallet: this.wallet,
      totalRecieve: this.totalRecieve,
      recieveCount: this.recieveCount,
      totalTransfer: this.totalTransfer,
      transferCount: this.transferCount,
      totalAmount: this.totalAmount,
      usdPrice: this.usdPrice,
    };
  }
  public set setHistory(data: HistoryObject) {
    this.timestamp = data.timestamp ?? this.timestamp;
    this.contract = data.contract ?? this.contract;
    this.wallet = data.wallet ?? this.wallet;
    this.totalRecieve = data.totalRecieve ?? this.totalRecieve;
    this.recieveCount = data.recieveCount ?? this.recieveCount;
    this.totalTransfer = data.totalTransfer ?? this.totalTransfer;
    this.transferCount = data.transferCount ?? this.transferCount;
    this.totalAmount = data.totalAmount ?? this.totalAmount;
    this.usdPrice = data.usdPrice ?? this.usdPrice;
  }
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
    const data = transformHistory(history);
    const result: HistoryObject[] = [];
    const historyObject = new History();
    historyObject.setHistory = data[0];
    const startDate = query.startDate;
    for (let i = 0, j = 0; j < data.length; ) {
      const selectedDate = addDays(startDate, i);
      const dayDifference = getDaysDifference({
        startDate: data[j].timestamp,
        endDate: selectedDate,
      });
      if (dayDifference < 0) {
        for (let k = 0; k < Math.abs(dayDifference); k++) {
          result.push({
            ...(historyObject.getHistory as HistoryObject),
            timestamp: addDays(selectedDate, k),
          });
        }
        i += Math.abs(dayDifference);
      } else if (dayDifference > 0) {
        historyObject.setHistory = data[j++];
      } else {
        result.push(data[j]);
        historyObject.setHistory = data[j++];
        i++;
      }
    }
    if (result.length < days) {
      const dayDifference = days - result.length;
      const lastDayHistory = result[result.length - 1];
      for (let i = 0; i < dayDifference; i++) {
        result.push({
          ...lastDayHistory,
          timestamp: addDays(lastDayHistory.timestamp, i + 1),
        });
      }
    }
    return result;
  },
};

const getDaysDifference = (query: Omit<HistoryQuery, "address">) => {
  const startDate = new Date(query.startDate);
  const endDate = new Date(query.endDate);
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
};

const transformHistory = (data: any): HistoryObject[] =>
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

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
