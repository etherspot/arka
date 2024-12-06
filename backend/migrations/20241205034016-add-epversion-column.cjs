require('dotenv').config();
const { DataTypes, TEXT } = require('sequelize');

async function up({ context: queryInterface }) {
    await queryInterface.addColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'arka_whitelist'},
        'EP_VERSION',
        {
            type: DataTypes.STRING,
            allowNull: true
        }
    );

    await queryInterface.sequelize.query(
        `UPDATE "${process.env.DATABASE_SCHEMA_NAME}".arka_whitelist SET "EP_VERSION"='EPV_07'`
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
