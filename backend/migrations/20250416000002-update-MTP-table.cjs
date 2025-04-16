require('dotenv').config();
const ethers = require('ethers');

async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`ALTER TABLE IF EXISTS "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ADD COLUMN "EP_VERSION" text default 'EPV_06'`);
}

async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(`ALTER TABLE "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster DROP COLUMN EP_VERSION;`);
}

module.exports = { up, down }