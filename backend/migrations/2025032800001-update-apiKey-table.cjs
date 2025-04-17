require('dotenv').config();
const { DataTypes, TEXT } = require('sequelize');

async function up({ context: queryInterface }) {
    await queryInterface.addColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'api_keys'},
        'VERIFYING_PAYMASTERS_V3',
        {
            type: DataTypes.TEXT,
            allowNull: true
        }
    );
}

async function down({ context: queryInterface }) {
    await queryInterface.removeColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'api_keys'},
        'VERIFYING_PAYMASTERS_V3',
        {
            type: DataTypes.TEXT,
            allowNull: true
        }
    );
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {up, down};
