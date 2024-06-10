import { Sequelize, DataTypes, Model } from 'sequelize';

export class SponsorshipPolicyChain extends Model {
    declare policyChainId: number;
    declare policyId: number;
    declare chainName: string;
}

export function initializeSponsorshipPolicyChainModel(sequelize: Sequelize) {
    SponsorshipPolicyChain.init({
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
        tableName: 'sponsorship_policy_chains',
        sequelize,
        timestamps: false,
    });
}