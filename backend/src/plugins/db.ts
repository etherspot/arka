import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
const pg = await import('pg');
const Client = pg.default.Client;
import * as migrate from 'node-pg-migrate';
import path from 'path';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Postgrator from 'postgrator';

const databasePlugin: FastifyPluginAsync = async (server) => {

  const client: InstanceType<typeof Client> = new Client({
    connectionString: server.config.DATABASE_URL
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  console.log(`__dirname: ${__dirname}`)
  console.log(`${path.join(__dirname, '../migrations/')}`)

  // await migrate.default({
  //   direction: 'up',
  //   dir: path.join(__dirname, './build/migrations'),
  //   databaseUrl: server.config.DATABASE_URL,
  //   migrationsTable: 'arka_migrations'
  // });

  try {
    await client.connect();

    const migrationPattern = path.join(__dirname, '../migrations/*');
    console.log(`Migration pattern: ${migrationPattern}`)

    const postgrator = new Postgrator({
      migrationPattern: path.join(__dirname, './migrations/*'),
      driver: 'pg',
      database: 'arkadev',
      currentSchema: 'arka',
      schemaTable: 'migrations',
      execQuery: (query) => client.query(query),
    });

    console.log('Migrating db...')
    const result = await postgrator.migrate()
    console.log(`Migration done. ${result.length} migrations applied.`)

    if (result.length === 0) {
      console.log(
        'No migrations run for schema. Already at the latest one.'
      )
    }

    console.log('Migration done.')

    process.exitCode = 0
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }

  await client.end();

  server.decorate('pg', client);
};

declare module "fastify" {
  interface FastifyInstance {
    sequelize: Sequelize;
    pg: InstanceType<typeof Client>;
  }
}
export default fp(databasePlugin);
