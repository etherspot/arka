import { Sequelize, DataTypes, Model } from 'sequelize';

export class SponsorshipPolicy extends Model {
    public id!: number;
    public walletAddress!: string;
    public name!: string;
    public description!: string | null;
    public startDate!: Date | null;
    public endDate!: Date | null;
    public isPerpetual!: boolean;
    public isUniversal!: boolean;
    public contractRestrictions!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export function initializeSponsorshipPolicyModel(sequelize: Sequelize, schema: string) {
    SponsorshipPolicy.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'ID'
        },
        walletAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'WALLET_ADDRESS',
            references: {
                model: 'api_keys', // This is the table name of the model being referenced
                key: 'wallet_address',  // This is the key column in the APIKey model
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'NAME'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'DESCRIPTION'
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'START_DATE'
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'END_DATE'
        },
        isPerpetual: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'IS_PERPETUAL'
        },
        isUniversal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'IS_UNIVERSAL'
        },
        contractRestrictions: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'CONTRACT_RESTRICTIONS'
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
        tableName: 'sponsorship_policies',
        modelName: 'SponsorshipPolicy',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        freezeTableName: true,
        schema: schema,
    });
}