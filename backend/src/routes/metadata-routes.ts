import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { FastifyPluginAsync } from "fastify";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { getNetworkConfig, printRequest } from "../utils/common.js";
import ReturnCode from "../constants/ReturnCode.js";
import ErrorMessage from "../constants/ErrorMessage.js";
import { decode } from "../utils/crypto.js";
import { PAYMASTER_ADDRESS } from "../constants/Pimlico.js";
import { APIKey } from "../models/api-key.js";
import * as EtherspotAbi from "../abi/EtherspotAbi.js";
import { createPublicClient, getAddress, getContract, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const metadataRoutes: FastifyPluginAsync = async (server) => {

  const prefixSecretId = 'arka_';

  let client: SecretsManagerClient;

  const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;

  if (!unsafeMode) {
    client = new SecretsManagerClient();
  }

  server.get('/metadata', async function (request, reply) {
    try {
      printRequest('/metadata', request, server.log);
      const query: any = request.query;
      const chainId = query['chainId'] ?? 1;
      const api_key = query['apiKey'];

      if (!api_key)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      if (!chainId)
        return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.INVALID_DATA})
      let customPaymasters = [];
      let multiTokenPaymasters = [];
      let privateKey: Hex = '0x';
      let supportedNetworks;
      let sponsorName = '', sponsorImage = '';
      if (!unsafeMode) {
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) {
          server.log.info("Invalid Api Key provided")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
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
        supportedNetworks = secrets['SUPPORTED_NETWORKS'];
      } else {
        const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
        if (!apiKeyEntity) {
          server.log.info("Invalid Api Key provided")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        }
        if (apiKeyEntity.erc20Paymasters) {
          const buffer = Buffer.from(apiKeyEntity.erc20Paymasters, 'base64');
          customPaymasters = JSON.parse(buffer.toString());
        }
        if (apiKeyEntity.multiTokenPaymasters) {
          const buffer = Buffer.from(apiKeyEntity.multiTokenPaymasters, 'base64');
          multiTokenPaymasters = JSON.parse(buffer.toString()); 
        }
        sponsorName = apiKeyEntity.sponsorName ? apiKeyEntity.sponsorName : "";
        sponsorImage = apiKeyEntity.logoUrl ? apiKeyEntity.logoUrl : "";
        privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
        supportedNetworks = apiKeyEntity.supportedNetworks;
      }
      if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");
      if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      const provider = createPublicClient({
        transport: http(networkConfig.bundler)
      });
      const signer = privateKeyToAccount(privateKey);
      const sponsorWalletBalance = await provider.getBalance({address: signer.address});
      const sponsorAddress = getAddress(signer.address);

      //get native balance of the sponsor in the EtherSpotPaymaster-contract
      const paymasterContract = getContract({
        abi: EtherspotAbi.default,
        address: networkConfig.contracts.etherspotPaymasterAddress,
        client: provider
      })
      const sponsorBalance = await paymasterContract.read.getSponsorBalance([sponsorAddress]);

      const chainsSupported: {chainId: number, entryPoint: string}[] = [];
      if (supportedNetworks) {
        const buffer = Buffer.from(supportedNetworks, 'base64');
        const SUPPORTED_NETWORKS = JSON.parse(buffer.toString())
        SUPPORTED_NETWORKS.map((element: { chainId: number, entryPoint: string }) => {
          chainsSupported.push({chainId: element.chainId, entryPoint: element.entryPoint ?? "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"});
        })
      } else {
        SupportedNetworks.map(element => {
          chainsSupported.push({chainId: element.chainId, entryPoint: element.entryPoint ?? "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"});
        })
      }
      const tokenPaymasterAddresses = {
        ...PAYMASTER_ADDRESS,
        ...customPaymasters,
      }
      return reply.code(ReturnCode.SUCCESS).send({
        sponsorAddress: sponsorAddress,
        sponsorWalletBalance: sponsorWalletBalance,
        sponsorBalance: sponsorBalance,
        chainsSupported: chainsSupported,
        tokenPaymasters: tokenPaymasterAddresses,
        multiTokenPaymasters,
        sponsorDetails: { name: sponsorName, icon: sponsorImage }
      })
    } catch (err: any) {
      request.log.error(err);
      if (err.name == "ResourceNotFoundException")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })
}

export default metadataRoutes;
