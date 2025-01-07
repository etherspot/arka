import { FastifyBaseLogger } from 'fastify';
import { TokenPriceAndMetadataCache, SUPPORTED_CHAINIDS } from './interface';

const apiUrl = process.env.COINGECKO_URL || "";
const apiKey = process.env.COINGECKO_API_KEY || "";

export class CoingeckoService {
  static LOGGER_CONTEXT = 'CoingeckoService';
  priceAndMetadata: Map<string, TokenPriceAndMetadataCache> = new Map();

  constructor(
    // private log: FastifyBaseLogger
  ) {
    if (apiUrl === "" || apiKey === "")
      throw new Error("Coingecko Config not provided properly")
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetchPriceByCoinID(tokens: string[], log?: FastifyBaseLogger): Promise<any> {
    let price = null;
    const url = `${apiUrl}/simple/price?ids=${tokens.join(',')}&vs_currencies=usd`;
    const options = {
      method: 'GET',
      headers: {accept: 'application/json', 'x-cg-pro-api-key': apiKey}
    };
    try {
      const data = await fetch(url, options);
      price = await data.json();
    } catch (err) {
      log?.error(err, '', {
        message: 'Failed to fetch native Prices from Coingecko',
        url,
      });
    }
    return price;
  }

  isNetworkSupported(chainId: number): boolean {
    return SUPPORTED_CHAINIDS.includes(chainId) ? true : false;
  }
}