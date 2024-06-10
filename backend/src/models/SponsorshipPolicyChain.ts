import { Sequelize, DataTypes, Model } from 'sequelize';

export class SponsorshipPolicyChain extends Model {
    declare policyId: number;
    declare chainId: number;
}

export function initializeSponsorshipPolicyChainModel(sequelize: Sequelize) {
    SponsorshipPolicyChain.init({
        policyId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            field: 'POLICY_ID'
        },
        chainId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            field: 'CHAIN_ID'
        },
    }, {
        tableName: 'sponsorship_policy_chains',
        sequelize,
        timestamps: false,
    });
}