/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { ethers, providers } from "ethers";
import fetch from 'node-fetch';
import pino from 'pino';
import { Paymaster } from "../paymaster/index.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { TOKEN_ADDRESS } from "../constants/Pimlico.js";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import PimlicoAbi from "../abi/PimlicoAbi.js";
import PythOracleAbi from "../abi/PythOracleAbi.js";

const logger = pino({
  transport: {
    target: 'pino-pretty'
  },
})

function getNetworkConfig(key: any, supportedNetworks: any) {
  if (supportedNetworks !== '') {
    const buffer = Buffer.from(supportedNetworks, 'base64');
    const SUPPORTED_NETWORKS = JSON.parse(buffer.toString())
    return SUPPORTED_NETWORKS.find((chain: any) => { return chain["chainId"] == key });
  } else
    return SupportedNetworks.find((chain) => chain.chainId == key);
}

const routes: FastifyPluginAsync = async (server) => {
  const paymaster = new Paymaster(
    server.config.STACKUP_API_KEY,
  );

  const prefixSecretId = 'arka_';

  const client = new SecretsManagerClient();

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
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !userOp ||
          !entryPoint ||
          !chainId ||
          !mode ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        let customPaymasters = [];
        if (secrets['ERC20_PAYMASTERS']) {
          const buffer = Buffer.from(secrets['ERC20_PAYMASTERS'], 'base64');
          customPaymasters = JSON.parse(buffer.toString());
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        if (
          mode.toLowerCase() == 'erc20' &&
          !(TOKEN_ADDRESS[chainId] && TOKEN_ADDRESS[chainId][gasToken]) &&
          !(customPaymasters[chainId] && customPaymasters[chainId][gasToken])
        ) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK_TOKEN })
        const networkConfig = getNetworkConfig(chainId, secrets['SUPPORTED_NETWORKS'] ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let result;
        switch (mode.toLowerCase()) {
          case 'sponsor': {
            const date = new Date();
            const validUntil = context.validUntil ? new Date(context.validUntil) : date;
            const validAfter = context.validAfter ? new Date(context.validAfter) : date;
            const hex = (Number((validUntil.valueOf() / 1000).toFixed(0)) + 600).toString(16);
            const hex1 = (Number((validAfter.valueOf() / 1000).toFixed(0))).toString(16);
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
            result = await paymaster.sign(userOp, str, str1, entryPoint, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, secrets['PRIVATE_KEY']);
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
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
      }
    }
  );

  server.post(
    "/pimlicoAddress",
    whitelistResponseSchema,
    async function (request, reply) {
      try {
        const query: any = request.query;
        const body: any = request.body;
        const entryPoint = body.params[0];
        const context = body.params[1];
        const gasToken = context ? context.token : null;
        const chainId = query['chainId'] ?? body.params[2];
        const api_key = query['apiKey'] ?? body.params[3];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
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
        const networkConfig = getNetworkConfig(chainId, secrets['SUPPORTED_NETWORKS'] ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        let customPaymasters = [];
        if (secrets['ERC20_PAYMASTERS']) {
          const buffer = Buffer.from(secrets['ERC20_PAYMASTERS'], 'base64');
          customPaymasters = JSON.parse(buffer.toString());
        }
        let result;
        if (customPaymasters[chainId] && customPaymasters[chainId][gasToken]) result = { message: customPaymasters[chainId][gasToken] }
        else {
          if (!(TOKEN_ADDRESS[chainId] && TOKEN_ADDRESS[chainId][gasToken])) return reply.code(ReturnCode.FAILURE).send({ error: "Invalid network/token" })
          result = await paymaster.pimlicoAddress(gasToken, networkConfig.bundler, entryPoint);
        }
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, message: result.message, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
      }
    }
  )

  server.post(
    "/stackup",
    async function (request, reply) {
      try {
        const body: any = request.body;
        const query: any = request.query;
        const userOp = body.params[0];
        const entryPoint = body.params[1];
        const context = body.params[2];
        const gasToken = context ? context.token : null;
        const api_key = query['apiKey'] ?? body.params[3];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !userOp ||
          !entryPoint ||
          !gasToken
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        const result = await paymaster.stackup(userOp, "erc20token", gasToken, entryPoint);
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.INVALID_DATA });
      }
    }
  );

  server.post(
    "/whitelist",
    async function (request, reply) {
      try {
        const body: any = request.body;
        const query: any = request.query;
        const address = body.params[0];
        const chainId = query['chainId'] ?? body.params[1];
        const api_key = query['apiKey'] ?? body.params[2];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
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
        const networkConfig = getNetworkConfig(chainId, secrets['SUPPORTED_NETWORKS'] ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const validAddresses = await address.every(ethers.utils.isAddress);
        if (!validAddresses) return reply.code(ReturnCode.FAILURE).send({ error: "Invalid Address passed" });
        const result = await paymaster.whitelistAddresses(address, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, secrets['PRIVATE_KEY']);
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(ReturnCode.SUCCESS).send(result);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG })
      }
    }
  )

  server.post(
    "/checkWhitelist",
    async function (request, reply) {
      try {
        const body: any = request.body;
        const query: any = request.query;
        const sponsorAddress = body.params[0];
        const accountAddress = body.params[1];
        const chainId = query['chainId'] ?? body.params[2];
        const api_key = query['apiKey'] ?? body.params[3];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !sponsorAddress ||
          !accountAddress ||
          !ethers.utils.isAddress(sponsorAddress) ||
          !ethers.utils.isAddress(accountAddress) ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId, secrets['SUPPORTED_NETWORKS'] ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const response = await paymaster.checkWhitelistAddress(sponsorAddress, accountAddress, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler);
        if (body.jsonrpc)
          return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, result: { message: response === true ? 'Already added' : 'Not added yet' }, error: null })
        return reply.code(ReturnCode.SUCCESS).send({ message: response === true ? 'Already added' : 'Not added yet' });
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG })
      }
    }
  )

  server.post(
    "/deposit",
    whitelistResponseSchema,
    async function (request, reply) {
      try {
        const body: any = request.body;
        const query: any = request.query;
        const amount = body.params[0];
        const chainId = query['chainId'] ?? body.params[1];
        const api_key = query['apiKey'] ?? body.params[2];
        if (!api_key)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
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
        const networkConfig = getNetworkConfig(chainId, secrets['SUPPORTED_NETWORKS'] ?? '');
        if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        return await paymaster.deposit(amount, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, secrets['PRIVATE_KEY']);
      } catch (err: any) {
        request.log.error(err);
        if (err.name == "ResourceNotFoundException")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG })
      }
    }
  )
};

export async function cronJob() {
  const paymastersAdrbase64 = process.env.DEPLOYED_ERC20_PAYMASTERS ?? ''
  if (paymastersAdrbase64) {
    const buffer = Buffer.from(paymastersAdrbase64, 'base64');
    const DEPLOYED_ERC20_PAYMASTERS = JSON.parse(buffer.toString());
    Object.keys(DEPLOYED_ERC20_PAYMASTERS).forEach(async (chain) => {
      const networkConfig = getNetworkConfig(chain, '');
      if (networkConfig) {
        const deployedPaymasters: string[] = DEPLOYED_ERC20_PAYMASTERS[chain];
        const provider = new providers.JsonRpcProvider(networkConfig.bundler);
        const signer = new ethers.Wallet(process.env.CRON_PRIVATE_KEY ?? '', provider);
        deployedPaymasters.forEach(async (deployedPaymaster) => {
          const paymasterContract = new ethers.Contract(deployedPaymaster, PimlicoAbi, signer)
          const pythMainnetChains = process.env.PYTH_MAINNET_CHAIN_IDS;
          const pythTestnetChains = process.env.PYTH_TESTNET_CHAIN_IDS;
          if (pythMainnetChains?.includes(chain) || pythTestnetChains?.includes(chain)) {
            try {
              const oracleAddress = await paymasterContract.tokenOracle();
              const oracleContract = new ethers.Contract(oracleAddress, PythOracleAbi, provider)
              const priceId = await oracleContract.priceLocator();
              const TESTNET_API_URL = process.env.PYTH_TESTNET_URL;
              const MAINNET_API_URL = process.env.PYTH_MAINNET_URL;
              const requestURL = `${chain === '5000' ? MAINNET_API_URL : TESTNET_API_URL}${priceId}`;
              const response = await fetch(requestURL);
              const vaa: any = await response.json();
              const priceData = '0x' + Buffer.from(vaa[0], 'base64').toString('hex');
              const updateFee = await oracleContract.getUpdateFee([priceData]);
              const data = oracleContract.interface.encodeFunctionData('updatePrice', [[priceData]])
              const tx = await signer.sendTransaction({
                to: oracleAddress,
                data: data,
                value: updateFee
              });
              await tx.wait();
            } catch (err) {
              logger.error(err);
            }
          }
          try {
            await paymasterContract.updatePrice();
            logger.info('Price Updated for ' + chain);
          } catch (err) {
            logger.error('Err on updating Price on paymaster' + err);
          }
        });
      } else {
        logger.info('Network config for ' + chain + ' is not added to default');
      }
    });
  }
}

export default routes;
