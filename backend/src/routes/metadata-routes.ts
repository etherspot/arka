/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { FastifyPluginAsync } from "fastify";
import { createPublicClient, http, getContract, getAddress, Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import SupportedNetworks from "../../config.json";
import { getNetworkConfig, printRequest, getViemChainDef } from "../utils/common.js";
import ReturnCode from "../constants/ReturnCode.js";
import ErrorMessage from "../constants/ErrorMessage.js";
import { decode } from "../utils/crypto.js";
import { APIKey } from "../models/api-key.js";
import * as EtherspotAbi from "../abi/EtherspotAbi.js";
import {abi as verifyingPaymasterAbi} from "../abi/VerifyingPaymasterAbi.js";
import {abi as verifyingPaymasterV2Abi} from "../abi/VerifyingPaymasterAbiV2.js";
import {abi as verifyingPaymastersV3Abi} from "../abi/VerifyingPaymasterAbiV3.js";

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
      const viemChain = getViemChainDef(chainId);
      const publicClient = createPublicClient({ chain: viemChain, transport: http(bundlerUrl) });
      const signer = privateKeyToAccount(privateKey as `0x${string}`);
      const sponsorWalletBalance = await publicClient.getBalance({ address: signer.address });
      const sponsorAddress = signer.address;
      let sponsorBalance = '0';

      if (networkConfig.contracts.etherspotPaymasterAddress) {
        try {
          //get native balance of the sponsor in the EtherSpotPaymaster-contract
          const paymasterContract = getContract({ address: getAddress(networkConfig.contracts.etherspotPaymasterAddress), abi: EtherspotAbi.default, client: publicClient });
          sponsorBalance = (await paymasterContract.read.getDeposit()).toString();
        } catch (err) {
          request.log.error(err);
        }
      }

      const verifyingPaymaster = apiKeyEntity.verifyingPaymasters ? JSON.parse(apiKeyEntity.verifyingPaymasters)[chainId] : undefined;
      let verifyingPaymasterDeposit;
      if (verifyingPaymaster) {
        try {
          // VerifyingPaymaster address is stored in the DB as checksummed address so no need to checksum it
          const vpContract = getContract({ address: verifyingPaymaster as Address, abi: verifyingPaymasterAbi, client: publicClient });
          verifyingPaymasterDeposit = await vpContract.read.getDeposit();
          if (verifyingPaymasterDeposit || (typeof(verifyingPaymasterDeposit) === 'bigint')) 
            verifyingPaymasterDeposit = verifyingPaymasterDeposit.toString();
        } catch (err) {
          request.log.error(err);
        }
      }
      const chainsSupported: { chainId: number, entryPoint: string }[] = [];
      SupportedNetworks.map(element => {
        chainsSupported.push({ chainId: element.chainId, entryPoint: element.entryPoint });
      })
      return reply.code(ReturnCode.SUCCESS).send({
        sponsorAddress: sponsorAddress,
        sponsorWalletBalance: sponsorWalletBalance.toString(),
        sponsorBalance: sponsorBalance,
        chainsSupported: chainsSupported,
        multiTokenPaymasters,
        sponsorDetails: { name: sponsorName, icon: sponsorImage },
        verifyingPaymaster: { address: verifyingPaymaster, deposit: verifyingPaymasterDeposit ?? 0 },
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
      const viemChain = getViemChainDef(chainId);
      const publicClient = createPublicClient({ chain: viemChain, transport: http(bundlerUrl) });
      const signer = privateKeyToAccount(privateKey as `0x${string}`);
      const sponsorWalletBalance = await publicClient.getBalance({ address: signer.address });
      const sponsorAddress = signer.address;
      let sponsorBalance;
      if (networkConfig.contracts.etherspotPaymasterAddress) {
        try {
          //get native balance of the sponsor in the EtherSpotPaymaster-contract
          const paymasterContract = getContract({ address: getAddress(networkConfig.contracts.etherspotPaymasterAddress), abi: EtherspotAbi.default, client: publicClient });
          sponsorBalance = (await paymasterContract.read.getDeposit()).toString();
        } catch (err) {
          request.log.error(err);
        }
      }
      const verifyingPaymaster = apiKeyEntity.verifyingPaymastersV2 ? JSON.parse(apiKeyEntity.verifyingPaymastersV2)[chainId] : undefined;
      let verifyingPaymasterDeposit;
      if (verifyingPaymaster) {
        try {
          // VerifyingPaymaster address is stored in the DB as checksummed address so no need to checksum it
          const vpContract = getContract({ address: verifyingPaymaster as `0x${string}`, abi: verifyingPaymasterV2Abi, client: publicClient });
          verifyingPaymasterDeposit = await vpContract.read.getDeposit();
          if (verifyingPaymasterDeposit || (typeof(verifyingPaymasterDeposit) === 'bigint')) 
            verifyingPaymasterDeposit = verifyingPaymasterDeposit.toString();
        } catch (err) {
          request.log.error(err);
        }
      }
      const chainsSupported: { chainId: number, entryPoint: string }[] = [];
      SupportedNetworks.map(element => {
        chainsSupported.push({ chainId: element.chainId, entryPoint: element.entryPoint });
      })
      return reply.code(ReturnCode.SUCCESS).send({
        sponsorAddress: sponsorAddress,
        sponsorWalletBalance: sponsorWalletBalance.toString(),
        sponsorBalance: verifyingPaymasterDeposit ?? sponsorBalance,
        chainsSupported: chainsSupported,
        multiTokenPaymasters,
        sponsorDetails: { name: sponsorName, icon: sponsorImage },
        verifyingPaymaster: { address: verifyingPaymaster, deposit: verifyingPaymasterDeposit ?? 0 },
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
      const viemChain = getViemChainDef(chainId);
      const publicClient = createPublicClient({ chain: viemChain, transport: http(bundlerUrl) });
      const signer = privateKeyToAccount(privateKey as `0x${string}`);
      const sponsorWalletBalance = await publicClient.getBalance({ address: signer.address });
      const sponsorAddress = signer.address;

      const verifyingPaymaster = apiKeyEntity.verifyingPaymastersV3 ? JSON.parse(apiKeyEntity.verifyingPaymastersV3)[chainId] : undefined;
      let verifyingPaymasterDeposit;
      if (verifyingPaymaster) {
        try {
          const vpContract = getContract({ address: verifyingPaymaster as `0x${string}`, abi: verifyingPaymastersV3Abi, client: publicClient });
          verifyingPaymasterDeposit = await vpContract.read.getDeposit();
          if (verifyingPaymasterDeposit || (typeof(verifyingPaymasterDeposit) === 'bigint')) 
            verifyingPaymasterDeposit = verifyingPaymasterDeposit.toString();
        } catch (err) {
          request.log.error(err);
        }
      }
      const chainsSupported: { chainId: number, entryPoint: string }[] = [];
      SupportedNetworks.map(element => {
        chainsSupported.push({ chainId: element.chainId, entryPoint: element.entryPoint });
      })
      return reply.code(ReturnCode.SUCCESS).send({
        sponsorAddress: sponsorAddress,
        sponsorWalletBalance: sponsorWalletBalance.toString(),
        sponsorBalance: verifyingPaymasterDeposit ?? 0,
        chainsSupported: chainsSupported,
        multiTokenPaymasters,
        sponsorDetails: { name: sponsorName, icon: sponsorImage },
        verifyingPaymaster: { address: verifyingPaymaster, deposit: verifyingPaymasterDeposit ?? 0 },
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