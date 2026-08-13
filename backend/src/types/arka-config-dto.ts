import { Paymaster } from "../paymaster/index.js";
import type { SecretManager } from "../services/secrets-manager/interface.js";

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

export interface SecretManagerRoutesOpts {
    secretManager: SecretManager;
}

export interface PaymasterRoutesOpts extends SecretManagerRoutesOpts {
    paymaster: Paymaster;
}
