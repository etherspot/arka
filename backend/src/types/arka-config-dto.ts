import { Paymaster } from "../paymaster/index.js";

export interface ArkaConfigUpdateData {
    deployedErc20Paymasters: string;
    pythMainnetUrl: string;
    pythTestnetUrl: string;
    pythTestnetChainIds: string;
    pythMainnetChainIds: string;
    cronTime: string;
    customChainlinkDeployed: string;
    coingeckoIds: string;
    coingeckoApiUrl: string;
}

export interface PaymasterRoutesOpts {
    paymaster: Paymaster;
}