import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import sqlite3 from 'sqlite3';

const databasePlugin: FastifyPluginAsync = async (server) => {
  const db = new sqlite3.Database('./database.sqlite');

  server.decorate('sqlite', db)
};

declare module "fastify" {
  interface FastifyInstance {
    sqlite: sqlite3.Database;
  }
}
export default fp(databasePlugin);