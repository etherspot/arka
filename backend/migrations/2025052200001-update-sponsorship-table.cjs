require('dotenv').config();
const { DataTypes } = require('sequelize');

async function up({ context: queryInterface }) {
  await queryInterface.removeColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'sponsorship_policies'},
        'IS_PUBLIC',
        {
            type: DataTypes.TEXT,
            allowNull: true
        }
    );
}

async function down({ context: queryInterface }) {
    await queryInterface.addColumn(
        {schema: process.env.DATABASE_SCHEMA_NAME, tableName: 'sponsorship_policies'},
        'IS_PUBLIC',
        {
            type: DataTypes.TEXT,
            allowNull: true
        }
    );
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {up, down};
