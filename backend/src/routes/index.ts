/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { Wallet, ethers, providers } from "ethers";
import { gql, request as GLRequest } from "graphql-request";
import { Paymaster } from "../paymaster/index.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { TOKEN_ADDRESS } from "../constants/Pimlico.js";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { decode } from "../utils/crypto.js";
import { printRequest } from "../utils/common.js";

export function getNetworkConfig(key: any, supportedNetworks: any) {
  if (supportedNetworks !== '') {
    const buffer = Buffer.from(supportedNetworks, 'base64');
    const SUPPORTED_NETWORKS = JSON.parse(buffer.toString())
    return SUPPORTED_NETWORKS.find((chain: any) => { return chain["chainId"] == key });
  } else
    return SupportedNetworks.find((chain) => chain.chainId == key);
}

const routes: FastifyPluginAsync = async (server) => {
  const paymaster = new Paymaster();

  const prefixSecretId = 'arka_';

  let client: SecretsManagerClient;

  const unsafeMode = process.env.UNSAFE_MODE ?? false;

  if (!unsafeMode) {
    console.log('initialised aws secrets');
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

  server.get(
    "/healthcheck",
    async function (request, reply) {
      return reply.code(ReturnCode.SUCCESS).send('Arka Service Running...');
    }
  )

  server.post(
    "/",
    async function (request, reply) {
      try {
        printRequest(request, server.log);
        const query: any = request.query;
        const body: any = request.body;
        if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
        const userOp = body.params[0];
        const entryPoint = body.params[1];
        const context = body.params[2];
        const gasToken = context?.token ? context.token : null;
        const mode = context?.mode ? String(context.mode) : null;
        const chainId = query['chainId'] ?? body.params[3];
        const api_key = query['apiKey'] ?? body.params[4];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        let customPaymasters = [];
        let privateKey = '';
        let supportedNetworks;
        let noOfTxns;
        let txnMode;
        let indexerEndpoint;
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
          privateKey = secrets['PRIVATE_KEY'];
          supportedNetworks = secrets['SUPPORTED_NETWORKS'];
          noOfTxns = secrets['NO_OF_TRANSACTIONS_IN_A_MONTH'] ?? 10;
          txnMode = secrets['TRANSACTION_LIMIT'] ?? 0;
          indexerEndpoint = secrets['INDEXER_ENDPOINT'] ?? process.env.DEFAULT_INDEXER_ENDPOINT;
        } else {
          const record: any = await getSQLdata(api_key);
          if (!record) {
            server.log.info("Invalid Api Key provided")
            return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
          }
          if (record['ERC20_PAYMASTERS']) {
            const buffer = Buffer.from(record['ERC20_PAYMASTERS'], 'base64');
            customPaymasters = JSON.parse(buffer.toString());
          }
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
          !(TOKEN_ADDRESS[chainId] && TOKEN_ADDRESS[chainId][gasToken]) &&
          !(customPaymasters[chainId] && customPaymasters[chainId][gasToken])
        ) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK_TOKEN })
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let result;
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
            result = await paymaster.sign(userOp, str, str1, entryPoint, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, signer);
            break;
          }
          case 'erc20': {
            result = await paymaster.pimlico(userOp, gasToken, networkConfig.bundler, entryPoint, customPaymasters[chainId] ? customPaymasters[chainId][gasToken] : null);
            break;
          }
          case 'default': {
            return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_MODE });
          }
        }
        server.log.info(result, 'Response sent: ');
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
        printRequest(request, server.log);
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
          const record: any = await getSQLdata(api_key);
          console.log(record);
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
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let result;
        if (customPaymasters[chainId] && customPaymasters[chainId][gasToken]) result = { message: customPaymasters[chainId][gasToken] }
        else {
          if (!(TOKEN_ADDRESS[chainId] && TOKEN_ADDRESS[chainId][gasToken])) return reply.code(ReturnCode.FAILURE).send({ error: "Invalid network/token" })
          result = await paymaster.pimlicoAddress(gasToken, networkConfig.bundler, entryPoint);
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
        printRequest(request, server.log);
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
          const record: any = await getSQLdata(api_key);
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
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const validAddresses = address.every(ethers.utils.isAddress);
        if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: "Invalid Address passed" });
        const result = await paymaster.whitelistAddresses(address, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey);
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

  server.post(
    "/checkWhitelist",
    async function (request, reply) {
      try {
        printRequest(request, server.log);
        const body: any = request.body;
        const query: any = request.query;
        const accountAddress = body.params[0];
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
          const record: any = await getSQLdata(api_key);
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
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const response = await paymaster.checkWhitelistAddress(accountAddress, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey);
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
        printRequest(request, server.log);
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
          const record: any = await getSQLdata(api_key);
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
        const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        return await paymaster.deposit(amount, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
      }
    }
  )

  async function getSQLdata(apiKey: string) {
    try {
      const result: any[] = await new Promise((resolve, reject) => {
        server.sqlite.db.get("SELECT * FROM api_keys WHERE API_KEY = ?", [apiKey], (err: any, rows: any[]) => {
          if (err) reject(err);
          resolve(rows);
        })
      })
      return result;
    } catch (err) {
      server.log.error(err);
      return null;
    }
  }

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
