const { Sequelize } = require('sequelize')

async function up({ context: queryInterface }) {
    await queryInterface.createTable('arka_config', {
        ID: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        DEPLOYED_ERC20_PAYMASTERS: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        PYTH_MAINNET_URL: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        PYTH_TESTNET_URL: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        PYTH_TESTNET_CHAIN_IDS: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        PYTH_MAINNET_CHAIN_IDS: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        CRON_TIME: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        CUSTOM_CHAINLINK_DEPLOYED: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        COINGECKO_IDS: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        COINGECKO_API_URL: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        CREATED_AT: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        UPDATED_AT: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
        schema: process.env.DATABASE_SCHEMA_NAME
    });
}
async function down({ context: queryInterface }) {
    await queryInterface.dropTable({
        tableName: 'arka_config',
        schema: process.env.DATABASE_SCHEMA_NAME
    })
}

module.exports = { up, down }
