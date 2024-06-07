/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import { CronTime } from 'cron';
import { ethers } from "ethers";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { encode, decode } from "../utils/crypto.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { Op } from 'sequelize';
import { APIKey } from "models/APIKey.js";
import { APIKeyRepository } from "repository/APIKeyRepository.js";

const adminRoutes: FastifyPluginAsync = async (server) => {
  server.post('/adminLogin', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.WALLET_ADDRESS) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      console.log(body, server.config.ADMIN_WALLET_ADDRESS)
      if (ethers.utils.getAddress(body.WALLET_ADDRESS) === server.config.ADMIN_WALLET_ADDRESS) return reply.code(ReturnCode.SUCCESS).send({ error: null, message: "Successfully Logged in" });
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_USER });
    } catch (err: any) {
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_USER });
    }
  })

  server.get("/getConfig", async function (request, reply) {
    try {
      const result: any = await new Promise((resolve, reject) => {
        server.sqlite.db.get("SELECT * FROM config", (err: any, row: any) => {
          if (err) reject(err);
          resolve(row);
        })
      })
      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.post("/saveConfig", async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.DEPLOYED_ERC20_PAYMASTERS || !body.PYTH_MAINNET_URL || !body.PYTH_TESTNET_URL || !body.PYTH_TESTNET_CHAIN_IDS ||
        !body.PYTH_MAINNET_CHAIN_IDS || !body.CRON_TIME || !body.CUSTOM_CHAINLINK_DEPLOYED || !body.COINGECKO_IDS || !body.COINGECKO_API_URL || !body.id)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      await new Promise((resolve, reject) => {
        server.sqlite.db.run("UPDATE config SET DEPLOYED_ERC20_PAYMASTERS = ?, \
          PYTH_MAINNET_URL = ?, \
          PYTH_TESTNET_URL = ?, \
          PYTH_TESTNET_CHAIN_IDS = ?, \
          PYTH_MAINNET_CHAIN_IDS = ?, \
          CRON_TIME = ?, \
          CUSTOM_CHAINLINK_DEPLOYED = ?, \
          COINGECKO_IDS = ?, \
          COINGECKO_API_URL = ? WHERE id = ?", [body.DEPLOYED_ERC20_PAYMASTERS, body.PYTH_MAINNET_URL, body.PYTH_TESTNET_URL, body.PYTH_TESTNET_CHAIN_IDS,
        body.PYTH_MAINNET_CHAIN_IDS, body.CRON_TIME, body.CUSTOM_CHAINLINK_DEPLOYED, body.COINGECKO_IDS, body.COINGECKO_API_URL, body.id
        ], (err: any, row: any) => {
          if (err) reject(err);
          resolve(row);
        })
      });
      server.cron.getJobByName('PriceUpdate')?.stop();
      server.cron.getJobByName('PriceUpdate')?.setTime(new CronTime(body.CRON_TIME));
      server.cron.getJobByName('PriceUpdate')?.start();
      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully saved' });
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  });

  server.post('/saveKey', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.apiKey || !body.privateKey)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.apiKey))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED })
      const wallet = new ethers.Wallet(body.privateKey);
      const publicAddress = await wallet.getAddress();

      // Use Sequelize to find the API key
      const result = await server.sequelize.models.APIKey.findOne({ where: { walletAddress: publicAddress } });
      if (result) {
        request.log.error('Duplicate record found');
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.DUPLICATE_RECORD });
      }

      const privateKey = body.privateKey;
      const hmac = encode(privateKey);

      // console.log(`support network on request.body is: ${body.supportedNetworks}`);
      // console.log(`erc20 paymasters on request.body is: ${body.erc20Paymasters}`);
      // console.log(`request body is: ${JSON.stringify(body)}`);

      // Use Sequelize to insert the new API key
      await server.sequelize.models.APIKey.create({
        apiKey: body.apiKey,
        walletAddress: publicAddress,
        privateKey: hmac,
        supportedNetworks: body.supportedNetworks,
        erc20Paymasters: body.erc20Paymasters,
        multiTokenPaymasters: body.multiTokenPaymasters ?? null,
        multiTokenOracles: body.multiTokenOracles ?? null,
        sponsorName: body.sponsorName ?? null,
        logoUrl: body.logoUrl ?? null,
        transactionLimit: body.transactionLimit ?? 0,
        noOfTransactionsInAMonth: body.noOfTransactionsInAMonth ?? 10,
        indexerEndpoint: body.indexerEndpoint ?? process.env.DEFAULT_INDEXER_ENDPOINT
      });

      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully saved' });
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })


  server.post('/updateKey', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.API_KEY)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.API_KEY))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED });

      const apiKeyInstance = await server.sequelize.models.APIKey.findOne({ where: { apiKey: body.API_KEY } });
      if (!apiKeyInstance)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.RECORD_NOT_FOUND });

      await apiKeyInstance.update({
        supportedNetworks: body.SUPPORTED_NETWORKS,
        erc20Paymasters: body.ERC20_PAYMASTERS,
        transactionLimit: body.TRANSACTION_LIMIT ?? 0,
        noOfTransactionsInAMonth: body.NO_OF_TRANSACTIONS_IN_A_MONTH ?? 10,
        indexerEndpoint: body.INDEXER_ENDPOINT ?? process.env.DEFAULT_INDEXER_ENDPOINT
      });

      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully updated' });
    } catch (err: any) {
      server.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.get('/getKeys', async function (request, reply) {
    try {
      if(!server.sequelize) throw new Error('Sequelize instance is not available');
      const apiKeyRepository = new APIKeyRepository(server.sequelize);
      const apiKeys: APIKey[] = await apiKeyRepository.findAll();
      apiKeys.forEach((apiKeyEntity: APIKey) => {
        apiKeyEntity.privateKey = decode(apiKeyEntity.privateKey);
      });
      return reply.code(ReturnCode.SUCCESS).send(apiKeys);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.post('/deleteKey', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.API_KEY)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.API_KEY))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED });

      const apiKeyInstance = await server.sequelize.models.APIKey.findOne({ where: { apiKey: body.API_KEY } });
      if (!apiKeyInstance)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.RECORD_NOT_FOUND });

      await apiKeyInstance.destroy();

      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully deleted' });
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.post('/getSupportedNetworks', async (request, reply) => {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.WALLET_ADDRESS) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      }
      const result: any = await new Promise((resolve, reject) => {
        server.sqlite.db.get("SELECT SUPPORTED_NETWORKS from api_keys WHERE WALLET_ADDRESS=?", [ethers.utils.getAddress(body.WALLET_ADDRESS)], (err: any, row: any) => {
          if (err) reject(err);
          resolve(row);
        })
      })
      if (!result) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      let supportedNetworks;
      if (result.SUPPORTED_NETWORKS == '') supportedNetworks = SupportedNetworks;
      else {
        const buffer = Buffer.from(result.SUPPORTED_NETWORKS, 'base64');
        supportedNetworks = JSON.parse(buffer.toString())
      }
      return reply.code(ReturnCode.SUCCESS).send(supportedNetworks);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })
};

export default adminRoutes;
