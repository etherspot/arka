export interface EtherscanResponse {
  jsonrpc?: string;
  id?: string;
  status?: string;
  message?: string;
  result?: {
    LastBlock: string;
    SafeGasPrice: string;
    ProposeGasPrice: string;
    FastGasPrice: string;
    suggestBaseFee: string;
    gasUsedRatio: string;
  } | string;
}

export interface getEtherscanFeeResponse {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasPrice: bigint;
}

export interface NetworkConfig {
  chainId: number;
  bundler: string;
  contracts: {
    etherspotPaymasterAddress: string;
  };
  thresholdValue: string;
  MultiTokenPaymasterOracleUsed: string;
  entryPoint: string;
}