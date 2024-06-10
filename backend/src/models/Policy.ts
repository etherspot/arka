import { Sequelize, DataTypes, Model } from 'sequelize';

export class Policy extends Model {
    declare policyId: number;
    declare walletAddress: string;
    declare name: string;
    declare description: string | null;
    declare startDate: Date | null;
    declare endDate: Date | null;
    declare isPerpetual: boolean;
    declare isUniversal: boolean;
    declare contractRestrictions: string | null;
}

export function initializePolicyModel(sequelize: Sequelize) {
    Policy.init({
        policyId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'POLICY_ID'
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
    }, {
        tableName: 'policies',
        sequelize,
        timestamps: false,
    });
}