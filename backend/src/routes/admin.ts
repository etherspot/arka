/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyPluginAsync } from "fastify";
import { CronTime } from 'cron';
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";

const adminRoutes: FastifyPluginAsync = async (server) => {
  server.get("/getConfig", async function (request, reply) {
    try {
      const result: any = await new Promise((resolve, reject) => {
        server.sqlite.get("SELECT * FROM config", (err, row) => {
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
        server.sqlite.run("UPDATE config SET DEPLOYED_ERC20_PAYMASTERS = ?, \
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
  })
};

export default adminRoutes;
