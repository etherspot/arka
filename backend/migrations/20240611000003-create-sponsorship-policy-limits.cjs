const { Sequelize } = require('sequelize')

async function up({ context: queryInterface }) {
  await queryInterface.createTable('sponsorship_policy_limits', {
    policyId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'POLICY_ID',
      references: {
        model: 'sponsorship_policies',
        key: 'ID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    limitType: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
      field: 'LIMIT_TYPE'
    },
    maxUsd: {
      type: Sequelize.DECIMAL(10, 4),  // max 10 digits, 4 of which can be after the decimal point
      allowNull: true,
      field: 'MAX_USD'
    },
    maxEth: {
      type: Sequelize.DECIMAL(22, 18),  // max 22 digits, 18 of which can be after the decimal point
      allowNull: true,
      field: 'MAX_ETH'
    },
    maxOperations: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'MAX_OPERATIONS'
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      field: 'CREATED_AT'
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      field: 'UPDATED_AT'
    },
  }, {
    schema: process.env.DATABASE_SCHEMA_NAME
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.dropTable({
    tableName: 'sponsorship_policy_limits',
    schema: process.env.DATABASE_SCHEMA_NAME
  });
}

module.exports = { up, down }
