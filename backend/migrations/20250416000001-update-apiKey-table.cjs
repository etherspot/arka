require('dotenv').config();

async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`ALTER TABLE IF EXISTS "${process.env.DATABASE_SCHEMA_NAME}".api_keys ADD COLUMN "MULTI_TOKEN_PAYMASTERS_V2" text default null`);
}

async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(`ALTER TABLE IF EXISTS "${process.env.DATABASE_SCHEMA_NAME}".api_keys DROP COLUMN MULTI_TOKEN_PAYMASTERS_V2;`);
}

module.exports = { up, down }