/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { BigNumber, Wallet, ethers, providers } from "ethers";
import { gql, request as GLRequest } from "graphql-request";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Paymaster } from "../paymaster/index.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { PAYMASTER_ADDRESS } from "../constants/Pimlico.js";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { decode } from "../utils/crypto.js";
import { printRequest, getNetworkConfig, getSQLdata } from "../utils/common.js";

const SUPPORTED_ENTRYPOINTS = {
  'EPV_06' : "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  'EPV_07' : "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
}

const routes: FastifyPluginAsync = async (server) => {
  const paymaster = new Paymaster(server.config.FEE_MARKUP, server.config.MULTI_TOKEN_MARKUP);

  const prefixSecretId = 'arka_';

  let client: SecretsManagerClient;

  const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;

  if (!unsafeMode) {
    client = new SecretsManagerClient();
  }

  const whitelistResponseSchema = {
    schema: {
      response: {
        200: Type.Object({
          message: Type.String(),
        }),
        400: Type.Object({
          error: Type.String(),
        }),
      }
    }
  }

  server.post(
    "/",
    async function (request, reply) {
      try {
        printRequest("/", request, server.log);
        const query: any = request.query;
        const body: any = request.body;
        if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
        const userOp = body.params[0];
        const entryPoint = body.params[1];
        let context = body.params[2];
        let gasToken = context?.token ? context.token : null;
        let mode = context?.mode ? String(context.mode) : "sponsor";
        let chainId = query['chainId'] ?? body.params[3];
        const api_key = query['apiKey'] ?? body.params[4];
        let sponsorDetails = false, estimate = true;
        if (body.method) {
          switch(body.method) {
            case 'pm_getPaymasterData': {
              estimate = false;
              sponsorDetails = true;
            }
            case 'pm_getPaymasterStubData': {
              chainId = BigNumber.from(body.params[2]).toNumber();
              context = body.params[3];
              gasToken = context?.token ? context.token : null;
              mode = context?.mode ? String(context.mode) : "sponsor";
              break;
            };
            case 'pm_sponsorUserOperation': {
              break;
            };
            default: {
              return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_METHOD });
              break;
            }
          }
        }
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        console.log('entryPoint: ', entryPoint);
        if ((entryPoint != SUPPORTED_ENTRYPOINTS.EPV_06) && (entryPoint != SUPPORTED_ENTRYPOINTS.EPV_07))
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_ENTRYPOINT })
        let customPaymasters = [];
        let multiTokenPaymasters = [];
        let multiTokenOracles = [];
        let privateKey = '';
        let supportedNetworks;
        let noOfTxns;
        let txnMode;
        let indexerEndpoint;
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
          if (secrets['MULTI_TOKEN_ORACLES']) {
            const buffer = Buffer.from(secrets['MULTI_TOKEN_ORACLES'], 'base64');
            multiTokenOracles = JSON.parse(buffer.toString());
          }
          sponsorName = secrets['SPONSOR_NAME'];
          sponsorImage = secrets['LOGO_URL'];
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
          noOfTxns = secrets['NO_OF_TRANSACTIONS_IN_A_MONTH'] ?? 10;
          txnMode = secrets['TRANSACTION_LIMIT'] ?? 0;
          indexerEndpoint = secrets['INDEXER_ENDPOINT'] ?? process.env.DEFAULT_INDEXER_ENDPOINT;
        } else {
          const record: any = await getSQLdata(api_key, server.sqlite.db, server.log);
          if (!record) {
            server.log.info("Invalid Api Key provided")
            return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          }
          if (record['ERC20_PAYMASTERS']) {
            const buffer = Buffer.from(record['ERC20_PAYMASTERS'], 'base64');
            customPaymasters = JSON.parse(buffer.toString());
          }
          if (record['MULTI_TOKEN_PAYMASTERS']) {
            const buffer = Buffer.from(record['MULTI_TOKEN_PAYMASTERS'], 'base64');
            multiTokenPaymasters = JSON.parse(buffer.toString()); 
          }
          if (record['MULTI_TOKEN_ORACLES']) {
            const buffer = Buffer.from(record['MULTI_TOKEN_ORACLES'], 'base64');
            multiTokenOracles = JSON.parse(buffer.toString());
          }
          sponsorName = record['SPONSOR_NAME'];
          sponsorImage = record['LOGO_URL'];
          privateKey = decode(record['PRIVATE_KEY']);
          supportedNetworks = record['SUPPORTED_NETWORKS'];
          noOfTxns = record['NO_OF_TRANSACTIONS_IN_A_MONTH'];
          txnMode = record['TRANSACTION_LIMIT'];
          indexerEndpoint = record['INDEXER_ENDPOINT'] ?? process.env.DEFAULT_INDEXER_ENDPOINT;
        }

        if (
          !userOp ||
          !entryPoint ||
          !chainId ||
          !mode ||
          isNaN(chainId)
        ) {
          server.log.info("Incomplete body data provided")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }

        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }

        if (
          mode.toLowerCase() == 'erc20' &&
          !(PAYMASTER_ADDRESS[chainId] && PAYMASTER_ADDRESS[chainId][gasToken]) &&
          !(customPaymasters[chainId] && customPaymasters[chainId][gasToken])
        ) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK_TOKEN })

        if (gasToken && ethers.utils.isAddress(gasToken)) gasToken = ethers.utils.getAddress(gasToken)

        if (mode.toLowerCase() == 'multitoken' &&
          !(multiTokenPaymasters[chainId] && multiTokenPaymasters[chainId][gasToken]) &&
          !(multiTokenOracles[chainId] && multiTokenOracles[chainId][gasToken])
        ) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK_TOKEN })

        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', entryPoint);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });

        let result: any;
        switch (mode.toLowerCase()) {
          case 'sponsor': {
            const date = new Date();
            const provider = new providers.JsonRpcProvider(networkConfig.bundler);
            const signer = new Wallet(privateKey, provider)
            if (txnMode) {
              const signerAddress = await signer.getAddress();
              const IndexerData = await getIndexerData(signerAddress, userOp.sender, date.getMonth(), date.getFullYear(), noOfTxns, indexerEndpoint);
              if (IndexerData.length >= noOfTxns) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.QUOTA_EXCEEDED })
            }
            const validUntil = context?.validUntil ? new Date(context.validUntil) : date;
            const validAfter = context?.validAfter ? new Date(context.validAfter) : date;
            const hex = (Number((validUntil.valueOf() / 1000).toFixed(0)) + 600).toString(16);
            const hex1 = (Number((validAfter.valueOf() / 1000).toFixed(0)) - 60).toString(16);
            let str = '0x'
            let str1 = '0x'
            for (let i = 0; i < 14 - hex.length; i++) {
              str += '0';
            }
            for (let i = 0; i < 14 - hex1.length; i++) {
              str1 += '0';
            }
            str += hex;
            str1 += hex1;
            if (entryPoint == SUPPORTED_ENTRYPOINTS.EPV_06)
              result = await paymaster.signV06(userOp, str, str1, entryPoint, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, signer, estimate, server.log);
            else result = await paymaster.signV07(userOp, str, str1, entryPoint, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, signer, estimate, server.log);
            break;
          }
          case 'erc20': {
            if (entryPoint !== SUPPORTED_ENTRYPOINTS.EPV_06) 
              throw new Error('Currently only 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 entryPoint address is supported')
            let paymasterAddress: string;
            if (customPaymasters[chainId] && customPaymasters[chainId][gasToken]) paymasterAddress = customPaymasters[chainId][gasToken];
            else paymasterAddress = PAYMASTER_ADDRESS[chainId][gasToken]
            result = await paymaster.pimlico(userOp, networkConfig.bundler, entryPoint, paymasterAddress, server.log);
            break;
          }
          case 'multitoken': {
            if (entryPoint !== SUPPORTED_ENTRYPOINTS.EPV_06) 
              throw new Error('Currently only 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789 entryPoint address is supported')
            const date = new Date();
            const provider = new providers.JsonRpcProvider(networkConfig.bundler);
            const signer = new Wallet(privateKey, provider)
            const validUntil = context.validUntil ? new Date(context.validUntil) : date;
            const validAfter = context.validAfter ? new Date(context.validAfter) : date;
            const hex = (Number((validUntil.valueOf() / 1000).toFixed(0)) + 600).toString(16);
            const hex1 = (Number((validAfter.valueOf() / 1000).toFixed(0)) - 60).toString(16);
            let str = '0x'
            let str1 = '0x'
            for (let i = 0; i < 14 - hex.length; i++) {
              str += '0';
            }
            for (let i = 0; i < 14 - hex1.length; i++) {
              str1 += '0';
            }
            str += hex;
            str1 += hex1;
            if (!networkConfig.MultiTokenPaymasterOracleUsed || 
              !(networkConfig.MultiTokenPaymasterOracleUsed == "orochi" || networkConfig.MultiTokenPaymasterOracleUsed == "chainlink")) 
              throw new Error("Oracle is not Defined/Invalid");
            result = await paymaster.signMultiTokenPaymaster(userOp, str, str1, entryPoint, multiTokenPaymasters[chainId][gasToken], gasToken, multiTokenOracles[chainId][gasToken], networkConfig.bundler, signer, networkConfig.MultiTokenPaymasterOracleUsed, server.log);
            break;
          }
          default : {
            return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_MODE });
          }
        }
        server.log.info(result, 'Response sent: ');
        if (sponsorDetails) result.sponsor = { name: sponsorName, icon: sponsorImage };
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
      }
    }
  );

  server.post(
    "/pimlicoAddress",
    whitelistResponseSchema,
    async function (request, reply) {
      try {
        printRequest("/pimlicoAddress", request, server.log);
        const query: any = request.query;
        const body: any = request.body;
        const entryPoint = body.params[0];
        const context = body.params[1];
        const gasToken = context ? context.token : null;
        const chainId = query['chainId'] ?? body.params[2];
        const api_key = query['apiKey'] ?? body.params[3];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let customPaymasters = [];
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
          if (secrets['ERC20_PAYMASTERS']) {
            const buffer = Buffer.from(secrets['ERC20_PAYMASTERS'], 'base64');
            customPaymasters = JSON.parse(buffer.toString());
          }
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
        } else {
          const record: any = await getSQLdata(api_key, server.sqlite.db, server.log);
          if (!record) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          if (record['ERC20_PAYMASTERS']) {
            const buffer = Buffer.from(record['ERC20_PAYMASTERS'], 'base64');
            customPaymasters = JSON.parse(buffer.toString());
          }
          privateKey = decode(record['PRIVATE_KEY']);
          supportedNetworks = record['SUPPORTED_NETWORKS'];
        }
        if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !entryPoint ||
          !gasToken ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', entryPoint);
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let result;
        if (customPaymasters[chainId] && customPaymasters[chainId][gasToken]) result = { message: customPaymasters[chainId][gasToken] }
        else {
          if (!(PAYMASTER_ADDRESS[chainId] && PAYMASTER_ADDRESS[chainId][gasToken])) return reply.code(ReturnCode.FAILURE).send({ error: "Invalid network/token" })
          result = { message: PAYMASTER_ADDRESS[chainId][gasToken] }
        }
        server.log.info(result, 'Response sent: ');
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, message: result.message, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
      }
    }
  )

  server.post(
    "/whitelist",
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
          const record: any = await getSQLdata(api_key, server.sqlite.db, server.log);
          if (!record) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(record['PRIVATE_KEY']);
          supportedNetworks = record['SUPPORTED_NETWORKS'];
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
        const validAddresses = address.every(ethers.utils.isAddress);
        if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: "Invalid Address passed" });
        const result = await paymaster.whitelistAddresses(address, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey, chainId, server.log);
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
          const record: any = await getSQLdata(api_key, server.sqlite.db, server.log);
          if (!record) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(record['PRIVATE_KEY']);
          supportedNetworks = record['SUPPORTED_NETWORKS'];
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
        const validAddresses = address.every(ethers.utils.isAddress);
        if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: "Invalid Address passed" });
        const result = await paymaster.removeWhitelistAddress(address, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey, chainId, server.log);
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

  server.post(
    "/checkWhitelist",
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
          const record: any = await getSQLdata(api_key, server.sqlite.db, server.log);
          if (!record) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(record['PRIVATE_KEY']);
          supportedNetworks = record['SUPPORTED_NETWORKS'];
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
        const response = await paymaster.checkWhitelistAddress(accountAddress, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey, server.log);
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

  server.post(
    "/deposit",
    whitelistResponseSchema,
    async function (request, reply) {
      try {
        printRequest("/deposit", request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const amount = body.params[0];
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
          const record: any = await getSQLdata(api_key, server.sqlite.db, server.log);
          if (!record) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(record['PRIVATE_KEY']);
          supportedNetworks = record['SUPPORTED_NETWORKS'];
        }
        if (
          isNaN(amount) ||
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
        return await paymaster.deposit(amount, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey, chainId, server.log);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  server.post(
    "/deposit/v2",
    whitelistResponseSchema,
    async function (request, reply) {
      try {
        printRequest("/deposit/v2", request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const amount = body.params[0];
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
          const record: any = await getSQLdata(api_key, server.sqlite.db, server.log);
          if (!record) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          privateKey = decode(record['PRIVATE_KEY']);
          supportedNetworks = record['SUPPORTED_NETWORKS'];
        }
        if (
          isNaN(amount) ||
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
        return await paymaster.deposit(amount, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey, chainId, server.log);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  async function getIndexerData(sponsor: string, sender: string, month: number, year: number, noOfTxns: number, endpoint: string): Promise<any[]> {
    try {
      const query = gql`
        query {
          paymasterEvents(
            limit: ${noOfTxns}
            where: {month: ${month}, year: ${year}, paymaster: "${sponsor}", sender: "${sender}"}) 
          {
            items {
              sender
              paymaster
              transactionHash
              year
              month
            }
          }
        }`;
      const apiResponse: any = await GLRequest(endpoint, query);
      return apiResponse.paymasterEvents.items;
    } catch (err) {
      server.log.error(err);
      return [];
    }
  }
};

export default routes;
