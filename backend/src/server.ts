/* eslint-disable @typescript-eslint/no-explicit-any */
import fastify, { FastifyInstance } from 'fastify';
import fastifyHealthcheck from 'fastify-healthcheck';
import cors from '@fastify/cors';
import fastifyCron from 'fastify-cron';
import { providers, ethers } from 'ethers';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import fetch from 'node-fetch';
import database from './plugins/db.js';
import sequelizePlugin from './plugins/sequelizePlugin.js';
import config from './plugins/config.js';
import routes from './routes/index.js';
import adminRoutes from './routes/admin.js';
import metadataRoutes from './routes/metadata.js';
import EtherspotChainlinkOracleAbi from './abi/EtherspotChainlinkOracleAbi.js';
import PimlicoAbi from './abi/PimlicoAbi.js';
import PythOracleAbi from './abi/PythOracleAbi.js';
import { getNetworkConfig } from './utils/common.js';
import { checkDeposit } from './utils/monitorTokenPaymaster.js';
import { APIKey } from 'models/api-key.js';
import { APIKeyRepository } from './repository/api-key-repository.js';
import { ArkaConfig } from 'models/arka-config.js';
import { ArkaConfigRepository } from 'repository/arka-config-repository.js';

let server: FastifyInstance;

const initializeServer = async (): Promise<void> => {

  server = fastify({
    ajv: {
      customOptions: {
        removeAdditional: "all",
        coerceTypes: true,
        useDefaults: true,
      }
    },
    logger: {
      level: process.env.LOG_LEVEL,
    },
  });

  await server.register(config);

  await server.register(cors, {
    // put your options here
    preflightContinue: true
  })

  await server.register(fastifyHealthcheck, {
    healthcheckUrl: "/healthcheck",
    logLevel: "warn"
  });

  await server.register(routes);

  await server.register(adminRoutes);

  await server.register(metadataRoutes);

  // Database
  await server.register(database);

  // Register the sequelizePlugin
  await server.register(sequelizePlugin);

  // Synchronize all models
  await server.sequelize.sync();

  server.log.info('registered sequelizePlugin...')

  const arkaConfigRepository = new ArkaConfigRepository(server.sequelize);
  const configDatas = await arkaConfigRepository.findAll();
  const configData: ArkaConfig | null = configDatas.length > 0 ? configDatas[0] : null;

  await server.register(fastifyCron, {
    jobs: [
      {
        // Only these two properties are required,
        // the rest is from the node-cron API:
        // https://github.com/kelektiv/node-cron#api
        cronTime: configData?.cronTime ?? '0 0 * * *', // Default: Everyday at midnight UTC,
        name: 'PriceUpdate',

        // Note: the callbacks (onTick & onComplete) take the server
        // as an argument, as opposed to nothing in the node-cron API:
        onTick: async () => {
          if (process.env.CRON_PRIVATE_KEY) {
            const paymastersAdrbase64 = configData?.deployedErc20Paymasters ?? ''
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
                    const pythMainnetChains = configData?.pythMainnetChainIds?.split(',') ?? [];
                    const pythTestnetChains = configData?.pythTestnetChainIds?.split(',') ?? [];
                    if (pythMainnetChains?.includes(chain) || pythTestnetChains?.includes(chain)) {
                      try {
                        const oracleAddress = await paymasterContract.tokenOracle();
                        const oracleContract = new ethers.Contract(oracleAddress, PythOracleAbi, provider)
                        const priceId = await oracleContract.priceLocator();
                        const TESTNET_API_URL = configData?.pythTestnetUrl;
                        const MAINNET_API_URL = configData?.pythMainnetUrl;
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
                        server.log.error(err);
                      }
                    }
                    const customChainlinkDeploymentsbase64 = configData?.customChainlinkDeployed;
                    const coingeckoIdsbase64 = configData?.coingeckoIds as string;
                    if (customChainlinkDeploymentsbase64) {
                      try {
                        let buffer = Buffer.from(customChainlinkDeploymentsbase64, 'base64');
                        const customChainlinks = JSON.parse(buffer.toString());
                        buffer = Buffer.from(coingeckoIdsbase64, 'base64');
                        const coingeckoIds = JSON.parse(buffer.toString());
                        const customChainlinkDeployments = customChainlinks[chain] ?? [];
                        if (customChainlinkDeployments.includes(deployedPaymaster)) {
                          const coingeckoId = coingeckoIds[chain][customChainlinkDeployments.indexOf(deployedPaymaster)]
                          const response: any = await (await fetch(`${configData.coingeckoApiUrl}${coingeckoId}`)).json();
                          const price = ethers.utils.parseUnits(response[coingeckoId].usd.toString(), 8);
                          if (price) {
                            const oracleAddress = await paymasterContract.tokenOracle();
                            const oracleContract = new ethers.Contract(oracleAddress, EtherspotChainlinkOracleAbi, provider)
                            const data = oracleContract.interface.encodeFunctionData('fulfillPriceData', [price])
                            const tx = await signer.sendTransaction({
                              to: oracleAddress,
                              data: data,
                            });
                            await tx.wait();
                          }
                        }
                      } catch (err) {
                        server.log.error('Err on fetching price from coingecko' + err)
                      }
                    }
                    try {
                      await paymasterContract.updatePrice();
                      server.log.info('Price Updated for ' + chain);
                    } catch (err) {
                      server.log.error('Err on updating Price on paymaster' + err);
                    }
                  });
                } else {
                  server.log.info('Network config for ' + chain + ' is not added to default');
                }
              });
            }
          } else {
            server.log.info('no private key found in env')
          }
        }
      },
      {
        // Only these two properties are required,
        // the rest is from the node-cron API:
        // https://github.com/kelektiv/node-cron#api
        cronTime: '0 * * * *', // Every Hour,
        name: 'checkTokenPaymasterDeposit',

        // Note: the callbacks (onTick & onComplete) take the server
        // as an argument, as opposed to nothing in the node-cron API:
        onTick: async () => {
          if (process.env.DEFAULT_API_KEY && process.env.WEBHOOK_URL) {
            const prefixSecretId = 'arka_';
            let client: SecretsManagerClient;
            const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;
            const api_key = process.env.DEFAULT_API_KEY;
            let customPaymasters = [], multiTokenPaymasters = [];
            if (!unsafeMode) {
              client = new SecretsManagerClient();
              const AWSresponse = await client.send(
                new GetSecretValueCommand({
                  SecretId: prefixSecretId + api_key,
                })
              );
              client.destroy();
              const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
              if (secrets['ERC20_PAYMASTERS']) {
                const buffer = Buffer.from(secrets['ERC20_PAYMASTERS'], 'base64');
                customPaymasters = JSON.parse(buffer.toString());
              }
              if (secrets['MULTI_TOKEN_PAYMASTERS']) {
                const buffer = Buffer.from(secrets['MULTI_TOKEN_PAYMASTERS'], 'base64');
                multiTokenPaymasters = JSON.parse(buffer.toString());
              }
            } else {
              const apiKeyRepository = new APIKeyRepository(server.sequelize);
              const apiKeyEntity: APIKey | null = await apiKeyRepository.findOneByApiKey(api_key);

              if (apiKeyEntity?.erc20Paymasters) {
                const buffer = Buffer.from(apiKeyEntity.erc20Paymasters, 'base64');
                customPaymasters = JSON.parse(buffer.toString());
              }
              if (apiKeyEntity?.multiTokenPaymasters) {
                const buffer = Buffer.from(apiKeyEntity.multiTokenPaymasters, 'base64');
                multiTokenPaymasters = JSON.parse(buffer.toString());
              }
            }
            customPaymasters = { ...customPaymasters, ...multiTokenPaymasters };
            for (const chainId in customPaymasters) {
              const networkConfig = getNetworkConfig(chainId, '');
              if (networkConfig) {
                for (const symbol in customPaymasters[chainId]) {
                  checkDeposit(customPaymasters[chainId][symbol], networkConfig.bundler, process.env.WEBHOOK_URL, networkConfig.thresholdValue ?? '0.001', Number(chainId), server.log)
                }
              }
            }
          }
        }
      }
    ]
  });

  server.cron.startAllJobs()

  await server.ready();
}

initializeServer();

export { server };
