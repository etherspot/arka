/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Sequelize, DataTypes, Model } from 'sequelize';

export class SponsorshipPolicy extends Model {
    public id!: number;
    public walletAddress!: string;
    public name!: string;
    public description!: string | null;
    public isPublic: boolean = false;
    public isEnabled: boolean = false;
    public isApplicableToAllNetworks!: boolean;
    public enabledChains?: number[];
    public supportedEPVersions: string[] | null = null;
    public isPerpetual: boolean = false;
    public startTime: Date | null = null;
    public endTime: Date | null = null;
    public globalMaximumApplicable: boolean = false;
    public globalMaximumUsd: number | null = null;
    public globalMaximumNative: number | null = null;
    public globalMaximumOpCount: number | null = null;
    public perUserMaximumApplicable: boolean = false;
    public perUserMaximumUsd: number | null = null;
    public perUserMaximumNative: number | null = null;
    public perUserMaximumOpCount: number | null = null;
    public perOpMaximumApplicable: boolean = false;
    public perOpMaximumUsd: number | null = null;
    public perOpMaximumNative: number | null = null;
    public addressAllowList: string[] | null = null;
    public addressBlockList: string[] | null = null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public get isExpired(): boolean {
        if (this.isPerpetual) {
            return false;
        }
        const currentTime = new Date();

        return Boolean(this.endTime && this.endTime.getTime() <= currentTime.getTime());
    }

    public get isCurrent(): boolean {
        const now = new Date();
        if (this.isPerpetual) {
            return true;
        }
        
        // If there is no start time, the policy is not current
        if (!this.startTime) {
            return false;
        }

        if (this.startTime && this.endTime) {
            const currentTime = new Date();
            const startTime = new Date(this.startTime + 'Z');
            const endTime = new Date(this.endTime + 'Z');
            if (startTime.getTime() > currentTime.getTime() || endTime.getTime() <= currentTime.getTime() || endTime.getTime() <= startTime.getTime()){
                return false;
            }
        }

        return true;
    }

    public get isApplicable(): boolean {
        return this.isEnabled && !this.isExpired && this.isCurrent;
    }
}

export function initializeSponsorshipPolicyModel(sequelize: Sequelize, schema: string) {
    SponsorshipPolicy.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'ID'
        },
        walletAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'WALLET_ADDRESS',
            references: {
                model: 'api_keys', // This is the table name of the model being referenced
                key: 'WALLET_ADDRESS',  // This is the key column in the APIKey model
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'NAME'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'DESCRIPTION'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'IS_PUBLIC'
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'IS_ENABLED'
        },
        isApplicableToAllNetworks: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'IS_APPLICABLE_TO_ALL_NETWORKS'
        },
        enabledChains: {
            type: DataTypes.ARRAY(DataTypes.BIGINT),
            allowNull: true,
            field: 'ENABLED_CHAINS',
            get() {
                const value = this.getDataValue('enabledChains');
                return value?.map((item: any) => +item);
            }
        },
        supportedEPVersions: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            field: 'SUPPORTED_EP_VERSIONS',
        },
        isPerpetual: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'IS_PERPETUAL'
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'START_TIME'
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'END_TIME'
        },
        globalMaximumApplicable: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'GLOBAL_MAX_APPLICABLE'
        },
        globalMaximumUsd: {
            type: DataTypes.DECIMAL(10, 4),  // max 10 digits, 4 of which can be after the decimal point
            allowNull: true,
            field: 'GLOBAL_MAX_USD',
            get() {
                const value = this.getDataValue('globalMaximumUsd');
                return value ? Number(value) : null;
            },
        },
        globalMaximumNative: {
            type: DataTypes.DECIMAL(22, 18),  // max 22 digits, 18 of which can be after the decimal point
            allowNull: true,
            field: 'GLOBAL_MAX_NATIVE'
        },
        globalMaximumOpCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'GLOBAL_MAX_OP_COUNT'
        },
        perUserMaximumApplicable: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'PER_USER_MAX_APPLICABLE'
        },
        perUserMaximumUsd: {
            type: DataTypes.DECIMAL(10, 4),  // max 10 digits, 4 of which can be after the decimal point
            allowNull: true,
            field: 'PER_USER_MAX_USD'
        },
        perUserMaximumNative: {
            type: DataTypes.DECIMAL(22, 18),  // max 22 digits, 18 of which can be after the decimal point
            allowNull: true,
            field: 'PER_USER_MAX_NATIVE'
        },
        perUserMaximumOpCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'PER_USER_MAX_OP_COUNT'
        },
        perOpMaximumApplicable: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'PER_OP_MAX_APPLICABLE'
        },
        perOpMaximumUsd: {
            type: DataTypes.DECIMAL(10, 4),  // max 10 digits, 4 of which can be after the decimal point
            allowNull: true,
            field: 'PER_OP_MAX_USD'
        },
        perOpMaximumNative: {
            type: DataTypes.DECIMAL(22, 18),  // max 22 digits, 18 of which can be after the decimal point
            allowNull: true,
            field: 'PER_OP_MAX_NATIVE'
        },
        addressAllowList: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            field: 'ADDRESS_ALLOW_LIST'
        },
        addressBlockList: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            field: 'ADDRESS_BLOCK_LIST'
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