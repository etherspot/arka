import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Umzug, SequelizeStorage } from 'umzug';

const databasePlugin: FastifyPluginAsync = async (server) => {

  server.log.info(`Connecting to database... with URL:  ${server.config.DATABASE_URL} and schemaName: ${server.config.DATABASE_SCHEMA_NAME}`);

  const sequelize = new Sequelize(server.config.DATABASE_URL, {
    schema: server.config.DATABASE_SCHEMA_NAME,
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  const migrationPath = path.join(__dirname, '../../migrations/*.cjs');
  
  const umzug = new Umzug({
    migrations: {glob: migrationPath},
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({sequelize}),
    logger: console,
  })

  try {
    server.log.info('Running migrations...')
    await umzug.up();
    server.log.info('Migrations done.')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exitCode = 1
  }
};

declare module "fastify" {
  interface FastifyInstance {
    sequelize: Sequelize;
  }
}

export default fp(databasePlugin);