const { Sequelize } = require('sequelize')

async function up({ context: queryInterface }) {
    await queryInterface.createTable('sponsorship_policies', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            field: 'ID'
        },
        walletAddress: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'WALLET_ADDRESS',
            references: {
                model: 'api_keys',
                key: 'WALLET_ADDRESS'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'NAME'
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'DESCRIPTION'
        },
        enabledChains: {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
            allowNull: true,
            field: 'ENABLED_CHAINS'
        },
        startDate: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'START_DATE'
        },
        endDate: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'END_DATE'
        },
        isPerpetual: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'IS_PERPETUAL'
        },
        isUniversal: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'IS_UNIVERSAL'
        },
        contractRestrictions: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'CONTRACT_RESTRICTIONS'
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
        }
    }, {
        schema: process.env.DATABASE_SCHEMA_NAME
    });
}

async function down({ context: queryInterface }) {
    await queryInterface.dropTable({
        tableName: 'sponsorship_policies',
        schema: process.env.DATABASE_SCHEMA_NAME
    });
}

module.exports = { up, down }
