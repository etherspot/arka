require('dotenv').config();
const { DataTypes } = require('sequelize');

async function up({ context: queryInterface }) {
    await queryInterface.changeColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'sponsorship_policies'},
        'ENABLED_CHAINS',
        {
            type: DataTypes.ARRAY(DataTypes.BIGINT),
            allowNull: true
        }
    );

    await queryInterface.changeColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'contract_whitelist'},
        'CHAIN_ID',
        {
            type: DataTypes.BIGINT,
            allowNull: false
        }
    );
}

async function down({ context: queryInterface }) {
    await queryInterface.changeColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'sponsorship_policies'},
        'ENABLED_CHAINS',
        {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true
        }
    );

    await queryInterface.changeColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'contract_whitelist'},
        'CHAIN_ID',
        {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    );
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {up, down};
