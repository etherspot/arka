/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { ethers } from "ethers";
import { Paymaster } from "../paymaster/index.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { TOKEN_ADDRESS } from "../constants/Pimlico.js";
import ErrorMessage from "../constants/ErrorMessage.js";

function getNetworkConfig(key: any) {
  return SupportedNetworks.find((chain) => chain.chainId == key);
}

const routes: FastifyPluginAsync = async (server) => {
  const paymaster = new Paymaster(
    server.config.PAYMASTER_PRIVATE_KEY,
    server.config.STACKUP_API_KEY,
  );

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
      return reply.code(200).send('Arka Service Running...');
    }
  )

  server.post(
    "/",
    async function (request, reply) {
      try {
        const body: any = request.body;
        const date = new Date();
        if (!body) return reply.code(400).send({ error: ErrorMessage.EMPTY_BODY });
        const userOp = body.params[0];
        const entryPoint = body.params[1];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const context = body.params[2];
        const chainId = body.params[3];
        const api_key = body.params[4];
        if (!api_key ||
          (api_key != server.config.API_KEY)
        ) return reply.code(400).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !userOp ||
          !entryPoint ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(400).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (!getNetworkConfig(chainId)) {
          return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const hex = (Number((date.valueOf() / 1000).toFixed(0)) + 6000).toString(16);
        let str = '0x'
        for (let i = 0; i < 14 - hex.length; i++) {
          str += '0';
        }
        str += hex;
        const networkConfig = getNetworkConfig(chainId);
        if (!networkConfig) return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const result = await paymaster.sign(userOp, str, "0x0000000000001234", entryPoint, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler);
        if (body.jsonrpc)
          return reply.code(200).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(200).send(result);
      } catch (err: any) {
        request.log.error(err);
        return reply.code(400).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
      }
    }
  );

  server.post(
    "/pimlico",
    async function (request, reply) {
      try {
        const body: any = request.body;

        const userOp = body.params[0];
        const entryPoint = body.params[1];
        const context = body.params[2];
        const gasToken = context ? context.token : null;
        const chainId = body.params[3];
        const api_key = body.params[4];
        if (!api_key ||
          (api_key != server.config.API_KEY)
        ) return reply.code(400).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !userOp ||
          !entryPoint ||
          !gasToken ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(400).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (!getNetworkConfig(chainId)) {
          return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId);
        if (!networkConfig) return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        if (!TOKEN_ADDRESS[chainId][gasToken]) return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK_TOKEN })
        const result = await paymaster.pimlico(userOp, gasToken, networkConfig.bundler, entryPoint);
        if (body.jsonrpc)
          return reply.code(200).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(200).send(result);
      } catch (err: any) {
        request.log.error(err);
        return reply.code(400).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
      }
    }
  );

  server.post(
    "/pimlicoAddress",
    whitelistResponseSchema,
    async function (request, reply) {
      try {
        const body: any = request.body;
        const entryPoint = body.params[0];
        const context = body.params[1];
        const gasToken = context ? context.token : null;
        const chainId = body.params[2];
        const api_key = body.params[3];
        if (!api_key ||
          (api_key != server.config.API_KEY)
        ) return reply.code(400).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !entryPoint ||
          !gasToken ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(400).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (!getNetworkConfig(chainId)) {
          return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId);
        if (!networkConfig) return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        if (!TOKEN_ADDRESS[chainId][gasToken]) return reply.code(400).send({ error: "Invalid network/token" })
        const result = await paymaster.pimlicoAddress(gasToken, networkConfig.bundler, entryPoint);
        if (body.jsonrpc)
          return reply.code(200).send({ jsonrpc: body.jsonrpc, id: body.id, message: result.message, error: null })
        return reply.code(200).send(result);
      } catch (err: any) {
        request.log.error(err);
        return reply.code(400).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG });
      }
    }
  )

  server.post(
    "/stackup",
    async function (request, reply) {
      try {
        const body: any = request.body;

        const userOp = body.params[0];
        const entryPoint = body.params[1];
        const context = body.params[2];
        const gasToken = context ? context.token : null;
        const api_key = body.params[3];
        if (!api_key ||
          (api_key != server.config.API_KEY)
        ) return reply.code(400).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !userOp ||
          !entryPoint ||
          !gasToken
        ) {
          return reply.code(400).send({ error: ErrorMessage.INVALID_DATA });
        }
        const result = await paymaster.stackup(userOp, "erc20token", gasToken, entryPoint);
        if (body.jsonrpc)
          return reply.code(200).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(200).send(result);
      } catch (err: any) {
        request.log.error(err);
        return reply.code(400).send({ error: err.message ?? ErrorMessage.INVALID_DATA });
      }
    }
  );

  server.post(
    "/whitelist",
    async function (request, reply) {
      try {
        const body: any = request.body;

        const address = body.params[0];
        const chainId = body.params[1];
        const api_key = body.params[2];
        if (!api_key ||
          (api_key != server.config.API_KEY)
        ) return reply.code(400).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !Array.isArray(address) ||
          address.length > 10 ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(400).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (!getNetworkConfig(chainId)) {
          return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId);
        if (!networkConfig) return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const validAddresses = await address.every(ethers.utils.isAddress);
        if (!validAddresses) return reply.code(400).send({ error: "Invalid Address passed" });
        const result = await paymaster.whitelistAddresses(address, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler);
        if (body.jsonrpc)
          return reply.code(200).send({ jsonrpc: body.jsonrpc, id: body.id, result, error: null })
        return reply.code(200).send(result);
      } catch (err: any) {
        request.log.error(err);
        return reply.code(400).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG })
      }
    }
  )

  server.post(
    "/checkWhitelist",
    async function (request, reply) {
      try {
        const body: any = request.body;

        const sponsorAddress = body.params[0];
        const accountAddress = body.params[1];
        const chainId = body.params[2];
        const api_key = body.params[3];
        if (!api_key ||
          (api_key != server.config.API_KEY)
        ) return reply.code(400).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          !sponsorAddress ||
          !accountAddress ||
          !ethers.utils.isAddress(sponsorAddress) ||
          !ethers.utils.isAddress(accountAddress) ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(400).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (!getNetworkConfig(chainId)) {
          return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId);
        if (!networkConfig) return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        const response = await paymaster.checkWhitelistAddress(sponsorAddress, accountAddress, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler);
        if (body.jsonrpc)
          return reply.code(200).send({ jsonrpc: body.jsonrpc, id: body.id, result: { message: response === true ? 'Already added' : 'Not added yet' }, error: null })
        return reply.code(200).send({ message: response === true ? 'Already added' : 'Not added yet' });
      } catch (err: any) {
        request.log.error(err);
        return reply.code(400).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG })
      }
    }
  )

  server.post(
    "/deposit",
    whitelistResponseSchema,
    async function (request, reply) {
      try {
        const body: any = request.body;

        const amount = body.params[0];
        const chainId = body.params[1];
        const api_key = body.params[2];
        if (!api_key ||
          (api_key != server.config.API_KEY)
        ) return reply.code(400).send({ error: ErrorMessage.INVALID_API_KEY })
        if (
          isNaN(amount) ||
          !chainId ||
          isNaN(chainId)
        ) {
          return reply.code(400).send({ error: ErrorMessage.INVALID_DATA });
        }
        if (!getNetworkConfig(chainId)) {
          return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        }
        const networkConfig = getNetworkConfig(chainId);
        if (!networkConfig) return reply.code(400).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
        return await paymaster.deposit(amount, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler);
      } catch (err: any) {
        request.log.error(err);
        return reply.code(400).send({ error: err.message ?? ErrorMessage.SOMETHING_WENT_WRONG })
      }
    }
  )
};

export default routes;
