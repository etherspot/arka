import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import { APIKey, initializeAPIKeyModel } from '../models/APIKey';  // Assuming path correctness
import { initializeSponsorshipPolicyModel } from '../models/SponsorshipPolicy';
import { initializeSponsorshipPolicyChainModel } from '../models/SponsorshipPolicyChain';
import { initializeSponsorshipPolicyLimitModel } from "../models/SponsorshipPolicyLimit";
import { initializeConfigModel } from "../models/Config";
import { APIKeyRepository } from "repository/APIKeyRepository";
import { ConfigRepository } from "repository/ConfigRepository";
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

    await sequelize.authenticate();
       
    console.log(`Initializing models... with schema name: ${server.config.DATABASE_SCHEMA_NAME}`);

    // Initialize models
    initializeConfigModel(sequelize, server.config.DATABASE_SCHEMA_NAME);
    const initializedAPIKeyModel = initializeAPIKeyModel(sequelize, server.config.DATABASE_SCHEMA_NAME);
    sequelize.models.APIKey = initializedAPIKeyModel;
    console.log(`Initialized APIKey model... ${sequelize.models.APIKey}`);
    initializeSponsorshipPolicyModel(sequelize, server.config.DATABASE_SCHEMA_NAME);
    initializeSponsorshipPolicyChainModel(sequelize, server.config.DATABASE_SCHEMA_NAME);
    initializeSponsorshipPolicyLimitModel(sequelize, server.config.DATABASE_SCHEMA_NAME);

    console.log('Initialized all models...');

    server.decorate('sequelize', sequelize);

    const apiKeyRepository : APIKeyRepository = new APIKeyRepository(sequelize);
    server.decorate('apiKeyRepository', apiKeyRepository);
    const configRepository : ConfigRepository = new ConfigRepository(sequelize);
    server.decorate('configRepository', configRepository);

    console.log('decorated fastify server with models...');

    server.addHook('onClose', (instance, done) => {
        instance.sequelize.close().then(() => done(), done);
    });

    console.log('added hooks...');
};

declare module "fastify" {
    interface FastifyInstance {
        sequelize: Sequelize;
        apiKeyRepository: APIKeyRepository;
        configRepository: ConfigRepository;
    }
}

export default fp(sequelizePlugin, { name: 'sequelizePlugin' });