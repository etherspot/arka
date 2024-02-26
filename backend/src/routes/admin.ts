/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import { CronTime } from 'cron';
import { ethers } from "ethers";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { encode, decode } from "../utils/crypto.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };

const adminRoutes: FastifyPluginAsync = async (server) => {
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
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
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
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
    }
  });

  server.post('/saveKey', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.API_KEY || !body.PRIVATE_KEY)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*-_&])[A-Za-z\d@$!%*-_&]{8,}$/.test(body.API_KEY))
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.API_KEY_VALIDATION_FAILED })
      const wallet = new ethers.Wallet(body.PRIVATE_KEY);
      const publicAddress = await wallet.getAddress();
      const result: any[] = await new Promise((resolve, reject) => {
        server.sqlite.db.get("SELECT * FROM api_keys WHERE WALLET_ADDRESS=?", [publicAddress], (err: any, row: any) => {
          if (err) reject(err);
          resolve(row);
        })
      })
      if (result && result.length > 0)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.DUPLICATE_RECORD });
      const privateKey = body.PRIVATE_KEY;
      const hmac = encode(privateKey);
      await new Promise((resolve, reject) => {
        server.sqlite.db.run("INSERT INTO api_keys ( \
          API_KEY, \
          WALLET_ADDRESS, \
          PRIVATE_KEY, \
          SUPPORTED_NETWORKS, \
          ERC20_PAYMASTERS, \
          TRANSACTION_LIMIT, \
          NO_OF_TRANSACTIONS_IN_A_MONTH, \
          INDEXER_ENDPOINT) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
          body.API_KEY,
          publicAddress,
          hmac,
          body.SUPPORTED_NETWORKS,
          body.ERC20_PAYMASTERS,
          body.TRANSACTION_LIMIT ?? 0,
          body.NO_OF_TRANSACTIONS_IN_A_MONTH ?? 10,
          body.INDEXER_ENDPOINT ?? "http://localhost:3003"
        ], (err: any, row: any) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully saved' });
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
    }
  })

  server.post('/updateKey', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.API_KEY)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      const result: any[] = await new Promise((resolve, reject) => {
        server.sqlite.db.get("SELECT * FROM api_keys WHERE API_KEY=?", [body.API_KEY], (err: any, row: any) => {
          if (err) reject(err);
          resolve(row);
        })
      });
      if (!result || result.length == 0)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.RECORD_NOT_FOUND });
      await new Promise((resolve, reject) => {
        server.sqlite.db.run("UPDATE api_keys SET SUPPORTED_NETWORKS = ?, \
          ERC20_PAYMASTERS = ?, \
          TRANSACTION_LIMIT = ?, \
          NO_OF_TRANSACTIONS_IN_A_MONTH = ?, \
          INDEXER_ENDPOINT = ?, \
          WHERE API_KEY = ?", [body.SUPPORTED_NETWORKS, body.ERC20_PAYMASTERS, body.TRANSACTION_LIMIT ?? 0, body.NO_OF_TRANSACTIONS_IN_A_MONTH ?? 10,
        body.INDEXER_ENDPOINT ?? "http://localhost:3003", body.API_KEY
        ], (err: any, row: any) => {
          if (err) reject(err);
          resolve(row);
        })
      });
      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully updated' });
    } catch (err) {
      server.log.error(err);
    }
  })

  server.get('/getKeys', async function (request, reply) {
    try {
      const result: any[] = await new Promise((resolve, reject) => {
        server.sqlite.db.all("SELECT * FROM api_keys", (err: any, rows: any[]) => {
          if (err) reject(err);
          resolve(rows);
        })
      })
      result.map((value) => {
        value.PRIVATE_KEY = decode(value.PRIVATE_KEY)
      });
      return reply.code(ReturnCode.SUCCESS).send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
    }
  })

  server.post('/deleteKey', async function (request, reply) {
    try {
      const body: any = JSON.parse(request.body as string);
      if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
      if (!body.API_KEY)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
      await new Promise((resolve, reject) => {
        server.sqlite.db.run("DELETE FROM api_keys WHERE API_KEY=?", [body.API_KEY], (err: any, rows: any) => {
          if (err) reject(err);
          resolve(rows);
        })
      })
      return reply.code(ReturnCode.SUCCESS).send({ error: null, message: 'Successfully deleted' });
    } catch (err: any) {
      request.log.error(err);
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
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
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
    }
  })
};

export default adminRoutes;
