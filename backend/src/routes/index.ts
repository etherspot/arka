import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { Paymaster } from "../paymaster/index.js";

const routes: FastifyPluginAsync = async (server) => {
  const paymaster = new Paymaster(
    server.config.RPC_URL,
    server.config.PAYMASTER_CONTRACT,
    server.config.PAYMASTER_PRIVATE_KEY,
    server.config.PIMLICO_API_KEY,
    server.config.STACKUP_API_KEY,
    server.config.PIMLICO_CHAIN_ID,
    server.config.VERIFICATION_GAS_LIMIT,
  );

  const ResponseSchema = {
    schema: {
      response: {
        200: Type.Object({
          paymasterAndData: Type.String(),
          verificationGasLimit: Type.String(),
        }),
        400: Type.Object({
          error: Type.String(),
        }),
      },
    },
  }

  server.get(
    "/",
    async function (request, reply) {
      return reply.code(200).send('Arka Service Running...');
    }
  )

  server.post(
    "/",
    ResponseSchema,
    async function (request, reply) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = request.body;
        const date = new Date();
        const timeOffset = date.getTimezoneOffset() * 60;
        if (!body) return reply.code(400).send({ error: "Empty Body received" });
        const userOp = body.params[0];
        const entryPoint = body.params[1];
        if (
          !userOp ||
          !entryPoint
        ) {
          return reply.code(400).send({ error: "Invalid data" });
        }
        const hex = (Number((date.valueOf() / 1000).toFixed(0)) + 300 + timeOffset).toString(16);
        let str = '0x'
        for (let i = 0; i < 14 - hex.length; i++) {
          str += '0';
        }
        str += hex;
        return await paymaster.sign(userOp, str, "0x0000000000001234");
      } catch (err) {
        request.log.error(err);
        return reply.code(400).send({ error: "Invalid data" });
      }
    }
  );
  
  server.post(
    "/pimlico",
    ResponseSchema,
    async function (request, reply) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = request.body;

        const userOp = body.params[0];
        const entryPoint = body.params[1];
        const context = body.params[2];
        const gasToken = context ? context.token : null;
        if (
          !userOp ||
          !entryPoint ||
          !gasToken
        ) {
          return reply.code(400).send({ error: "Invalid data" });
        }
        return await paymaster.pimlico(userOp, gasToken);
      } catch (err) {
        request.log.error(err);
        return reply.code(400).send({ error: "Invalid data" });
      }
    }
  );

  server.post(
    "/stackup",
    ResponseSchema,
    async function (request, reply) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = request.body;

        const userOp = body.params[0];
        const entryPoint = body.params[1];
        const context = body.params[2];
        const gasToken = context ? context.token : null;
        if (
          !userOp ||
          !entryPoint ||
          !gasToken
        ) {
          return reply.code(400).send({ error: "Invalid data" });
        }
        return await paymaster.stackup(userOp, "erc20token", gasToken, entryPoint);
      } catch (err) {
        request.log.error(err);
        return reply.code(400).send({ error: "Invalid data" });
      }
    }
  );
};

export default routes;
