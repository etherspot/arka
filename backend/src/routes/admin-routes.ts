/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import { CronTime } from 'cron';
import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  parseEther,
  getContract
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ethers } from "ethers";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { encode, decode, verifySignature } from "../utils/crypto.js";
import SupportedNetworks from "../../config.json";
import { APIKey } from "../models/api-key.js";
import { ArkaConfigUpdateData } from "../types/arka-config-dto.js";
import { ApiKeyDto } from "../types/apikey-dto.js";
import { CreateSecretCommand, DeleteSecretCommand, GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import EtherspotAbi from "../abi/EtherspotAbi.js";
import { AuthDto } from "../types/auth-dto.js";
import { IncomingHttpHeaders } from "http";
import { EPVersions } from "../types/sponsorship-policy-dto.js";
import { getNetworkConfig, getViemChainDef } from "../utils/common.js";
import { Paymaster } from "../paymaster/index.js";

const adminRoutes: FastifyPluginAsync = async (server) => {
  const paymaster = new Paymaster({
    feeMarkUp: server.config.FEE_MARKUP, 
    multiTokenMarkUp: server.config.MULTI_TOKEN_MARKUP, 
    ep7TokenVGL: server.config.EP7_TOKEN_VGL, 
    ep7TokenPGL: server.config.EP7_TOKEN_PGL, 
    sequelize: server.sequelize, 
    mtpVglMarkup: server.config.MTP_VGL_MARKUP, 
    ep7Pvgl: server.config.EP7_PVGL, 
    mtpPvgl: server.config.MTP_PVGL, 
    mtpPpgl: server.config.MTP_PPGL, 
    ep8Pvgl: server.config.EP8_PVGL,
    skipType2Txns: server.config.ENFORCE_LEGACY_TRANSACTIONS_CHAINS
  });

  const prefixSecretId = 'arka_';

  let client: SecretsManagerClient;

  const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;

  if (!unsafeMode) {
      client = new SecretsManagerClient();
  }

  const SUPPORTED_ENTRYPOINTS = {
    EPV_06: server.config.EPV_06,
    EPV_07: server.config.EPV_07,
    EPV_08: server.config.EPV_08
  }


  server.post('/adminLogin', async function (request, reply) {
    try {
      if(!server.config.UNSAFE_MODE) {
        return reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.NOT_AUTHORIZED });
      }
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.MISSING_PARAMS });
      if (!body.walletAddress) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (getAddress(body.walletAddress) === getAddress(server.config.ADMIN_WALLET_ADDRESS)) return reply.code(ReturnCode.SUCCESS).send({ error: null, message: "Successfully Logged in" });
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
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.MISSING_PARAMS });
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
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.MISSING_PARAMS });
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
            MNEMONIC: mnemonic,
            BUNDLER_API_KEY: server.config.DEFAULT_BUNDLER_API_KEY
          }),
        });

        await client.send(createCommand);

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
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.MISSING_PARAMS });
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
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.MISSING_PARAMS });
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
          const viemChain = getViemChainDef(network.chainId);
          const publicClient = createPublicClient({
            chain: viemChain,
            transport: http(network.bundler + '?api-key=' + bundlerApiKey),
          });
          const walletClient = createWalletClient({
            chain: viemChain,
            transport: http(network.bundler + '?api-key=' + bundlerApiKey),
            account: privateKeyToAccount(privateKey as `0x${string}`),
          });

          nativeBalancePromiseArr.push(publicClient.getBalance({ address: walletClient.account.address }));

          const contract = getContract({
            address: network.contracts.etherspotPaymasterAddress as `0x${string}`,
            abi: EtherspotAbi,
            client: { public: publicClient, wallet: walletClient }
          });
          nativePaymasterDepositPromiseArr.push(contract.read.getSponsorBalance([walletClient.account.address]));
        }

        let error = false;

        await Promise.allSettled([...nativeBalancePromiseArr, ...nativePaymasterDepositPromiseArr]).then((data) => {
          const threshold = parseEther('0.0001');
          for(const item of data) {
            if(
              item.status === 'fulfilled' &&
              (item.value as bigint) > threshold
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

        await server.apiKeyRepository.delete(body.apiKey);
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
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.MISSING_PARAMS });
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

  server.post('/deployVerifyingPaymaster', async (request, reply) => {
    try {
      if (!request.body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.MISSING_PARAMS });

      const body: any = request.body;
      const query: any = request.query;
      const chainId = query['chainId'] ?? body.params?.[1];
      const apiKey = query['apiKey'] ?? body.params?.[2];
      const epVersion = body.params?.[0];

      if (!chainId || isNaN(chainId) || !apiKey) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      }

      if (!epVersion || (epVersion !== EPVersions.EPV_06 && epVersion !== EPVersions.EPV_07 && epVersion !== EPVersions.EPV_08)) {
        return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.INVALID_EP_VERSION});
      }

      const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(apiKey);
      if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });

      let verifyingPaymasters;
      let supportedEPs;

      if(epVersion === EPVersions.EPV_06) {
        verifyingPaymasters = apiKeyEntity.verifyingPaymasters ? JSON.parse(apiKeyEntity.verifyingPaymasters) : {};
        supportedEPs = SUPPORTED_ENTRYPOINTS.EPV_06;
      } else if(epVersion === EPVersions.EPV_07) {
        verifyingPaymasters = apiKeyEntity.verifyingPaymastersV2 ? JSON.parse(apiKeyEntity.verifyingPaymastersV2) : {};
        supportedEPs = SUPPORTED_ENTRYPOINTS.EPV_07;
      } else {
        verifyingPaymasters = apiKeyEntity.verifyingPaymastersV3 ? JSON.parse(apiKeyEntity.verifyingPaymastersV3) : {};
        supportedEPs = SUPPORTED_ENTRYPOINTS.EPV_08;
      }
      // if (verifyingPaymasters[chainId]) {
      //   return reply.code(ReturnCode.FAILURE).send(
      //     {error: `${ErrorMessage.VP_ALREADY_DEPLOYED} at ${verifyingPaymasters[chainId]}`}
      //   );
      // }

      let privateKey;
      let bundlerApiKey = apiKey;
      let supportedNetworks;

      if (!unsafeMode) {
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + apiKey,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        }
        if (secrets['BUNDLER_API_KEY']) {
          bundlerApiKey = secrets['BUNDLER_API_KEY'];
        }
        privateKey = secrets['PRIVATE_KEY'];
        supportedNetworks = secrets['SUPPORTED_NETWORKS'];
      } else {
        privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
        supportedNetworks = apiKeyEntity.supportedNetworks;
        if (apiKeyEntity.bundlerApiKey) {
          bundlerApiKey = apiKeyEntity.bundlerApiKey;
        }
      }

      if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      
      const networkConfig = getNetworkConfig(
        chainId,
        supportedNetworks ?? '',
        supportedEPs
      );
      
      if (!networkConfig) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      let bundlerUrl = networkConfig.bundler;
      if (networkConfig.bundler.includes('etherspot.io')) {
        bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
      }

      console.log('epVersion and epAddress: ', epVersion, networkConfig.entryPoint);
      if (verifyingPaymasters[chainId]) {
        return reply.code(ReturnCode.FAILURE).send(
          {error: `${ErrorMessage.VP_ALREADY_DEPLOYED} at ${verifyingPaymasters[chainId]}`}
        );
      }

      const {address, hash} = await paymaster.deployVp(
        privateKey,
        bundlerUrl,
        networkConfig.entryPoint,
        epVersion,
        chainId,
        server.log
      );
      verifyingPaymasters[chainId] = address;
      await server.apiKeyRepository.updateVpAddresses(apiKey, JSON.stringify(verifyingPaymasters), epVersion);

      return reply.code(ReturnCode.SUCCESS).send({verifyingPaymaster: address, txHash: hash});
    } catch (error: any) {
      request.log.error(error);
      return reply.code(ReturnCode.FAILURE).send({ error: error.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  });

  server.post('/addStake', async (request, reply) => {
    try {
      if (!request.body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.MISSING_PARAMS });

      const body: any = request.body;
      const query: any = request.query;
      const chainId = query['chainId'];
      const apiKey = query['apiKey'];
      const epVersion = body.params?.[0];
      const amount = body.params?.[1];

      if (!chainId || isNaN(chainId) || !apiKey) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      }

      if(isNaN(amount)) {
        return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.INVALID_AMOUNT_TO_STAKE});
      }

      if (!epVersion || (epVersion !== EPVersions.EPV_06 && epVersion !== EPVersions.EPV_07 && epVersion !== EPVersions.EPV_08)) {
        return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.INVALID_EP_VERSION});
      }

      const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(apiKey);
      if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });

      let verifyingPaymasters, supportedEPs;

      if(epVersion === EPVersions.EPV_06) {
        verifyingPaymasters = apiKeyEntity.verifyingPaymasters ? JSON.parse(apiKeyEntity.verifyingPaymasters) : {};
        supportedEPs = SUPPORTED_ENTRYPOINTS.EPV_06;
      } else if (epVersion === EPVersions.EPV_07) {
        verifyingPaymasters = apiKeyEntity.verifyingPaymastersV2 ? JSON.parse(apiKeyEntity.verifyingPaymastersV2) : {};
        supportedEPs = SUPPORTED_ENTRYPOINTS.EPV_07;
      } else {
        verifyingPaymasters = apiKeyEntity.verifyingPaymastersV3 ? JSON.parse(apiKeyEntity.verifyingPaymastersV3) : {};
        supportedEPs = SUPPORTED_ENTRYPOINTS.EPV_08;
      }

      if (!verifyingPaymasters[chainId]) {
        return reply.code(ReturnCode.FAILURE).send(
          {error: `${ErrorMessage.VP_NOT_DEPLOYED}`}
        );
      }

      let privateKey;
      let bundlerApiKey = apiKey;
      let supportedNetworks;

      if (!unsafeMode) {
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + apiKey,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) {
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
        }
        if (secrets['BUNDLER_API_KEY']) {
          bundlerApiKey = secrets['BUNDLER_API_KEY'];
        }
        privateKey = secrets['PRIVATE_KEY'];
        supportedNetworks = secrets['SUPPORTED_NETWORKS'];
      } else {
        privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
        supportedNetworks = apiKeyEntity.supportedNetworks;
        if (apiKeyEntity.bundlerApiKey) {
          bundlerApiKey = apiKeyEntity.bundlerApiKey;
        }
      }

      if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      const networkConfig = getNetworkConfig(
        chainId,
        supportedNetworks ?? '',
        supportedEPs
      );
      if (!networkConfig) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      let bundlerUrl = networkConfig.bundler;
      if (networkConfig.bundler.includes('etherspot.io')) {
        bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;
      }

      const tx = await paymaster.addStake(
        privateKey,
        bundlerUrl,
        amount,
        verifyingPaymasters[chainId],
        chainId,
        server.log
      );
      return reply.code(ReturnCode.SUCCESS).send(tx);
    } catch (error: any) {
      request.log.error(error);
      return reply.code(ReturnCode.FAILURE).send({ error: error.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  });
};

export default adminRoutes;
