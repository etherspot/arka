import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import ErrorMessage from "../constants/ErrorMessage.js";
import { FastifyBaseLogger } from "fastify";
import { providers, Wallet } from "ethers";
import { getNetworkConfig } from "./common";

export type SafeModeAPIKey = {
    apiKey: string;
    walletAddress: string;
    privateKey: string;
    supportedNetworks?: string | null;
    erc20Paymasters?: string | null;
    erc20PaymastersV2?: string | null;
    multiTokenPaymasters?: string | null;
    multiTokenOracles?: string | null;
    sponsorName?: string | null;
    logoUrl?: string | null;
  }

export const getApiKeyDetailsForAChainIdInSafeMode = async (apiKey : string, log: FastifyBaseLogger) : Promise<SafeModeAPIKey> => {

    const prefixSecretId = 'arka_';

    const client: SecretsManagerClient = new SecretsManagerClient();

    const AWSresponse = await client.send(
        new GetSecretValueCommand({
            SecretId: prefixSecretId + apiKey,
        })
    );

    let customPaymasters = [];
    let multiTokenPaymasters = [];
    let privateKey = '';
    let supportedNetworks;
    let sponsorName = '', sponsorImage = '';

    const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
    if (!secrets['PRIVATE_KEY']) {
        log.error("Invalid Api Key provided")
        throw new Error(ErrorMessage.INVALID_API_KEY);
    }
    if (secrets['ERC20_PAYMASTERS']) {
        const buffer = Buffer.from(secrets['ERC20_PAYMASTERS'], 'base64');
        customPaymasters = JSON.parse(buffer.toString());
    }
    if (secrets['MULTI_TOKEN_PAYMASTERS']) {
        const buffer = Buffer.from(secrets['MULTI_TOKEN_PAYMASTERS'], 'base64');
        multiTokenPaymasters = JSON.parse(buffer.toString());
    }
    sponsorName = secrets['SPONSOR_NAME'];
    sponsorImage = secrets['LOGO_URL'];
    privateKey = secrets['PRIVATE_KEY'];

    const networkConfig = getNetworkConfig(1, supportedNetworks ?? '', "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");
    if (!networkConfig) {
        throw new Error(ErrorMessage.UNSUPPORTED_NETWORK);
    }
    const provider = new providers.JsonRpcProvider(networkConfig.bundler);
    const signer = new Wallet(privateKey, provider)
    const sponsorAddress = await signer.getAddress();

    supportedNetworks = secrets['SUPPORTED_NETWORKS'];

    return {
        apiKey: apiKey,
        walletAddress: sponsorAddress,
        privateKey: privateKey,
        supportedNetworks: supportedNetworks,
        erc20Paymasters: customPaymasters,
        multiTokenPaymasters: multiTokenPaymasters,
        sponsorName: sponsorName,
        logoUrl: sponsorImage,
    }
}