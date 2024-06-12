require('dotenv').config();

async function up({ context: queryInterface }) {
    await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".config ("DEPLOYED_ERC20_PAYMASTERS", "PYTH_MAINNET_URL", "PYTH_TESTNET_URL", "PYTH_TESTNET_CHAIN_IDS", "PYTH_MAINNET_CHAIN_IDS", "CRON_TIME", "CUSTOM_CHAINLINK_DEPLOYED", "COINGECKO_IDS", "COINGECKO_API_URL", "CREATED_AT", "UPDATED_AT") VALUES ('ewogICAgIjQyM...', 'https://hermes.pyth.network/api/latest_vaas?ids%5B%5D=', 'https://hermes-beta.pyth.network/api/latest_vaas?ids%5B%5D=', '5001', '5000', '0 0 * * *', 'ewogICAgIjgwMDAxIjogWyIweGMzM2MzOEE3QkZFQmJCOTk3ZEQ0MDExQ0RkQWY0ZWJEMWU4ODAzQzAiXQp9', 'eyI4MDAwMSI6WyJwYW50aGVyIl19', 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&precision=8&ids=', NOW(), NOW());`);
}

async function down({ context: queryInterface }) {
    await queryInterface.sequelize.query(`DELETE FROM "${process.env.DATABASE_SCHEMA_NAME}".config;`);
}

module.exports = { up, down }