/* eslint-disable @typescript-eslint/no-explicit-any */
import fastify, { FastifyInstance } from 'fastify';
import fastifyHealthcheck from 'fastify-healthcheck';
import cors from '@fastify/cors';
import fastifyCron from 'fastify-cron';
import { providers, ethers } from 'ethers';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import fetch from 'node-fetch';
import sequelizePlugin from './plugins/sequelizePlugin.js';
import config from './plugins/config.js';
import EtherspotChainlinkOracleAbi from './abi/EtherspotChainlinkOracleAbi.js';
import PimlicoAbi from './abi/PimlicoAbi.js';
import PythOracleAbi from './abi/PythOracleAbi.js';
import { getNetworkConfig } from './utils/common.js';
import { checkDeposit } from './utils/monitorTokenPaymaster.js';
import { APIKey } from './models/api-key.js';
import { APIKeyRepository } from './repository/api-key-repository.js';
import { ArkaConfig } from './models/arka-config.js';
import { ArkaConfigRepository } from './repository/arka-config-repository.js';
import adminRoutes from './routes/admin-routes.js';
import depositRoutes from './routes/deposit-route.js';
import metadataRoutes from './routes/metadata-routes.js';
import paymasterRoutes from './routes/paymaster-routes.js';
import pimlicoRoutes from './routes/pimlico-routes.js';
import whitelistRoutes from './routes/whitelist-routes.js';
import sponsorshipPolicyRoutes from './routes/sponsorship-policy-routes.js';
import SupportedNetworks from "../config.json" assert { type: "json" };

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

  await server.register(paymasterRoutes);

  await server.register(adminRoutes);

  await server.register(metadataRoutes);

  await server.register(depositRoutes);

  await server.register(pimlicoRoutes);

  await server.register(whitelistRoutes);

  await server.register(sponsorshipPolicyRoutes);

  // Register the sequelizePlugin
  await server.register(sequelizePlugin);

  // Synchronize all models
  await server.sequelize.sync();

  server.log.info('registered sequelizePlugin...')

  const arkaConfigRepository = new ArkaConfigRepository(server.sequelize);

  await server.register(fastifyCron, {
    jobs: [
      {
        // Only these two properties are required,
        // the rest is from the node-cron API:
        // https://github.com/kelektiv/node-cron#api
        cronTime: process.env.PRICE_UPDATE_CRON_EXP ?? '0 0 * * *', // Default: Everyday at midnight UTC,
        name: 'PriceUpdate',

        // Note: the callbacks (onTick & onComplete) take the server
        // as an argument, as opposed to nothing in the node-cron API:
        onTick: async () => {
          let configData: any
          if (process.env.CRON_PRIVATE_KEY) {
            const unsafeMode = process.env.UNSAFE_MODE === "true" ? true : false;
            if(!unsafeMode) {
              const client = new SecretsManagerClient();
              const api_key = process.env.DEFAULT_API_KEY;
              const prefixSecretId = "arka_";
              const AWSresponse = await client.send(
                new GetSecretValueCommand({
                  SecretId: prefixSecretId + api_key,
                })
              );
              const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
              configData = {
                coingeckoApiUrl: secrets["COINGECKO_API_URL"],
                coingeckoIds: secrets["COINGECKO_IDS"],
                customChainlinkDeployed: secrets["CUSTOM_CHAINLINK_DEPLOYED"],
                deployedErc20Paymasters: secrets["DEPLOYED_ERC20_PAYMASTERS"],
                pythMainnetChainIds: secrets["PYTH_MAINNET_CHAINIDS"],
                pythMainnetUrl: secrets["PYTH_MAINNET_URL"],
                pythTestnetChainIds: secrets["PYTH_TESTNET_CHAINIDS"],
                pythTestnetUrl: secrets["PYTH_TESTNET_URL"]
              }
              client.destroy();
            } else {
              const configDatas = await arkaConfigRepository.findAll();
              configData = configDatas.length > 0 ? configDatas[0] : null;
            }
            const paymastersAdrbase64 = configData?.deployedErc20Paymasters ?? '';
            if (paymastersAdrbase64) {
              const buffer = Buffer.from(paymastersAdrbase64, 'base64');
              const DEPLOYED_ERC20_PAYMASTERS = JSON.parse(buffer.toString());
              Object.keys(DEPLOYED_ERC20_PAYMASTERS).forEach(async (chain) => {
                //EP-v6 entrypoint address
                const networkConfig = getNetworkConfig(chain, '', server.config.EPV_06);
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
            let customPaymasters = [], multiTokenPaymasters = [], customPaymastersV2 = [];
            const apiKeyRepository = new APIKeyRepository(server.sequelize);

            // checking deposit for epv7 native paymasters on db for all apikeys.
            const apiKeys = await apiKeyRepository.findAll();
            
            for(const apiKey of apiKeys) {
              if(apiKey.supportedNetworks) {
                const buffer = Buffer.from(apiKey.supportedNetworks, 'base64');
                const supportedNetworks = JSON.parse(buffer.toString());
                for(const network of supportedNetworks) {
                  const networkConfig = getNetworkConfig(network.chainId, '', server.config.EPV_07);
                  if(
                    network.contracts?.etherspotPaymasterAddress
                  ) {
                    const thresholdValue = network.thresholdValue ?? networkConfig?.thresholdValue;
                    const bundler = network.bundler ?? networkConfig?.bundler;
                    checkDeposit(network.contracts.etherspotPaymasterAddress, bundler, process.env.WEBHOOK_URL, thresholdValue ?? '0.001', Number(network.chainId), server.log);
                  }
                }
              }
            }

            // checking deposit for epv6 native paymasters from default config.json.
            for(const network of SupportedNetworks) {
              const networkConfig = getNetworkConfig(network.chainId, '', server.config.EPV_06);
              if(networkConfig) {
                checkDeposit(network.contracts.etherspotPaymasterAddress, network.bundler, process.env.WEBHOOK_URL, network.thresholdValue ?? '0.001', Number(network.chainId), server.log);
              }
            }

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
              if (secrets['ERC20_PAYMASTERS_V2']) {
                const buffer = Buffer.from(secrets['ERC20_PAYMASTERS_V2'], 'base64');
                customPaymastersV2 = JSON.parse(buffer.toString());
              }
            } else {
              const apiKeyEntity: APIKey | null = await apiKeyRepository.findOneByApiKey(api_key);

              if (apiKeyEntity?.erc20Paymasters) {
                const buffer = Buffer.from(apiKeyEntity.erc20Paymasters, 'base64');
                customPaymasters = JSON.parse(buffer.toString());
              }
              if (apiKeyEntity?.multiTokenPaymasters) {
                const buffer = Buffer.from(apiKeyEntity.multiTokenPaymasters, 'base64');
                multiTokenPaymasters = JSON.parse(buffer.toString());
              }
              if (apiKeyEntity?.erc20PaymastersV2) {
                const buffer = Buffer.from(apiKeyEntity.erc20PaymastersV2, 'base64');
                customPaymastersV2 = JSON.parse(buffer.toString());
              }
            }

            // checking deposit for epv6 ERC20_PAYMASTERS.
            customPaymasters = { ...customPaymasters, ...multiTokenPaymasters };
            for (const chainId in customPaymasters) {
              const networkConfig = getNetworkConfig(chainId, '', server.config.EPV_06);
              if (networkConfig) {
                for (const symbol in customPaymasters[chainId]) {
                  checkDeposit(customPaymasters[chainId][symbol], networkConfig.bundler, process.env.WEBHOOK_URL, networkConfig.thresholdValue ?? '0.001', Number(chainId), server.log)
                }
              }
            }

            // checking deposit for epv7 ERC20_PAYMASTERS_V2.
            for(const chainId in customPaymastersV2) {
              const networkConfig = getNetworkConfig(chainId, '', server.config.EPV_07);
              if(networkConfig) {
                for(const symbol in customPaymastersV2[chainId]) {
                  checkDeposit(customPaymastersV2[chainId][symbol], networkConfig.bundler, process.env.WEBHOOK_URL, networkConfig.thresholdValue ?? '0.001', Number(chainId), server.log);
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
