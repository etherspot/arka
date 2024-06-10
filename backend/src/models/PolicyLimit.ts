import { Sequelize, DataTypes, Model } from 'sequelize';

export class PolicyLimit extends Model {
    declare limitId: number;
    declare policyId: number;
    declare limitType: string;
    declare maxUsd: number | null;
    declare maxEth: number | null;
    declare maxOperations: number | null;
}

export function initializePolicyLimitModel(sequelize: Sequelize) {
    PolicyLimit.init({
        limitId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'LIMIT_ID'
        },
        policyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'POLICY_ID'
        },
        limitType: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'LIMIT_TYPE'
        },
        maxUsd: {
            type: DataTypes.REAL,
            allowNull: true,
            field: 'MAX_USD'
        },
        maxEth: {
            type: DataTypes.REAL,
            allowNull: true,
            field: 'MAX_ETH'
        },
        maxOperations: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MAX_OPERATIONS'
        },
    }, {
        tableName: 'policy_limits',
        sequelize,
        timestamps: false,
    });
}