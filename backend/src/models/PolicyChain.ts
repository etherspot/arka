import { Sequelize, DataTypes, Model } from 'sequelize';

export class PolicyChain extends Model {
    declare policyChainId: number;
    declare policyId: number;
    declare chainName: string;
}

export function initializePolicyChainModel(sequelize: Sequelize) {
    PolicyChain.init({
        policyChainId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'POLICY_CHAIN_ID'
        },
        policyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'POLICY_ID'
        },
        chainName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'CHAIN_NAME'
        },
    }, {
        tableName: 'policy_chains',
        sequelize,
        timestamps: false,
    });
}