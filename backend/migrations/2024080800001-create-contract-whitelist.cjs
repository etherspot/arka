const { Sequelize } = require('sequelize')

async function up({ context: queryInterface }) {
  await queryInterface.createTable('contract_whitelist', {
    ID: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    WALLET_ADDRESS: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    CONTRACT_ADDRESS: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    FUNCTION_SELECTORS: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
    },
    ABI: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    CHAIN_ID: {
      type: Sequelize.INTEGER,
      allowNull: false,
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
    }
  }, {
    schema: process.env.DATABASE_SCHEMA_NAME
  });
}
async function down({ context: queryInterface }) {
  await queryInterface.dropTable({
    tableName: 'contract_whitelist',
    schema: process.env.DATABASE_SCHEMA_NAME
  })
}

module.exports = { up, down }