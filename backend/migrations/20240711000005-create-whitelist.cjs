const { Sequelize, DataTypes } = require('sequelize')

async function up({ context: queryInterface }) {
    await queryInterface.createTable('arka_whitelist', {
        "ID": {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        "API_KEY": {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.TEXT
        },
        "ADDRESSES": {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
        },
        "POLICY_ID": {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        "CREATED_AT": {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        "UPDATED_AT": {
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
        tableName: 'arka_whitelist',
        schema: process.env.DATABASE_SCHEMA_NAME
    });
}

module.exports = { up, down }
