require('dotenv').config();

async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`ALTER TABLE IF EXISTS "${process.env.DATABASE_SCHEMA_NAME}".api_keys ADD COLUMN "CONTRACT_WHITELIST_MODE" text default false`);
}

async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(`ALTER TABLE "${process.env.DATABASE_SCHEMA_NAME}".api_keys DROP COLUMN CONTRACT_WHITELIST_MODE;`);
}

module.exports = { up, down }