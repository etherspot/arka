const { Sequelize } = require('sequelize')

async function up({ context: queryInterface }) {
  await queryInterface.createTable('sponsorship_policy_chains', {
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
    chainId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'CHAIN_ID'
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
    tableName: 'sponsorship_policy_chains',
    schema: process.env.DATABASE_SCHEMA_NAME
  });
}

module.exports = { up, down }
