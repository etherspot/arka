import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Umzug, SequelizeStorage } from 'umzug';

const databasePlugin: FastifyPluginAsync = async (server) => {

  const sequelize = new Sequelize(server.config.DATABASE_URL, {
    schema: 'arka',
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
    server.log.error('Migration failed:', err)
    process.exitCode = 1
  }

  //server.decorate('sequelize', sequelize);
};

declare module "fastify" {
  interface FastifyInstance {
    sequelize: Sequelize;
  }
}

export default fp(databasePlugin);