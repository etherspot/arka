require('dotenv').config();
const ethers = require('ethers');

async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${ethers.utils.getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7')}', '0x5E6ce32Bb6Fa47001cf87f2f9E07d5Fd3dE57990', '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D', 1, 6, NOW(), NOW(), 'EPV_07')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${ethers.utils.getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')}', '0x5E6ce32Bb6Fa47001cf87f2f9E07d5Fd3dE57990', '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', 1, 6, NOW(), NOW(), 'EPV_07')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${ethers.utils.getAddress('0x514910771AF9Ca656af840dff83E8264EcF986CA')}', '0x5E6ce32Bb6Fa47001cf87f2f9E07d5Fd3dE57990', '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c', 1, 18, NOW(), NOW(), 'EPV_07')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${ethers.utils.getAddress('0xB8c77482e45F1F44dE1745F52C74426C631bDD52')}', '0x5E6ce32Bb6Fa47001cf87f2f9E07d5Fd3dE57990', '0x14e613AC84a31f709eadbdF89C6CC390fDc9540A', 1, 18, NOW(), NOW(), 'EPV_07')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${ethers.utils.getAddress('0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1')}', '0x5E6ce32Bb6Fa47001cf87f2f9E07d5Fd3dE57990', '0x31697852a68433DbCc2Ff612c516d69E3D9bd08F', 1, 18, NOW(), NOW(), 'EPV_07')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${ethers.utils.getAddress('0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF')}', '0x5E6ce32Bb6Fa47001cf87f2f9E07d5Fd3dE57990', '0xBAEbEFc1D023c0feCcc047Bff42E75F15Ff213E6', 1, 18, NOW(), NOW(), 'EPV_07')`);
  await queryInterface.sequelize.query(`INSERT INTO "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster ("TOKEN_ADDRESS", "PAYMASTER_ADDRESS", "ORACLE_ADDRESS", "CHAIN_ID", "DECIMALS", "CREATED_AT", "UPDATED_AT", "EP_VERSION") VALUES ('${ethers.utils.getAddress('0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0')}', '0x5E6ce32Bb6Fa47001cf87f2f9E07d5Fd3dE57990', '0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676', 1, 18, NOW(), NOW(), 'EPV_07')`);
}

async function down({ context: queryInterface }) {
    await queryInterface.sequelize.query(`DELETE IF EXISTS FROM "${process.env.DATABASE_SCHEMA_NAME}".multi_token_paymaster;`);
}

module.exports = { up, down }
