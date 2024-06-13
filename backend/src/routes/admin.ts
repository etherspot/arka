/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import { CronTime } from 'cron';
import { ethers } from "ethers";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { encode, decode } from "../utils/crypto.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { APIKey } from "../models/APIKey.js";
import { ConfigUpdateData } from "../types/config-dto.js";
import { ApiKeyDto } from "../types/apikey-dto.js";

const adminRoutes: FastifyPluginAsync = async (server) => {
  server.post('/adminLogin', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.WALLET_ADDRESS) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (ethers.utils.getAddress(body.WALLET_ADDRESS) === server.config.ADMIN_WALLET_ADDRESS) return reply.code(ReturnCode.SUCCESS).send({ error: null, message: "Successfully Logged in" });
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_USER });
    } catch (err: any) {
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_USER });
    }
  })

  server.get("/getConfig", async function (request, reply) {
    try {
      const result = await server.configRepository.findFirstConfig();

      if (!result) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.FAILED_TO_PROCESS });
      }

      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.post("/saveConfig", async function (request, reply) {
    try {
      const body: ConfigUpdateData = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (Object.values(body).every(value => value)) {
        try {
          const result = await server.configRepository.updateConfig(body);
          server.log.info(`config entity after database update: ${JSON.stringify(result)}`);
        } catch (error) {
          server.log.error('Error while updating the config:', error);
          throw error;
        }

        server.cron.getJobByName('PriceUpdate')?.stop();
        server.cron.getJobByName('PriceUpdate')?.setTime(new CronTime(body.cronTime));
        server.cron.getJobByName('PriceUpdate')?.start();
        return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully saved' });
      } else {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      }
    }
    catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  });

  server.post('/saveKey', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string) as ApiKeyDto;
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.apiKey || !body.privateKey)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.apiKey))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED })

      const wallet = new ethers.Wallet(body.privateKey);
      const publicAddress = await wallet.getAddress();
      request.log.info(`Public address is: ${publicAddress}`);

      // Use Sequelize to find the API key
      const result = await server.apiKeyRepository.findOneByWalletAddress(publicAddress);

      if (result) {
        request.log.error('Duplicate record found');
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.DUPLICATE_RECORD });
      }

      await server.apiKeyRepository.create({
        apiKey: body.apiKey,
        walletAddress: publicAddress,
        privateKey: encode(body.privateKey),
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
      const body = JSON.parse(request.body as string) as ApiKeyDto;
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.apiKey)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.apiKey))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED });

      const apiKeyInstance = await server.apiKeyRepository.findOneByApiKey(body.apiKey);
      if (!apiKeyInstance)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.RECORD_NOT_FOUND });

      await apiKeyInstance.update({
        supportedNetworks: body.supportedNetworks,
        erc20Paymasters: body.erc20Paymasters,
        transactionLimit: body.transactionLimit ?? 0,
        noOfTransactionsInAMonth: body.noOfTransactionsInAMonth ?? 10,
        indexerEndpoint: body.indexerEndpoint ?? process.env.DEFAULT_INDEXER_ENDPOINT
      });

      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully updated' });
    } catch (err: any) {
      server.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.get('/getKeys', async function (request, reply) {
    try {
      if (!server.sequelize) throw new Error('Sequelize instance is not available');

      const apiKeys = await server.apiKeyRepository.findAll();
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
      if (!body.apiKey)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.apiKey))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED });

      const apiKeyInstance = await server.apiKeyRepository.findOneByApiKey(body.apiKey);
      if (!apiKeyInstance)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.RECORD_NOT_FOUND });

      await server.apiKeyRepository.delete(body.apiKey);

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

      const apiKeyEntity = await server.apiKeyRepository.findOneByWalletAddress(body.WALLET_ADDRESS);
      if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });

      let supportedNetworks;
      if (!apiKeyEntity.supportedNetworks || apiKeyEntity.supportedNetworks == '') {
        supportedNetworks = SupportedNetworks;
      }
      else {
        const buffer = Buffer.from(apiKeyEntity.supportedNetworks as string, 'base64');
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
