const { Sequelize } = require('sequelize')

async function up({ context: queryInterface }) {
  await queryInterface.createTable('multi_token_paymaster', {
    ID: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    TOKEN_ADDRESS: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    },
    PAYMASTER_ADDRESS: {
      type: Sequelize.STRING,
      allowNull: false
    },
    ORACLE_ADDRESS: {
      type: Sequelize.STRING,
      allowNull: true
    },
    CHAIN_ID: {
      type: Sequelize.BIGINT,
      allowNull: false,
      get() {
        const value = this.getDataValue('chainId');
        return +value;
      }
    },
    DECIMALS: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    CREATED_AT: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    UPDATED_AT: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
  }, {
    schema: process.env.DATABASE_SCHEMA_NAME
  });
}
async function down({ context: queryInterface }) {
  await queryInterface.dropTable({
    tableName: 'multi_token_paymaster',
    schema: process.env.DATABASE_SCHEMA_NAME
  })
}

module.exports = { up, down }