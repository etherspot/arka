
export interface ContractWhitelistDto {
  walletAddress: string;
  contractAddress: string;
  eventNames: string[];
  abi: string;
  chainId: number;
}