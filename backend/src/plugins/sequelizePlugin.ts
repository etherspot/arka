import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import { initializeAPIKeyModel } from '../models/APIKey';  // Assuming path correctness
import { initializeSponsorshipPolicyModel } from '../models/SponsorshipPolicy';
import { initializeSponsorshipPolicyChainModel } from '../models/SponsorshipPolicyChain';
import { initializeSponsorshipPolicyLimitModel } from "models/SponsorshipPolicyLimit";
const pg = await import('pg');
const Client = pg.default.Client;

dotenv.config();

const sequelizePlugin: FastifyPluginAsync = async (server) => {

    try {
        const client: InstanceType<typeof Client> = new Client({
            connectionString: server.config.DATABASE_URL
        });
        await client.connect();
        console.log('Connected to database');
    } catch (err) {
        console.error(err);
    }

    const sequelize = new Sequelize(server.config.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            searchPath: 'arka',
            // ssl: {
            //     require: false,
            //     rejectUnauthorized: false
            // }
        },
    });

    sequelize.authenticate()
        .then(() => console.log('Connection has been established successfully.'))
        .catch(err => console.error('Unable to connect to the database:', err));

    console.log('Initializing models...');

    // Initialize models
    initializeAPIKeyModel(sequelize);
    initializeSponsorshipPolicyModel(sequelize);
    initializeSponsorshipPolicyChainModel(sequelize);
    initializeSponsorshipPolicyLimitModel(sequelize);

    console.log('Initialized all models...');

    server.decorate('sequelize', sequelize);

    console.log('decorated fastify server with models...');

    server.addHook('onClose', (instance, done) => {
        instance.sequelize.close().then(() => done(), done);
    });

    console.log('added hooks...');
};

declare module "fastify" {
    interface FastifyInstance {
        sequelize: Sequelize;
    }
}

async function runQuery() {

    console.log('Running test query...');

    // Replace with your actual connection string
    const sequelize = new Sequelize('postgresql://arkauser:paymaster@localhost:5432/arkadev', {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            searchPath: 'arka',
        },
    });

    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Replace with your actual SQL query
        const result = await sequelize.query('SELECT * FROM arka.config', { type: QueryTypes.SELECT });
        console.log(result);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

export default fp(sequelizePlugin, { name: 'sequelizePlugin' });