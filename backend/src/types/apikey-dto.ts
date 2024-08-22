
export interface ApiKeyDto {
     apiKey: string;
     walletAddress: string | null;
     privateKey: string | null;
     supportedNetworks: string | null;
     bundlerApiKey: string | null;
     erc20Paymasters: string | null;
     multiTokenPaymasters: string | null;
     multiTokenOracles: string | null;
     sponsorName: string | null;
     logoUrl: string | null;
     transactionLimit: number | null;
     noOfTransactionsInAMonth: number | null;
     indexerEndpoint: string | null;
}
