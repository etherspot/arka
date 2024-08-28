/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import { ethers, providers, Wallet } from "ethers";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Paymaster } from "../paymaster/index.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { decode } from "../utils/crypto.js";
import { printRequest, getNetworkConfig } from "../utils/common.js";
import { APIKey } from "../models/api-key.js";
import { ContractWhitelistDto } from "../types/contractWhitelist-dto.js";

const whitelistRoutes: FastifyPluginAsync = async (server) => {
  const paymaster = new Paymaster(server.config.FEE_MARKUP, server.config.MULTI_TOKEN_MARKUP, server.config.EP7_TOKEN_VGL, server.config.EP7_TOKEN_PGL);

  const SUPPORTED_ENTRYPOINTS = {
    EPV_06: server.config.EPV_06,
    EPV_07: server.config.EPV_07
  }

  const prefixSecretId = 'arka_';

  let client: SecretsManagerClient;

  const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;

  if (!unsafeMode) {
    client = new SecretsManagerClient();
  }

  server.post("/whitelist",
    async function (request, reply) {
      try {
        printRequest("/whitelist", request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const address = body.params[0];
        const chainId = query['chainId'] ?? body.params[1];
        const api_key = query['apiKey'] ?? body.params[2];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        let supportedNetworks;
        let bundlerApiKey = api_key;
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (secrets['BUNDLER_API_KEY']) {
            bundlerApiKey = secrets['BUNDLER_API_KEY'];
          }
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (apiKeyEntity.bundlerApiKey) {
            bundlerApiKey = apiKeyEntity.bundlerApiKey;
          }
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          supportedNetworks = apiKeyEntity.supportedNetworks;
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !Array.isArray(address) ||
          address.length > 10 ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_06);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let bundlerUrl = networkConfig.bundler;
        if (networkConfig.bundler.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
        const validAddresses = address.every(ethers.utils.isAddress);
        if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_ADDRESS_PASSSED });
        const result = await paymaster.whitelistAddresses(address, networkConfig.contracts.etherspotPaymasterAddress, bundlerUrl, privateKey, chainId, server.log);
        server.log.info(result, 'Response sent: ');
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  server.post("/removeWhitelist", async function (request, reply) {
    try {
      printRequest("/removeWhitelist", request, server.log);
      const body: any = request.body;
      const query: any = request.query;
      const address = body.params[0];
      const chainId = query['chainId'] ?? body.params[1];
      const api_key = query['apiKey'] ?? body.params[2];
      if (!api_key)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      let privateKey = '';
      let supportedNetworks;
      let bundlerApiKey = api_key;
      if (!unsafeMode) {
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (secrets['BUNDLER_API_KEY']) bundlerApiKey = secrets['BUNDLER_API_KEY'];
        privateKey = secrets['PRIVATE_KEY'];
        supportedNetworks = secrets['SUPPORTED_NETWORKS'];
      } else {
        const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
        if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (apiKeyEntity.bundlerApiKey) {
          bundlerApiKey = apiKeyEntity.bundlerApiKey;
        }
        privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
        supportedNetworks = apiKeyEntity.supportedNetworks;
      }
      if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      if (
        !Array.isArray(address) ||
        address.length > 10 ||
        !chainId ||
        isNaN(chainId)
      ) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      }
      if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_06);
      if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      let bundlerUrl = networkConfig.bundler;
      if (networkConfig.bundler.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
      const validAddresses = address.every(ethers.utils.isAddress);
      if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_ADDRESS_PASSSED });
      const result = await paymaster.removeWhitelistAddress(address, networkConfig.contracts.etherspotPaymasterAddress, bundlerUrl, privateKey, chainId, server.log);
      if (body.jsonrpc)
        return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      if (err.name == "ResourceNotFoundException")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
    }
  })

  server.post("/checkWhitelist",
    async function (request, reply) {
      try {
        printRequest("/checkWhitelist", request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const accountAddress = body.params[0];
        const chainId = query['chainId'] ?? body.params[1];
        const api_key = query['apiKey'] ?? body.params[2];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        let supportedNetworks;
        let bundlerApiKey = api_key;
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (secrets['BUNDLER_API_KEY']) bundlerApiKey = secrets['BUNDLER_API_KEY'];
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (apiKeyEntity.bundlerApiKey) bundlerApiKey = apiKeyEntity.bundlerApiKey;
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          supportedNetworks = apiKeyEntity.supportedNetworks;
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !accountAddress ||
          !ethers.utils.isAddress(accountAddress) ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_06);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let bundlerUrl = networkConfig.bundler;
        if (networkConfig.bundler.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
        const response = await paymaster.checkWhitelistAddress(accountAddress, networkConfig.contracts.etherspotPaymasterAddress, bundlerUrl, privateKey, server.log);
        server.log.info(response, 'Response sent: ');
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result: { message: response === true ? 'Already added' : 'Not added yet' }, error: null })
        return reply.code(ReturnCode.SUCCESS).send({ message: response === true ? 'Already added' : 'Not added yet' });
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  server.post("/removeWhitelist/v2",
    async function (request, reply) {
      try {
        printRequest("/removeWhitelist/v2", request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const address = body.params[0];
        const policyId = body.params[1];
        const chainId = query['chainId'] ?? body.params[2];
        const api_key = query['apiKey'] ?? body.params[3];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        let supportedNetworks;
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          supportedNetworks = apiKeyEntity.supportedNetworks;
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !Array.isArray(address) ||
          address.length > 10 ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const validAddresses = address.every(ethers.utils.isAddress);
        if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_ADDRESS_PASSSED });
        const existingWhitelistRecord = await server.whitelistRepository.findOneByApiKeyAndPolicyId(api_key, policyId);


        if (existingWhitelistRecord) {
          const toBeRemoved: string[] = [];
          address.filter(ele => {
            if (existingWhitelistRecord.addresses.includes(ele)) {
              toBeRemoved.push(ele);
              existingWhitelistRecord.addresses.splice(existingWhitelistRecord.addresses.indexOf(ele), 1);
            }
          });
          if (toBeRemoved.length < 1) return reply.code(ReturnCode.CONFLICT).send({ error: ErrorMessage.ADDRESS_NOT_WHITELISTED });

          if (existingWhitelistRecord.addresses.length < 1) await server.whitelistRepository.deleteById(existingWhitelistRecord.id);
          else await server.whitelistRepository.updateOneById(existingWhitelistRecord);
        } else {
          throw new Error(ErrorMessage.NO_WHITELIST_FOUND);
        }
        const result = { message: "Successfully removed whitelisted addresses" }
        server.log.info(result, 'Response sent: ');
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  server.post("/checkWhitelist/v2",
    async function (request, reply) {
      try {
        printRequest("/checkWhitelist/v2", request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const accountAddress = body.params[0];
        const policyId = body.params[1];
        const chainId = query['chainId'] ?? body.params[2];
        const api_key = query['apiKey'] ?? body.params[3];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        let supportedNetworks;
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          supportedNetworks = apiKeyEntity.supportedNetworks;
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !accountAddress ||
          !ethers.utils.isAddress(accountAddress) ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const existingWhitelistRecord = await server.whitelistRepository.findOneByApiKeyAndPolicyId(api_key, policyId);

        if (!existingWhitelistRecord) {
          throw new Error(ErrorMessage.NO_WHITELIST_FOUND);
        }
        const result = { message: existingWhitelistRecord.addresses.includes(accountAddress) ? 'Already added' : 'Not added yet' }
        server.log.info(result, 'Response sent: ');
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  server.post("/whitelist/v2",
    async function (request, reply) {
      try {
        printRequest("/whitelist/v2", request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const address = body.params[0];
        const policyId = body.params[1];
        const api_key = query['apiKey'] ?? body.params[2];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = secrets['PRIVATE_KEY'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !Array.isArray(address) ||
          address.length > 10
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const validAddresses = address.every(ethers.utils.isAddress);
        if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_ADDRESS_PASSSED });
        const signer = new Wallet(privateKey)
        if (policyId) {
          const policyRecord = await server.sponsorshipPolicyRepository.findOneById(policyId);
          if (!policyRecord || (policyRecord?.walletAddress !== signer.address)) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_SPONSORSHIP_POLICY_ID })
        }
        const existingWhitelistRecord = await server.whitelistRepository.findOneByApiKeyAndPolicyId(api_key, policyId);

        if (existingWhitelistRecord) {
          const toBeAdded: string[] = [];
          address.filter(ele => {
            if (!existingWhitelistRecord.addresses.includes(ele)) toBeAdded.push(ele);
          });
          if (toBeAdded.length < 1) return reply.code(ReturnCode.CONFLICT).send({ error: ErrorMessage.ADDRESS_ALREADY_ADDED });
          const allAddresses = toBeAdded.concat(existingWhitelistRecord.addresses);
          existingWhitelistRecord.addresses = allAddresses;
          await server.whitelistRepository.updateOneById(existingWhitelistRecord);
        } else {
          const addWhitelistDto = {
            apiKey: api_key,
            addresses: address,
            policyId: policyId ?? null,
          }
          await server.whitelistRepository.create(addWhitelistDto);

        }
        const result = { message: "Successfully whitelisted" }
        server.log.info(result, 'Response sent: ');
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  server.post("/getAllWhitelist/v2",
    async function (request, reply) {
      try {
        printRequest("/getAllWhitelist/v2", request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const policyId = body.params[0];
        const chainId = query['chainId'] ?? body.params[1];
        const api_key = query['apiKey'] ?? body.params[2];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        let supportedNetworks;
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          supportedNetworks = apiKeyEntity.supportedNetworks;
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const existingWhitelistRecord = await server.whitelistRepository.findOneByApiKeyAndPolicyId(api_key, policyId);

        if (!existingWhitelistRecord) {
          throw new Error(ErrorMessage.NO_WHITELIST_FOUND);
        }
        const result = { addresses: existingWhitelistRecord.addresses }
        server.log.info(result, 'Response sent: ');
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  server.post("/whitelistContractAddress",
    async function (request, reply) {
      try {
        printRequest("/whitelistContractAddress", request, server.log);
        const contractWhitelistDto: ContractWhitelistDto = JSON.parse(JSON.stringify(request.body)) as ContractWhitelistDto;
        const query: any = request.query;

        const chainId = query['chainId'];
        const api_key = query['apiKey'];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        let supportedNetworks;
        let bundlerApiKey = api_key;
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (secrets['BUNDLER_API_KEY']) bundlerApiKey = secrets['BUNDLER_API_KEY'];
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (apiKeyEntity.bundlerApiKey) bundlerApiKey = apiKeyEntity.bundlerApiKey;
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          supportedNetworks = apiKeyEntity.supportedNetworks;
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        if (networkConfig.bundler.includes('etherspot.io')) networkConfig.bundler = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
        const provider = new providers.JsonRpcProvider(networkConfig.bundler);
        const signer = new Wallet(privateKey, provider)

        const existingRecord = await server.contractWhitelistRepository.findOneByChainIdContractAddressAndWalletAddress(chainId, signer.address, contractWhitelistDto.contractAddress);
        if (existingRecord) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.RECORD_ALREADY_EXISTS_CONTRACT_WHITELIST })

        contractWhitelistDto.chainId = Number(chainId);
        contractWhitelistDto.walletAddress = signer.address;

        const result = await server.contractWhitelistRepository.create(contractWhitelistDto);
        if (!result) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.FAILED_TO_CREATE_CONTRACT_WHITELIST });
        }

        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_CREATE_CONTRACT_WHITELIST });
      }
    }
  )

  server.post("/updateWhitelistContractAddress",
    async function (request, reply) {
      try {
        printRequest("/updateWhitelistContractAddress", request, server.log);
        const contractWhitelistDto: ContractWhitelistDto = JSON.parse(JSON.stringify(request.body)) as ContractWhitelistDto;
        const query: any = request.query;
        const chainId = query['chainId'];
        const api_key = query['apiKey'];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        let supportedNetworks;
        let bundlerApiKey = api_key;
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (secrets['BUNDLER_API_KEY']) bundlerApiKey = secrets['BUNDLER_API_KEY'];
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (apiKeyEntity.bundlerApiKey) bundlerApiKey = apiKeyEntity.bundlerApiKey;
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          supportedNetworks = apiKeyEntity.supportedNetworks;
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let bundlerUrl = networkConfig.bundler;
        if (networkConfig.bundler.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
        const provider = new providers.JsonRpcProvider(bundlerUrl);
        const signer = new Wallet(privateKey, provider)

        const existingRecord = await server.contractWhitelistRepository.findOneByChainIdContractAddressAndWalletAddress(chainId, signer.address, contractWhitelistDto.contractAddress);
        if (!existingRecord) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.NO_CONTRACT_WHITELIST_FOUND })

        existingRecord.contractAddress = contractWhitelistDto.contractAddress;
        existingRecord.functionSelectors = contractWhitelistDto.functionSelectors;
        existingRecord.abi = contractWhitelistDto.abi;

        const result = await server.contractWhitelistRepository.updateOneById(existingRecord);
        if (!result) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.FAILED_TO_UPDATE_CONTRACT_WHITELIST });
        }

        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_UPDATE_CONTRACT_WHITELIST });
      }
    }
  )


  server.post("/deleteContractWhitelist",
    async function (request, reply) {
      try {
        printRequest("/deleteContractWhitelist", request, server.log);
        const contractWhitelistDto: ContractWhitelistDto = JSON.parse(JSON.stringify(request.body)) as ContractWhitelistDto;
        const query: any = request.query;
        const chainId = query['chainId'];
        const api_key = query['apiKey'];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let privateKey = '';
        let supportedNetworks;
        let bundlerApiKey = api_key;
        if (!unsafeMode) {
          const AWSresponse = await client.send(
            new GetSecretValueCommand({
              SecretId: prefixSecretId + api_key,
            })
          );
          const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
          if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (secrets['BUNDLER_API_KEY']) {
            bundlerApiKey = secrets['BUNDLER_API_KEY'];
          }
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
          if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (apiKeyEntity.bundlerApiKey) {
            bundlerApiKey = apiKeyEntity.bundlerApiKey;
          }
          privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
          supportedNetworks = apiKeyEntity.supportedNetworks;
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let bundlerUrl = networkConfig.bundler;
        if (networkConfig.bundler.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
        const provider = new providers.JsonRpcProvider(bundlerUrl);
        const signer = new Wallet(privateKey, provider)

        const existingRecord = await server.contractWhitelistRepository.findOneByChainIdContractAddressAndWalletAddress(chainId, signer.address, contractWhitelistDto.contractAddress);
        if (!existingRecord) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.NO_CONTRACT_WHITELIST_FOUND })

        const result = await server.contractWhitelistRepository.deleteById(existingRecord.id);
        if (!result) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.FAILED_TO_DELETE_CONTRACT_WHITELIST });
        }

        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_DELETE_CONTRACT_WHITELIST });
      }
    }
  )

};

export default whitelistRoutes;
