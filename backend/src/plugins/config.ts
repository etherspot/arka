import * as dotenv from "dotenv";
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";
dotenv.config();

export enum NodeEnv {
  development = "development",
  test = "test",
  production = "production",
}

const ConfigSchema = Type.Strict(
  Type.Object({
    LOG_LEVEL: Type.String(),
    API_HOST: Type.String(),
    API_PORT: Type.String(),
    RPC_URL: Type.String(),
    PAYMASTER_CONTRACT: Type.String(),
    PAYMASTER_PRIVATE_KEY: Type.String(),
    VERIFICATION_GAS_LIMIT: Type.String(),
    PIMLICO_API_KEY: Type.String() || undefined,
    STACKUP_API_KEY: Type.String() || undefined,
    PIMLICO_CHAIN_ID: Type.String() || undefined,
  })
);

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

export type Config = Static<typeof ConfigSchema>;

const configPlugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      ".env file validation failed - " +
        JSON.stringify(validate.errors, null, 2)
    );
  }

  const config = {
    LOG_LEVEL: process.env.LOG_LEVEL ?? '',
    API_PORT: process.env.API_PORT ?? '',
    API_HOST: process.env.API_HOST ?? '',
    RPC_URL: process.env.RPC_URL ?? '',
    PAYMASTER_CONTRACT: process.env.PAYMASTER_CONTRACT ?? '',
    PAYMASTER_PRIVATE_KEY: process.env.PAYMASTER_PRIVATE_KEY ?? '',
    PIMLICO_API_KEY: process.env.PIMLICO_API_KEY ?? '',
    STACKUP_API_KEY: process.env.STACKUP_API_KEY ?? '',
    PIMLICO_CHAIN_ID: process.env.PIMLICO_CHAIN_ID ?? '',
    VERIFICATION_GAS_LIMIT: process.env.VERIFICATION_GAS_LIMIT ?? '120000',
  }

  server.decorate("config", config);
};

declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(configPlugin);

export { configPlugin };
