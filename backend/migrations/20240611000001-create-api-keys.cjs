const { Sequelize } = require('sequelize')

async function up({ context: queryInterface }) {
    await queryInterface.createTable('api_keys', {
        "API_KEY": {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.TEXT
        },
        "WALLET_ADDRESS": {
            type: Sequelize.TEXT,
            allowNull: false,
            unique: true,
        },
        "PRIVATE_KEY": {
            type: Sequelize.STRING,
            allowNull: false,
        },
        "SUPPORTED_NETWORKS": {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        "ERC20_PAYMASTERS": {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        "MULTI_TOKEN_PAYMASTERS": {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        "MULTI_TOKEN_ORACLES": {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        "SPONSOR_NAME": {
            type: Sequelize.STRING,
            allowNull: true,
        },
        "LOGO_URL": {
            type: Sequelize.STRING,
            allowNull: true,
        },
        "TRANSACTION_LIMIT": {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        "NO_OF_TRANSACTIONS_IN_A_MONTH": {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        "INDEXER_ENDPOINT": {
            type: Sequelize.STRING,
            allowNull: true,
        },
        "CREATED_AT": {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        "UPDATED_AT": {
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
        tableName: 'api_keys',
        schema: process.env.DATABASE_SCHEMA_NAME
    });
}

module.exports = { up, down }
