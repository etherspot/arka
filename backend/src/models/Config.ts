import { Sequelize, DataTypes, Model } from 'sequelize';

export class Config extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public deployedErc20Paymasters!: string;
    public pythMainnetUrl!: string;
    public pythTestnetUrl!: string;
    public pythTestnetChainIds!: string;
    public pythMainnetChainIds!: string;
    public cronTime!: string;
    public customChainlinkDeployed!: string;
    public coingeckoIds!: string;
    public coingeckoApiUrl!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

const initializeConfigModel = (sequelize: Sequelize, schema: string) => {
    Config.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            field: 'ID'
        },
        deployedErc20Paymasters: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'DEPLOYED_ERC20_PAYMASTERS'
        },
        pythMainnetUrl: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'PYTH_MAINNET_URL'
        },
        pythTestnetUrl: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'PYTH_TESTNET_URL'
        },
        pythTestnetChainIds: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'PYTH_TESTNET_CHAIN_IDS'
        },
        pythMainnetChainIds: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'PYTH_MAINNET_CHAIN_IDS'
        },
        cronTime: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'CRON_TIME'
        },
        customChainlinkDeployed: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'CUSTOM_CHAINLINK_DEPLOYED'
        },
        coingeckoIds: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'COINGECKO_IDS'
        },
        coingeckoApiUrl: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'COINGECKO_API_URL'
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
        tableName: 'config',
        modelName: 'Config',
        timestamps: true,
        // createdAt: 'createdAt',
        // updatedAt: 'updatedAt',
        freezeTableName: true,
        schema: schema,
    });
};

export { initializeConfigModel };