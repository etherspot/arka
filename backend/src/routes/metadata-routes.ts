/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { FastifyPluginAsync } from "fastify";
import { Contract, Wallet, providers } from "ethers";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { getNetworkConfig, printRequest } from "../utils/common.js";
import ReturnCode from "../constants/ReturnCode.js";
import ErrorMessage from "../constants/ErrorMessage.js";
import { decode } from "../utils/crypto.js";
import { PAYMASTER_ADDRESS } from "../constants/Token.js";
import { APIKey } from "../models/api-key.js";
import * as EtherspotAbi from "../abi/EtherspotAbi.js";
import {abi as verifyingPaymasterAbi} from "../abi/VerifyingPaymasterAbi.js";
import {abi as verifyingPaymasterV2Abi} from "../abi/VerifyingPaymasterAbiV2.js";
import {abi as verifyingPaymastersV3Abi} from "../abi/VerifyingPaymasterAbiV3.js";
import { getAddress } from "ethers/lib/utils";

const metadataRoutes: FastifyPluginAsync = async (server) => {

  const prefixSecretId = 'arka_';

  const SUPPORTED_ENTRYPOINTS = {
    EPV_06: server.config.EPV_06,
    EPV_07: server.config.EPV_07,
    EPV_08: server.config.EPV_08
  }

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
      if (!api_key || typeof(api_key) !== "string")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      if (!chainId)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA })
      let customPaymasters = [];
      let multiTokenPaymasters = [];
      let privateKey = '';
      let sponsorName = '', sponsorImage = '';
      let bundlerApiKey = api_key;
      const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
      if (!apiKeyEntity) {
        server.log.info("Invalid Api Key provided")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      }
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
        privateKey = secrets['PRIVATE_KEY'];
      } else {
        privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
      }
      if (apiKeyEntity.erc20Paymasters) {
        const buffer = Buffer.from(apiKeyEntity.erc20Paymasters, 'base64');
        customPaymasters = JSON.parse(buffer.toString());
      }
      if (apiKeyEntity.multiTokenPaymasters) {
        const buffer = Buffer.from(apiKeyEntity.multiTokenPaymasters, 'base64');
        multiTokenPaymasters = JSON.parse(buffer.toString());
      }
      if (apiKeyEntity.bundlerApiKey) {
        bundlerApiKey = apiKeyEntity.bundlerApiKey;
      }
      sponsorName = apiKeyEntity.sponsorName ? apiKeyEntity.sponsorName : "";
      sponsorImage = apiKeyEntity.logoUrl ? apiKeyEntity.logoUrl : "";
      const supportedNetworks = apiKeyEntity.supportedNetworks;
      if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_06);
      if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      let bundlerUrl = networkConfig.bundler;
      if (bundlerUrl.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
      const provider = new providers.JsonRpcProvider(bundlerUrl);
      const signer = new Wallet(privateKey, provider)
      const sponsorWalletBalance = await signer.getBalance();
      const sponsorAddress = await signer.getAddress();
      let sponsorBalance = 0;

      if (networkConfig.contracts.etherspotPaymasterAddress) {
        try {
          //get native balance of the sponsor in the EtherSpotPaymaster-contract
          const paymasterContract = new Contract(getAddress(networkConfig.contracts.etherspotPaymasterAddress), EtherspotAbi.default, provider);
          sponsorBalance = await paymasterContract.getDeposit();
        } catch (err) {
          request.log.error(err);
        }
      }

      const verifyingPaymaster = apiKeyEntity.verifyingPaymasters ? JSON.parse(apiKeyEntity.verifyingPaymasters)[chainId] : undefined;
      let verifyingPaymasterDeposit = 0;
      if (verifyingPaymaster) {
        try {
          // VerifyingPaymaster address is stored in the DB as checksummed address so no need to checksum it
          const vpContract = new Contract(verifyingPaymaster, verifyingPaymasterAbi ,provider);
          verifyingPaymasterDeposit = await vpContract.getDeposit();
        } catch (err) {
          request.log.error(err);
        }
      }
      const chainsSupported: { chainId: number, entryPoint: string }[] = [];
      SupportedNetworks.map(element => {
        chainsSupported.push({ chainId: element.chainId, entryPoint: element.entryPoint });
      })
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
        sponsorDetails: { name: sponsorName, icon: sponsorImage },
        verifyingPaymaster: { address: verifyingPaymaster, deposit: verifyingPaymasterDeposit },
        verifyingPaymasters: apiKeyEntity.verifyingPaymasters ? JSON.parse(apiKeyEntity.verifyingPaymasters) : undefined,
        verifyingPaymastersV2: apiKeyEntity.verifyingPaymastersV2 ? JSON.parse(apiKeyEntity.verifyingPaymastersV2) : undefined,
        verifyingPaymastersV3: apiKeyEntity.verifyingPaymastersV3 ? JSON.parse(apiKeyEntity.verifyingPaymastersV3) : undefined,
      })
    } catch (err: any) {
      request.log.error(err);
      if (err.name == "ResourceNotFoundException")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.get('/metadata/v2', async function (request, reply) {
    try {
      printRequest('/metadata/v2', request, server.log);
      const query: any = request.query;
      const chainId = query['chainId'] ?? 1;
      const api_key = query['apiKey'];
      if (!api_key || typeof(api_key) !== "string")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      if (!chainId)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA })
      let customPaymasters = [];
      let multiTokenPaymasters = [];
      let privateKey = '';
      let sponsorName = '', sponsorImage = '';
      let bundlerApiKey = api_key;
      const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
      if (!apiKeyEntity) {
        server.log.info("Invalid Api Key provided")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      }
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
        privateKey = secrets['PRIVATE_KEY'];
      } else {
        privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
      }
      if (apiKeyEntity.erc20Paymasters) {
        const buffer = Buffer.from(apiKeyEntity.erc20Paymasters, 'base64');
        customPaymasters = JSON.parse(buffer.toString());
      }
      if (apiKeyEntity.multiTokenPaymasters) {
        const buffer = Buffer.from(apiKeyEntity.multiTokenPaymasters, 'base64');
        multiTokenPaymasters = JSON.parse(buffer.toString());
      }
      if (apiKeyEntity.bundlerApiKey) {
        bundlerApiKey = apiKeyEntity.bundlerApiKey;
      }
      sponsorName = apiKeyEntity.sponsorName ? apiKeyEntity.sponsorName : "";
      sponsorImage = apiKeyEntity.logoUrl ? apiKeyEntity.logoUrl : "";
      const supportedNetworks = apiKeyEntity.supportedNetworks;
      if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
      if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      let bundlerUrl = networkConfig.bundler;
      if (bundlerUrl.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
      const provider = new providers.JsonRpcProvider(bundlerUrl);
      const signer = new Wallet(privateKey, provider)
      const sponsorWalletBalance = await signer.getBalance();
      const sponsorAddress = await signer.getAddress();
      let sponsorBalance = 0;
      if (networkConfig.contracts.etherspotPaymasterAddress) {
        try {
          //get native balance of the sponsor in the EtherSpotPaymaster-contract
          const paymasterContract = new Contract(getAddress(networkConfig.contracts.etherspotPaymasterAddress), EtherspotAbi.default, provider);
          sponsorBalance = await paymasterContract.getDeposit();
        } catch (err) {
          request.log.error(err);
        }
      }
      const verifyingPaymaster = apiKeyEntity.verifyingPaymastersV2 ? JSON.parse(apiKeyEntity.verifyingPaymastersV2)[chainId] : undefined;
      let verifyingPaymasterDeposit = 0;
      if (verifyingPaymaster) {
        try {
          // VerifyingPaymaster address is stored in the DB as checksummed address so no need to checksum it
          const vpContract = new Contract(verifyingPaymaster, verifyingPaymasterV2Abi ,provider);
          verifyingPaymasterDeposit = await vpContract.getDeposit();
        } catch (err) {
          request.log.error(err);
        }
      }
      const chainsSupported: { chainId: number, entryPoint: string }[] = [];
      SupportedNetworks.map(element => {
        chainsSupported.push({ chainId: element.chainId, entryPoint: element.entryPoint });
      })
      const tokenPaymasterAddresses = {
        ...PAYMASTER_ADDRESS,
        ...customPaymasters,
      }
      return reply.code(ReturnCode.SUCCESS).send({
        sponsorAddress: sponsorAddress,
        sponsorWalletBalance: sponsorWalletBalance,
        sponsorBalance: verifyingPaymasterDeposit ?? sponsorBalance,
        chainsSupported: chainsSupported,
        tokenPaymasters: tokenPaymasterAddresses,
        multiTokenPaymasters,
        sponsorDetails: { name: sponsorName, icon: sponsorImage },
        verifyingPaymaster: { address: verifyingPaymaster, deposit: verifyingPaymasterDeposit },
        verifyingPaymasters: apiKeyEntity.verifyingPaymasters ? JSON.parse(apiKeyEntity.verifyingPaymasters) : undefined,
        verifyingPaymastersV2: apiKeyEntity.verifyingPaymastersV2 ? JSON.parse(apiKeyEntity.verifyingPaymastersV2) : undefined,
        verifyingPaymastersV3: apiKeyEntity.verifyingPaymastersV3 ? JSON.parse(apiKeyEntity.verifyingPaymastersV3) : undefined,
      })
    } catch (err: any) {
      request.log.error(err);
      if (err.name == "ResourceNotFoundException")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.get('/metadata/v3', async function (request, reply) {
    try {
      printRequest('/metadata/v3', request, server.log);
      const query: any = request.query;
      const chainId = query['chainId'] ?? 137;
      const api_key = query['apiKey'];
      if (!api_key || typeof(api_key) !== "string")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      if (!chainId)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA })
      let customPaymasters = [];
      let multiTokenPaymasters = [];
      let privateKey = '';
      let sponsorName = '', sponsorImage = '';
      let bundlerApiKey = api_key;
      const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
      if (!apiKeyEntity) {
        server.log.info("Invalid Api Key provided")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      }
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
        privateKey = secrets['PRIVATE_KEY'];
      } else {
        privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
      }
      if (apiKeyEntity.erc20Paymasters) {
        const buffer = Buffer.from(apiKeyEntity.erc20Paymasters, 'base64');
        customPaymasters = JSON.parse(buffer.toString());
      }
      if (apiKeyEntity.multiTokenPaymasters) {
        const buffer = Buffer.from(apiKeyEntity.multiTokenPaymasters, 'base64');
        multiTokenPaymasters = JSON.parse(buffer.toString());
      }
      if (apiKeyEntity.bundlerApiKey) {
        bundlerApiKey = apiKeyEntity.bundlerApiKey;
      }
      sponsorName = apiKeyEntity.sponsorName ? apiKeyEntity.sponsorName : "";
      sponsorImage = apiKeyEntity.logoUrl ? apiKeyEntity.logoUrl : "";
      const supportedNetworks = apiKeyEntity.supportedNetworks;
      if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_08);
      if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      let bundlerUrl = networkConfig.bundler;
      if (bundlerUrl.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
      const provider = new providers.JsonRpcProvider(bundlerUrl);
      const signer = new Wallet(privateKey, provider)
      const sponsorWalletBalance = await signer.getBalance();
      const sponsorAddress = await signer.getAddress();

      const verifyingPaymaster = apiKeyEntity.verifyingPaymastersV3 ? JSON.parse(apiKeyEntity.verifyingPaymastersV3)[chainId] : undefined;
      let verifyingPaymasterDeposit = 0;
      if (verifyingPaymaster) {
        try {
          const vpContract = new Contract(verifyingPaymaster, verifyingPaymastersV3Abi ,provider);
          verifyingPaymasterDeposit = await vpContract.getDeposit();
        } catch (err) {
          request.log.error(err);
        }
      }
      const chainsSupported: { chainId: number, entryPoint: string }[] = [];
      SupportedNetworks.map(element => {
        chainsSupported.push({ chainId: element.chainId, entryPoint: element.entryPoint });
      })
      const tokenPaymasterAddresses = {
        ...PAYMASTER_ADDRESS,
        ...customPaymasters,
      }
      return reply.code(ReturnCode.SUCCESS).send({
        sponsorAddress: sponsorAddress,
        sponsorWalletBalance: sponsorWalletBalance,
        sponsorBalance: verifyingPaymasterDeposit ?? 0,
        chainsSupported: chainsSupported,
        tokenPaymasters: tokenPaymasterAddresses,
        multiTokenPaymasters,
        sponsorDetails: { name: sponsorName, icon: sponsorImage },
        verifyingPaymaster: { address: verifyingPaymaster, deposit: verifyingPaymasterDeposit },
        verifyingPaymasters: apiKeyEntity.verifyingPaymasters ? JSON.parse(apiKeyEntity.verifyingPaymasters) : undefined,
        verifyingPaymastersV2: apiKeyEntity.verifyingPaymastersV2 ? JSON.parse(apiKeyEntity.verifyingPaymastersV2) : undefined,
        verifyingPaymastersV3: apiKeyEntity.verifyingPaymastersV3 ? JSON.parse(apiKeyEntity.verifyingPaymastersV3) : undefined,
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