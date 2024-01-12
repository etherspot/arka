/* eslint-disable @typescript-eslint/no-explicit-any */
import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyCron from 'fastify-cron';
import Postgrator from "postgrator";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { providers, ethers } from 'ethers';
import fetch from 'node-fetch';
import database from './plugins/db.js';
import config from './plugins/config.js';
import routes, { getNetworkConfig } from './routes/index.js';
import adminRoutes from './routes/admin.js';
import EtherspotChainlinkOracleAbi from './abi/EtherspotChainlinkOracleAbi.js';
import PimlicoAbi from './abi/PimlicoAbi.js';
import PythOracleAbi from './abi/PythOracleAbi.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = fastify({
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

await server.register(cors, {
  // put your options here
  preflightContinue: true
})

// Database
await server.register(database);
console.log('dirname: ', __dirname + "/migrations");

const postgrator = new Postgrator({
  migrationPattern: __dirname + "/migrations/*",
  driver: "sqlite3",
  execQuery: (query) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = new Promise<{ rows: any[] }>((resolve) => {
      server.sqlite.all(query, (err, rows) => {
        resolve({ rows });
      })
    });
    return rows;
  },
});

await postgrator.migrate()

await server.register(config);

const ConfigData: any = await new Promise(resolve => {
  server.sqlite.get("SELECT * FROM config", (err, row) => {
    if (err) resolve(null);
    resolve(row);
  });
});

await server.register(fastifyCron, {
  jobs: [
    {
      // Only these two properties are required,
      // the rest is from the node-cron API:
      // https://github.com/kelektiv/node-cron#api
      cronTime: ConfigData?.CRON_TIME ?? '0 0 * * *', // Default: Everyday at midnight UTC,
      name: 'PriceUpdate',

      // Note: the callbacks (onTick & onComplete) take the server
      // as an argument, as opposed to nothing in the node-cron API:
      onTick: async () => {
        if (process.env.CRON_PRIVATE_KEY) {
          const paymastersAdrbase64 = ConfigData.DEPLOYED_ERC20_PAYMASTERS ?? ''
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
                  const pythMainnetChains = ConfigData.PYTH_MAINNET_CHAIN_IDS?.split(',') ?? [];
                  const pythTestnetChains = ConfigData.PYTH_TESTNET_CHAIN_IDS?.split(',') ?? [];
                  if (pythMainnetChains?.includes(chain) || pythTestnetChains?.includes(chain)) {
                    try {
                      const oracleAddress = await paymasterContract.tokenOracle();
                      const oracleContract = new ethers.Contract(oracleAddress, PythOracleAbi, provider)
                      const priceId = await oracleContract.priceLocator();
                      const TESTNET_API_URL = ConfigData.PYTH_TESTNET_URL;
                      const MAINNET_API_URL = ConfigData.PYTH_MAINNET_URL;
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
                  const customChainlinkDeploymentsbase64 = ConfigData.CUSTOM_CHAINLINK_DEPLOYED;
                  if (customChainlinkDeploymentsbase64) {
                    try {
                      const buffer = Buffer.from(customChainlinkDeploymentsbase64, 'base64');
                      const customChainlinks = JSON.parse(buffer.toString());
                      const customChainlinkDeployments = customChainlinks[chain] ?? [];
                      if (customChainlinkDeployments.includes(deployedPaymaster)) {
                        const coingeckoIds = ConfigData.COINGECKO_IDS?.split(',') ?? [''];
                        const coingeckoId = coingeckoIds[customChainlinkDeployments.indexOf(deployedPaymaster)]
                        const response: any = await (await fetch(`${ConfigData.COINGECKO_API_URL}${coingeckoId}`)).json();
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
    }
  ]
})

server.cron.startAllJobs()

await server.register(routes);

await server.register(adminRoutes);

await server.ready();

export default server;
