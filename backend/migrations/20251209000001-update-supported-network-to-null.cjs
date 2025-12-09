require('dotenv').config();

async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    `UPDATE ${process.env.DATABASE_SCHEMA_NAME}."api_keys" SET "SUPPORTED_NETWORKS" = NULL`
  );
}

module.exports = { up };
