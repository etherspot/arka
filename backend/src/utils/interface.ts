import { BigNumber } from "ethers";

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
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
  gasPrice: BigNumber;
}