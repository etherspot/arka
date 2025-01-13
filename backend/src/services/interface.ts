export const NETWORK_CHAINID_TO_COINID: Record<number, string> = {
  1: 'ethereum',
  137: 'matic-network',
  56: 'binancecoin',
  100: 'xdai',
  43114: 'avalanche-2',
  10: 'ethereum',
  42161: 'ethereum',
  204: 'binancecoin',
  8453: 'ethereum',
  59144: 'ethereum',
  534352: 'weth'
};

export const NETWORK_CHAINID_TO_COINGECKO_NETWORK: Record<number, string> = {
  1: 'ethereum',
  137: 'polygon-pos',
  56: 'binance-smart-chain',
  100: 'xdai',
  43114: 'avalanche',
  10: 'optimistic-ethereum',
  42161: 'arbitrum-one',
  204: 'opbnb',
  8453: 'base',
  59144: 'linea',
  534352: 'scroll'
};

export const SUPPORTED_CHAINIDS = [
  1,
  10,
  56,
  100,
  137,
  204,
  8453,
  43114,
  42161,
  59144,
  534352
];

interface TokenPriceAndMetadata {
  decimals: number;
  symbol: string;
  USDPrice: number;
  gasToken: string
}

export interface TokenPriceAndMetadataCache {
  data: TokenPriceAndMetadata;
  expiry: number
}