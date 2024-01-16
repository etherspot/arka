import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import sqlite3 from 'sqlite3';
import { open } from "sqlite";

const databasePlugin: FastifyPluginAsync = async (server) => {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  })

  db.migrate({
    migrationsPath: './build/migrations'
  });

  server.decorate('sqlite', db.db)
};

declare module "fastify" {
  interface FastifyInstance {
    sqlite: sqlite3.Database;
  }
}
export default fp(databasePlugin);