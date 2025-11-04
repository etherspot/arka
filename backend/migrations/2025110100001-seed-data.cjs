require('dotenv').config();
const viem = require('viem');

async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${viem.getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85')}', '0x6Ad5796A4B5385bB3A1573C56115BF292Fb78d2F', '0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3', 10, 6, NOW(), NOW(), 'EPV_08')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${viem.getAddress('0x94b008aA00579c1307B0EF2c499aD98a8ce58e58')}', '0x6Ad5796A4B5385bB3A1573C56115BF292Fb78d2F', '0xECef79E109e997bCA29c1c0897ec9d7b03647F5E', 10, 6, NOW(), NOW(), 'EPV_08')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${viem.getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')}', '0x6Ad5796A4B5385bB3A1573C56115BF292Fb78d2F', '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', 1, 6, NOW(), NOW(), 'EPV_08')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${viem.getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7')}', '0x6Ad5796A4B5385bB3A1573C56115BF292Fb78d2F', '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D', 1, 6, NOW(), NOW(), 'EPV_08')`);
}

async function down({ context: queryInterface }) {
    await queryInterface.sequelize.query(`DELETE IF EXISTS FROM "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster;`);
}

module.exports = { up, down }
