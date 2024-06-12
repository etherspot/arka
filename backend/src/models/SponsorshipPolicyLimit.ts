import { Sequelize, DataTypes, Model } from 'sequelize';

export class SponsorshipPolicyLimit extends Model {
    public policyId!: number;
    public limitType!: string;
    public maxUsd!: number | null;
    public maxEth!: number | null;
    public maxOperations!: number | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeSponsorshipPolicyLimitModel(sequelize: Sequelize, schema: string) {
    SponsorshipPolicyLimit.init({
        policyId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {
                model: 'SponsorshipPolicy', // name of your model for sponsorship policies
                key: 'id', // key in SponsorshipPolicy that policyId references
            },
            onDelete: 'CASCADE',
            field: 'POLICY_ID'
        },
        limitType: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            field: 'LIMIT_TYPE'
        },
        maxUsd: {
            type: DataTypes.FLOAT,
            allowNull: true,
            field: 'MAX_USD'
        },
        maxEth: {
            type: DataTypes.FLOAT,
            allowNull: true,
            field: 'MAX_ETH'
        },
        maxOperations: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'MAX_OPERATIONS'
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
        tableName: 'sponsorship_policy_limits',
        modelName: 'SponsorshipPolicyLimit',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        freezeTableName: true,
        schema: schema,
    });
}