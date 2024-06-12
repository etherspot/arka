import { Sequelize, DataTypes, Model } from 'sequelize';

export class SponsorshipPolicyChain extends Model {
    public policyId!: number;
    public chainId!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeSponsorshipPolicyChainModel(sequelize: Sequelize, schema: string) {
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
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'CREATED_AT'
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'UPDATED_AT'
        },
    }, {
        sequelize,
        tableName: 'sponsorship_policy_chains',
        modelName: 'SponsorshipPolicyChain',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        freezeTableName: true,
        schema: schema,
    });
}