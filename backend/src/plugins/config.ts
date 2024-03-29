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
    SUPPORTED_NETWORKS: Type.String() || undefined,
    ADMIN_WALLET_ADDRESS: Type.String() || undefined,
    FEE_MARKUP: Type.String() || '0',
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
    SUPPORTED_NETWORKS: process.env.SUPPORTED_NETWORKS ?? '',
    ADMIN_WALLET_ADDRESS: process.env.ADMIN_WALLET_ADDRESS ?? '0x80a1874E1046B1cc5deFdf4D3153838B72fF94Ac',
    FEE_MARKUP: process.env.FEE_MARKUP ?? '10',
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
