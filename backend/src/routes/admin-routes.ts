/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import { CronTime } from 'cron';
import { ethers } from "ethers";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { encode, decode, verifySignature } from "../utils/crypto.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { APIKey } from "../models/api-key.js";
import { ArkaConfigUpdateData } from "../types/arka-config-dto.js";
import { ApiKeyDto } from "../types/apikey-dto.js";
import { CreateSecretCommand, DeleteSecretCommand, GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import EtherspotAbi from "../abi/EtherspotAbi.js";
import { AuthDto } from "../types/auth-dto.js";
import { IncomingHttpHeaders } from "http";

const adminRoutes: FastifyPluginAsync = async (server) => {

  const prefixSecretId = 'arka_';

  let client: SecretsManagerClient;

  const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;

  if (!unsafeMode) {
      client = new SecretsManagerClient();
  }


  server.post('/adminLogin', async function (request, reply) {
    try {
      if(!server.config.UNSAFE_MODE) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.NOT_AUTHORIZED });
      }
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.walletAddress) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (ethers.utils.getAddress(body.walletAddress) === ethers.utils.getAddress(server.config.ADMIN_WALLET_ADDRESS)) return reply.code(ReturnCode.SUCCESS).send({ error: null, message: "Successfully Logged in" });
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_USER });
    } catch (err: any) {
      return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_USER });
    }
  })

  server.get("/getConfig", async function (request, reply) {
    try {
      if(!server.config.UNSAFE_MODE) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.NOT_AUTHORIZED });
      }
      const result = await server.arkaConfigRepository.findFirstConfig();

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
      if(!server.config.UNSAFE_MODE) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.NOT_AUTHORIZED });
      }
      const body: ArkaConfigUpdateData = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (Object.values(body).every(value => value)) {
        try {
          const result = await server.arkaConfigRepository.updateConfig(body);
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
      const body = JSON.parse(request.body as string) as ApiKeyDto;
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.apiKey)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.apiKey))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED });

      const mnemonic = ethers.utils.entropyToMnemonic(
        ethers.utils.randomBytes(16)
      );
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      const privateKey = wallet.privateKey;
      const publicAddress = await wallet.getAddress();

      if(!unsafeMode) {
        const { 'x-signature': signature, 'x-timestamp': timestamp } = request.headers as IncomingHttpHeaders & AuthDto;
        if(!signature || !timestamp)
          return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.INVALID_SIGNATURE_OR_TIMESTAMP });
        if(!verifySignature(signature, request.body as string, timestamp, server.config.HMAC_SECRET))
          return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.INVALID_SIGNATURE_OR_TIMESTAMP });

        const command = new GetSecretValueCommand({SecretId: prefixSecretId + body.apiKey})
        const secrets = await client.send(command).catch((err) => err);

        if(!(secrets instanceof Error)) {
          request.log.error('Duplicate record found');
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.DUPLICATE_RECORD });
        }

        const createCommand = new CreateSecretCommand({
          Name: prefixSecretId + body.apiKey,
          SecretString: JSON.stringify({
            PRIVATE_KEY: privateKey,
            PUBLIC_ADDRESS: publicAddress,
            MNEMONIC: mnemonic
          }),
        });

        await client.send(createCommand);
      } else {
        const result = await server.apiKeyRepository.findOneByApiKey(body.apiKey);
        if (result) {
          request.log.error('Duplicate record found');
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.DUPLICATE_RECORD });
        }

        await server.apiKeyRepository.create({
          apiKey: body.apiKey,
          walletAddress: publicAddress,
          privateKey: encode(privateKey, server.config.HMAC_SECRET),
          supportedNetworks: body.supportedNetworks,
          erc20Paymasters: body.erc20Paymasters,
          multiTokenPaymasters: body.multiTokenPaymasters ?? null,
          multiTokenOracles: body.multiTokenOracles ?? null,
          sponsorName: body.sponsorName ?? null,
          logoUrl: body.logoUrl ?? null,
          transactionLimit: body.transactionLimit ?? 0,
          noOfTransactionsInAMonth: body.noOfTransactionsInAMonth ?? 10,
          indexerEndpoint: body.indexerEndpoint ?? process.env.DEFAULT_INDEXER_ENDPOINT ?? null,
          bundlerApiKey: body.bundlerApiKey ?? null,
        });
      }

      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully saved' });
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  });

  server.post('/updateKey', async function (request, reply) {
    try {
      if(!server.config.UNSAFE_MODE) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.NOT_AUTHORIZED });
      }
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
        indexerEndpoint: body.indexerEndpoint ?? process.env.DEFAULT_INDEXER_ENDPOINT,
        bundlerApiKey: body.bundlerApiKey ?? null,
      });

      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully updated' });
    } catch (err: any) {
      server.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })

  server.get('/getKeys', async function (request, reply) {
    try {
      if(!server.config.UNSAFE_MODE) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.NOT_AUTHORIZED });
      }
      if (!server.sequelize) throw new Error('Sequelize instance is not available');

      const apiKeys = await server.apiKeyRepository.findAll();
      apiKeys.forEach((apiKeyEntity: APIKey) => {
        apiKeyEntity.privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
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
      if (!body)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.apiKey)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.apiKey))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED });

      let bundlerApiKey = body.apiKey;
      let supportedNetworks;
      if(!unsafeMode) {
        const { 'x-signature': signature, 'x-timestamp': timestamp } = request.headers as IncomingHttpHeaders & AuthDto;
        if(!signature || !timestamp || isNaN(+timestamp))
          return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.INVALID_SIGNATURE_OR_TIMESTAMP });
        if(!verifySignature(signature, request.body as string, timestamp, server.config.HMAC_SECRET))
          return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.INVALID_SIGNATURE_OR_TIMESTAMP });
        const getSecretCommand = new GetSecretValueCommand({SecretId: prefixSecretId + body.apiKey});
        const secretValue = await client.send(getSecretCommand)
        if(secretValue instanceof Error)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.RECORD_NOT_FOUND });

        const secrets = JSON.parse(secretValue.SecretString ?? '{}');
        
        if (!secrets['PRIVATE_KEY']) {
          server.log.info("Invalid Api Key provided")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        }
        if (secrets['BUNDLER_API_KEY']) {
          bundlerApiKey = secrets['BUNDLER_API_KEY'];
        }

        if(secrets['SUPPORTED_NETWORKS']) {
          const buffer = Buffer.from(secrets['SUPPORTED_NETWORKS'], 'base64');
          supportedNetworks = JSON.parse(buffer.toString())
        }
        supportedNetworks = supportedNetworks ?? SupportedNetworks;

        const privateKey = secrets['PRIVATE_KEY'];

        // native balance check.
        const nativeBalancePromiseArr = [];
        const nativePaymasterDepositPromiseArr = [];
        for(const network of supportedNetworks) {
          const provider = new ethers.providers.JsonRpcProvider(network.bundler + '?api-key=' + bundlerApiKey);
          const wallet = new ethers.Wallet(privateKey, provider)
          nativeBalancePromiseArr.push(wallet.getBalance());

          const contract = new ethers.Contract(
            network.contracts.etherspotPaymasterAddress,
            EtherspotAbi,
            wallet
          );
          nativePaymasterDepositPromiseArr.push(contract.getSponsorBalance(wallet.address));
        }

        let error = false;

        await Promise.allSettled([...nativeBalancePromiseArr, ...nativePaymasterDepositPromiseArr]).then((data) => {
          const threshold = ethers.utils.parseEther('0.0001');
          for(const item of data) {
            if(
              item.status === 'fulfilled' &&
              item.value?.gt(threshold)
            ) {
              error = true;
              return;
            }
            if(item.status === 'rejected') {
              request.log.error(
                `Error occurred while fetching balance/sponsor balance for apiKey: ${body.apiKey}, reason: ${JSON.stringify(item.reason)}`
              );
            }
          }
        });
        
        if(error) {
          return reply.code(400).send({error: ErrorMessage.BALANCE_EXCEEDS_THRESHOLD });
        }

        const deleteCommand = new DeleteSecretCommand({
          SecretId: prefixSecretId + body.apiKey,
          RecoveryWindowInDays: server.config.DELETE_KEY_RECOVER_WINDOW,
        });

        await client.send(deleteCommand);
      } else {
        const apiKeyInstance = await server.apiKeyRepository.findOneByApiKey(body.apiKey);
        if (!apiKeyInstance)
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.RECORD_NOT_FOUND });

        await server.apiKeyRepository.delete(body.apiKey);
      }

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
      if (!body.walletAddress) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      }

      const apiKeyEntity = await server.apiKeyRepository.findOneByWalletAddress(body.walletAddress);
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
