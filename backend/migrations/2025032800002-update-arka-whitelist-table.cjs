require('dotenv').config();
const { DataTypes } = require('sequelize');

async function up({ context: queryInterface }) {
    await queryInterface.addColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'arka_whitelist'},
        'EP_VERSION',
        {
            type: DataTypes.STRING,
            allowNull: true
        }
    );
}

async function down({ context: queryInterface }) {
    await queryInterface.removeColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'arka_whitelist'},
        'EP_VERSION',
        {
            type: DataTypes.STRING,
            allowNull: true
        }
    );
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {up, down};
