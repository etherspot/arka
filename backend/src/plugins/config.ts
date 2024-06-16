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
    FEE_MARKUP: Type.String() || undefined,
    MULTI_TOKEN_MARKUP: Type.String() || undefined,
    DATABASE_URL: Type.String() || undefined,
    DATABASE_SSL_ENABLED: Type.Boolean() || undefined,
    DATABASE_SCHEMA_NAME: Type.String() || undefined,
  })
);

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

export type ArkaConfig = Static<typeof ConfigSchema>;

const configPlugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  server.log.info("Validating .env file");
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      ".env file validation failed - " +
      JSON.stringify(validate.errors, null, 2)
    );
  }

  server.log.info("Configuring .env file");

  const config = {
    LOG_LEVEL: process.env.LOG_LEVEL ?? '',
    API_PORT: process.env.API_PORT ?? '',
    API_HOST: process.env.API_HOST ?? '',
    SUPPORTED_NETWORKS: process.env.SUPPORTED_NETWORKS ?? '',
    ADMIN_WALLET_ADDRESS: process.env.ADMIN_WALLET_ADDRESS ?? '0x80a1874E1046B1cc5deFdf4D3153838B72fF94Ac',
    FEE_MARKUP: process.env.FEE_MARKUP ?? '10',
    MULTI_TOKEN_MARKUP: process.env.MULTI_TOKEN_MARKUP ?? '1150000',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    DATABASE_SSL_ENABLED: process.env.DATABASE_SSL_ENABLED === 'true',
    DATABASE_SCHEMA_NAME: process.env.DATABASE_SCHEMA_NAME ?? 'arka',
  }

  server.log.info("Configured .env file");
  server.log.info(`config: ${JSON.stringify(config, null, 2)}`);

  server.decorate("config", config);
};

declare module "fastify" {
  interface FastifyInstance {
    config: ArkaConfig;
  }
}

export default fp(configPlugin);

export { configPlugin };
