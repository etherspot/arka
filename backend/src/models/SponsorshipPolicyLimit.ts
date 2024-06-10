import { Sequelize, DataTypes, Model } from 'sequelize';

export class SponsorshipPolicyLimit extends Model {
    declare policyId: number;
    declare limitType: string;
    declare maxUsd: number | null;
    declare maxEth: number | null;
    declare maxOperations: number | null;
}

export function initializeSponsorshipPolicyLimitModel(sequelize: Sequelize) {
    SponsorshipPolicyLimit.init({
        policyId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'SponsorshipPolicy', // name of your model for sponsorship policies
                key: 'id', // key in SponsorshipPolicy that policyId references
            },
            onDelete: 'CASCADE', // Add this line
            field: 'POLICY_ID'
        },
        limitType: {
            type: DataTypes.STRING, // Adjust this if limitType is not a string
            primaryKey: true,
            allowNull: false,
            field: 'LIMIT_TYPE'
        },
        // ... other fields ...
    }, {
        tableName: 'sponsorship_policy_limits',
        sequelize,
        timestamps: false,
    });
}