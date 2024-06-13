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
        isPublic: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'IS_PUBLIC'
        },
        isEnabled: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'IS_ENABLED'
        },
        isUniversal: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'IS_UNIVERSAL'
        },
        enabledChains: {
            type: Sequelize.ARRAY(Sequelize.INTEGER),
            allowNull: true,
            field: 'ENABLED_CHAINS'
        },
        isPerpetual: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'IS_PERPETUAL'
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
        globalMaxApplicable: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'GLOBAL_MAX_APPLICABLE'
        },
        globalMaximumUsd: {
            type: Sequelize.DECIMAL(10, 4),  // max 10 digits, 4 of which can be after the decimal point
            allowNull: true,
            field: 'GLOBAL_MAX_USD'
        },
        globalMaximumNative: {
            type: Sequelize.DECIMAL(22, 18),  // max 22 digits, 18 of which can be after the decimal point
            allowNull: true,
            field: 'GLOBAL_MAX_NATIVE'
        },
        globalMaximumOpCount: {
            type: Sequelize.INTEGER,
            allowNull: true,
            field: 'GLOBAL_MAX_OP_COUNT'
        },
        perUserMaxApplicable: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'PER_USER_MAX_APPLICABLE'
        },
        perUserMaximumUsd: {
            type: Sequelize.DECIMAL(10, 4),  // max 10 digits, 4 of which can be after the decimal point
            allowNull: true,
            field: 'PER_USER_MAX_USD'
        },
        perUserMaximumNative: {
            type: Sequelize.DECIMAL(22, 18),  // max 22 digits, 18 of which can be after the decimal point
            allowNull: true,
            field: 'PER_USER_MAX_NATIVE'
        },
        perUserMaximumOpCount: {
            type: Sequelize.INTEGER,
            allowNull: true,
            field: 'PER_USER_MAX_OP_COUNT'
        },
        perOpMaxApplicable: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'PER_OP_MAX_APPLICABLE'
        },
        perOpMaximumUsd: {
            type: Sequelize.DECIMAL(10, 4),  // max 10 digits, 4 of which can be after the decimal point
            allowNull: true,
            field: 'PER_OP_MAX_USD'
        },
        perOpMaximumNative: {
            type: Sequelize.DECIMAL(22, 18),  // max 22 digits, 18 of which can be after the decimal point
            allowNull: true,
            field: 'PER_OP_MAX_NATIVE'
        },
        addressAllowList: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: true,
            field: 'ADDRESS_ALLOW_LIST'
        },
        addressBlockList: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: true,
            field: 'ADDRESS_BLOCK_LIST'
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
