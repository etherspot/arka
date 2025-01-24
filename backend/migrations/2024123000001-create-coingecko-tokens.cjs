const { Sequelize } = require('sequelize')

async function up({ context: queryInterface }) {
    await queryInterface.createTable('coingecko_tokens', {
        "ID": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "TOKEN": {
            allowNull: false,
            primaryKey: false,
            type: Sequelize.TEXT
        },
        "ADDRESS": {
            type: Sequelize.STRING,
            allowNull: false
        },
        "CHAIN_ID": {
            type: Sequelize.BIGINT,
            allowNull: false
        },
        "COIN_ID": {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        "DECIMALS": {
            type: Sequelize.INTEGER,
            allowNull: false,
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
        tableName: 'coingecko_tokens',
        schema: process.env.DATABASE_SCHEMA_NAME
    });
}

module.exports = { up, down }
