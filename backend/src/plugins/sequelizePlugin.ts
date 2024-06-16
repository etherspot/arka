import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { initializeAPIKeyModel } from '../models/api-key.js';
import { initializeSponsorshipPolicyModel } from '../models/sponsorship-policy.js';
import { initializeArkaConfigModel } from "../models/arka-config.js";
import { APIKeyRepository } from "../repository/api-key-repository.js";
import { ArkaConfigRepository } from "../repository/arka-config-repository.js";
import { SponsorshipPolicyRepository } from "../repository/sponsorship-policy-repository.js";
const pg = await import('pg');
const Client = pg.default.Client;

dotenv.config();

const sequelizePlugin: FastifyPluginAsync = async (server) => {

    try {
        const client: InstanceType<typeof Client> = new Client({
            connectionString: server.config.DATABASE_URL
        });
        await client.connect();
        server.log.info('Connected to database');
    } catch (err) {
        console.error(err);
    }

    const sequelize = new Sequelize(server.config.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            searchPath: server.config.DATABASE_SCHEMA_NAME,
            // ssl: {
            //     require: false,
            //     rejectUnauthorized: false
            // }
        },
    });

    await sequelize.authenticate();
       
    server.log.info(`Initializing models... with schema name: ${server.config.DATABASE_SCHEMA_NAME}`);

    // Initialize models
    initializeArkaConfigModel(sequelize, server.config.DATABASE_SCHEMA_NAME);
    const initializedAPIKeyModel = initializeAPIKeyModel(sequelize, server.config.DATABASE_SCHEMA_NAME);
    //sequelize.models.APIKey = initializedAPIKeyModel;
    server.log.info(`Initialized APIKey model... ${sequelize.models.APIKey}`);
    initializeSponsorshipPolicyModel(sequelize, server.config.DATABASE_SCHEMA_NAME);
    server.log.info('Initialized SponsorshipPolicy model...');

    server.log.info('Initialized all models...');

    server.decorate('sequelize', sequelize);

    const apiKeyRepository : APIKeyRepository = new APIKeyRepository(sequelize);
    server.decorate('apiKeyRepository', apiKeyRepository);
    const arkaConfigRepository : ArkaConfigRepository = new ArkaConfigRepository(sequelize);
    server.decorate('arkaConfigRepository', arkaConfigRepository);
    const sponsorshipPolicyRepository = new SponsorshipPolicyRepository(sequelize);
    server.decorate('sponsorshipPolicyRepository', sponsorshipPolicyRepository);

    server.log.info('decorated fastify server with models...');

    server.addHook('onClose', (instance, done) => {
        instance.sequelize.close().then(() => done(), done);
    });

    server.log.info('added hooks...');
};

declare module "fastify" {
    interface FastifyInstance {
        sequelize: Sequelize;
        apiKeyRepository: APIKeyRepository;
        arkaConfigRepository: ArkaConfigRepository;
        sponsorshipPolicyRepository: SponsorshipPolicyRepository;
    }
}

export default fp(sequelizePlugin, { name: 'sequelizePlugin' });