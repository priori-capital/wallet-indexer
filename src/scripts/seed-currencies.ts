import { logger } from "@/common/logger";
import axios from "axios";
import fs from "fs";
import _ from "lodash";

const fetchCoinsIni = async () => {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/list?include_platform=true`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenList: any[] = [];
    const allTokens = await axios.get(url, { timeout: 10 * 1000 }).then((data) => data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(allTokens.data).forEach((coin: any) => {
      let s = {
        id: "",
        symbol: "",
        name: "",
        polygonpos: "",
        ethereum: "",
      };
      if (Object.keys(coin[1].platforms).length) {
        s = {
          id: coin[1].id,
          symbol: coin[1].symbol,
          name: coin[1].name,
          ethereum: "",
          polygonpos: "",
        };
        if (
          // eslint-disable-next-line no-prototype-builtins
          coin[1].platforms.hasOwnProperty("ethereum") ||
          // eslint-disable-next-line no-prototype-builtins
          coin[1].platforms.hasOwnProperty("polygon-pos")
        ) {
          s.ethereum = coin[1].platforms["ethereum"];
          s.polygonpos = coin[1].platforms["polygon-pos"];
          tokenList.push(s);
        }
      }
    });
    return tokenList;
  } catch (err) {
    logger.error("process", `fetchCoinsIni: ${err}`);
  }
};

const fetchUniswapTokenList = async () => {
  const uniswapurl = `https://gateway.ipfs.io/ipns/tokens.uniswap.org`;
  const uniTokens = await axios.get(uniswapurl, { timeout: 10 * 1000 }).then((data) => data);
  return uniTokens.data["tokens"];
};

fetchCoinsIni()
  .then(async (res) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const erc20List: any[] = [];
    const unilist = await fetchUniswapTokenList();
    res?.forEach((token) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addressExists = _.find(unilist, (item: any) => {
        return item?.address?.toLowerCase() === token?.ethereum?.toLowerCase();
      });
      if (addressExists) {
        token.decimals = addressExists?.decimals;
        token.image = addressExists?.logoURI;
        erc20List.push(token);
      }
    });
    fs.writeFile(`erc20tokenlist${Date.now()}.json`, JSON.stringify(erc20List), (error) => {
      if (error) throw error;
    });
  })
  .catch(() => {
    process.exit(1);
  });
