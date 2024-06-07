import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Sequelize } from 'sequelize';
import sqlite3 from 'sqlite3';

const sequelizePlugin: FastifyPluginAsync = async (server) => {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite',
        dialectModule: sqlite3
    });

    server.decorate('sequelize', sequelize);

    server.addHook('onClose', (instance, done) => {
        instance.sequelize.close().then(() => done(), done);
    });
};

declare module "fastify" {
    interface FastifyInstance {
        sequelize: Sequelize;
    }
}

export default fp(sequelizePlugin);