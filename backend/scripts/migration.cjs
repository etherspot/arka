const { Sequelize } = require('sequelize');
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// node backend/scripts/migration.cjs
async function runMigrations() {
    let sequelize;
    try {
        const DATABASE_URL = process.env.DATABASE_URL;
        const DATABASE_SCHEMA_NAME = process.env.DATABASE_SCHEMA_NAME;
        const DATABASE_SSL_ENABLED = (process.env.DATABASE_SSL_ENABLED || '').toLowerCase() === 'true';
        const DATABASE_SSL_REJECT_UNAUTHORIZED = (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || '').toLowerCase() === 'true';

        console.info(`Connecting to database... with URL:  ${DATABASE_URL} and schemaName: ${DATABASE_SCHEMA_NAME}`);

        const sequelizeOptions = {
            schema: DATABASE_SCHEMA_NAME,
        };

        if (DATABASE_SSL_ENABLED) {
            sequelizeOptions.dialectOptions = {
                ssl: {
                    require: DATABASE_SSL_ENABLED,
                    rejectUnauthorized: DATABASE_SSL_REJECT_UNAUTHORIZED
                }
            };
        }

        sequelize = new Sequelize(DATABASE_URL, sequelizeOptions);

        const migrationPath = path.join(__dirname, '../migrations/*.cjs');

        const umzug = new Umzug({
            migrations: { glob: migrationPath },
            context: sequelize.getQueryInterface(),
            storage: new SequelizeStorage({ sequelize }),
            logger: console,
        });

        console.info('Running migrations...');
        await umzug.up();
        console.info('Migrations done.');
        process.exit(0); // Exit with a "success" code
    } catch (err) {
        console.error('Migration failed:', err);
        process.exitCode = 1;
    } finally {
        console.info('Closing database connection...');
        if (sequelize) {
            await sequelize.close();
            console.info('Database connection closed.');
        }
        process.exit(process.exitCode || 0);
    }
}

runMigrations();