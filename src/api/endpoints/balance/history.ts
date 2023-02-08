import { redb } from "@/common/db";
import { addDays, fromBuffer, getDaysDifference, regex, toBuffer } from "@/common/utils";
import { RouteOptions, Request } from "@hapi/hapi";
import Joi from "joi";

interface HistoryQuery {
  address: string;
  startDate: Date;
  endDate: Date;
}

interface HistoryObject {
  timestamp: Date;
  wallet: string;
  totalAmount: number;
  usdPrice: number;
}

class History {
  private timestamp = new Date();
  private wallet = "";
  private totalAmount = 0;
  private usdPrice = 0;
  public get getHistory(): HistoryObject {
    return {
      timestamp: this.timestamp,
      wallet: this.wallet,
      totalAmount: this.totalAmount,
      usdPrice: this.usdPrice,
    };
  }
  public set setHistory(data: HistoryObject) {
    this.timestamp = data.timestamp ?? this.timestamp;
    this.wallet = data.wallet ?? this.wallet;
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
      `select SUM(y.total_amount) total_amount, SUM(y.usd_price) usd_price, y.wallet_address, y.timestamp from (
        select uav2.timestamp, uav2.wallet_address, total_amount/power(10, awp.decimals) as total_amount, awp.price * total_amount/power(10, awp.decimals) as usd_price
        from user_activity_view uav2 right join assets_with_price awp on uav2.contract_address = awp.contract and uav2."timestamp" <= awp."timestamp" where uav2."timestamp" 
        in (select distinct uav.timestamp from user_activity_view uav
        where wallet_address = $/address/ and timestamp <= $/endDate/ 
        order by uav.timestamp limit $/limit/) 
        and wallet_address = $/address/ order by awp.timestamp desc, uav2.timestamp asc) y group by y.wallet_address, y.timestamp order by y.timestamp`,
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

const transformHistory = (data: any): HistoryObject[] =>
  data.map((x: any) => ({
    timestamp: x.timestamp,
    wallet: fromBuffer(x.wallet_address),
    totalAmount: x.total_amount,
    usdPrice: x.usd_price,
  }));
