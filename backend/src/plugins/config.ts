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
    HMAC_SECRET: Type.String({ minLength: 1 }),
    UNSAFE_MODE: Type.Boolean() || undefined,
    EP7_TOKEN_VGL: Type.String() || '90000',
    EP7_TOKEN_PGL: Type.String() || '150000',
    EPV_06: Type.Array(Type.String()) || ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'],
    EPV_07: Type.Array(Type.String()) || ['0x0000000071727De22E5E9d8BAf0edAc6f37da032'],
    DELETE_KEY_RECOVER_WINDOW: Type.Number(),
    KMS_KEY_ID: Type.String() || undefined,
    USE_KMS: Type.Boolean() || false,
    DEFAULT_BUNDLER_API_KEY: Type.String(),
    MULTI_TOKEN_PAYMASTERS: Type.String(),
    MULTI_TOKEN_ORACLES: Type.String(),
    MTP_VGL_MARKUP: Type.String() || '30000',
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
  server.log.info("Validating .env file on config");
  const envVar = {
    LOG_LEVEL: process.env.LOG_LEVEL,
    API_PORT: process.env.API_PORT,
    API_HOST: process.env.API_HOST,
    SUPPORTED_NETWORKS: process.env.SUPPORTED_NETWORKS,
    ADMIN_WALLET_ADDRESS: process.env.ADMIN_WALLET_ADDRESS,
    FEE_MARKUP: process.env.FEE_MARKUP,
    MULTI_TOKEN_MARKUP: process.env.MULTI_TOKEN_MARKUP,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_SSL_ENABLED: process.env.DATABASE_SSL_ENABLED,
    DATABASE_SCHEMA_NAME: process.env.DATABASE_SCHEMA_NAME,
    HMAC_SECRET: process.env.HMAC_SECRET,
    UNSAFE_MODE: process.env.UNSAFE_MODE,
    EP7_TOKEN_VGL: process.env.EP7_TOKEN_VGL,
    EP7_TOKEN_PGL: process.env.EP7_TOKEN_PGL,
    EPV_06: process.env.EPV_06?.split(','),
    EPV_07: process.env.EPV_07?.split(','),
    DELETE_KEY_RECOVER_WINDOW: process.env.DELETE_KEY_RECOVER_WINDOW,
    KMS_KEY_ID: process.env.KMS_KEY_ID,
    USE_KMS: process.env.USE_KMS,
    DEFAULT_BUNDLER_API_KEY: process.env.DEFAULT_BUNDLER_API_KEY,
    MULTI_TOKEN_PAYMASTERS: process.env.MULTI_TOKEN_PAYMASTERS,
    MULTI_TOKEN_ORACLES: process.env.MULTI_TOKEN_ORACLES,
    MTP_VGL_MARKUP: process.env.MTP_VGL_MARKUP
  }

  const valid = validate(envVar);
  if (!valid) {
    throw new Error(
      ".env file validation failed - " +
      JSON.stringify(validate.errors, null, 2)
    );
  }

  server.log.info("Configuring .env file with defaultValues for optional properties");

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
    HMAC_SECRET: process.env.HMAC_SECRET ?? '',
    UNSAFE_MODE: process.env.UNSAFE_MODE === 'true',
    EP7_TOKEN_VGL: process.env.EP7_TOKEN_VGL ?? '90000',
    EP7_TOKEN_PGL: process.env.EP7_TOKEN_PGL ?? '150000',
    EPV_06: process.env.EPV_06?.split(',') ?? ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'],
    EPV_07: process.env.EPV_07?.split(',') ?? ['0x0000000071727De22E5E9d8BAf0edAc6f37da032'],
    DELETE_KEY_RECOVER_WINDOW: parseInt(process.env.DELETE_KEY_RECOVER_WINDOW || '7'),
    KMS_KEY_ID: process.env.KMS_KEY_ID ?? '',
    USE_KMS: process.env.USE_KMS === 'true',
    DEFAULT_BUNDLER_API_KEY: process.env.DEFAULT_BUNDLER_API_KEY ?? '',
    MULTI_TOKEN_PAYMASTERS: process.env.MULTI_TOKEN_PAYMASTERS ?? '',
    MULTI_TOKEN_ORACLES: process.env.MULTI_TOKEN_ORACLES ?? '',
    MTP_VGL_MARKUP: process.env.MTP_VGL_MARKUP ?? '30000'
  }

  server.log.info(config, "config:");

  server.decorate("config", config);
};

declare module "fastify" {
  interface FastifyInstance {
    config: ArkaConfig;
  }
}

export default fp(configPlugin);

export { configPlugin };
