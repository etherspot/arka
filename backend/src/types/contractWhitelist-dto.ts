
export interface ContractWhitelistDto {
  walletAddress: string;
  contractAddress: string;
  functionSelectors: string[];
  abi: string;
  chainId: number;
}