require('dotenv').config();
const publicKey = 'etherspot_public_key';
const oldPublicKey = 'arka_public_key';
async function up({ context: queryInterface }) {
    await queryInterface.sequelize.query(
        `UPDATE ${process.env.DATABASE_SCHEMA_NAME}."api_keys" SET "API_KEY"='${publicKey}' WHERE "API_KEY"='${oldPublicKey}'` 
    );
    await queryInterface.sequelize.query(
        `UPDATE ${process.env.DATABASE_SCHEMA_NAME}."arka_whitelist" SET "API_KEY"='${publicKey}' WHERE "API_KEY"='${oldPublicKey}'`
    );
}
async function down({ context: queryInterface }) {
    await queryInterface.sequelize.query(
        `UPDATE ${process.env.DATABASE_SCHEMA_NAME}."api_keys" SET "API_KEY"='${oldPublicKey}' WHERE "API_KEY"='${publicKey}'`
    )
    await queryInterface.sequelize.query(
        `UPDATE ${process.env.DATABASE_SCHEMA_NAME}."arka_whitelist" SET "API_KEY"='${oldPublicKey}' WHERE "API_KEY"='${publicKey}'`
    )
}
module.exports = {up, down};