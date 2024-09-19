require('dotenv').config();

async function up({ context: queryInterface }) {
    await queryInterface.sequelize.query(`UPDATE "${process.env.DATABASE_SCHEMA_NAME}".api_keys SET "BUNDLER_API_KEY"='${process.env.DEFAULT_BUNDLER_API_KEY}' WHERE "API_KEY"='${process.env.DEFAULT_API_KEY}';`);
}
  
async function down({ context: queryInterface }) {
    await queryInterface.sequelize.query(`UPDATE "${process.env.DATABASE_SCHEMA_NAME}".api_keys SET "BUNDLER_API_KEY"=NULL WHERE "API_KEY"='${process.env.DEFAULT_API_KEY}';`);
}
  
module.exports = { up, down }