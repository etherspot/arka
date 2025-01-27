import { Sequelize, DataTypes, Model } from 'sequelize';

export class CoingeckoTokens extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public token!: string;
    public address!: string;
    public chainId!: number;
    public coinId!: string;
    public decimals!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

const initializeCoingeckoModel = (sequelize: Sequelize, schema: string) => {
  CoingeckoTokens.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            field: 'ID'
        },
        token: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
          field: 'TOKEN'
        },
        address: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'ADDRESS'
        },
        chainId: {
          type: DataTypes.BIGINT,
          allowNull: false,
          field: 'CHAIN_ID',
          get() {
            const value = this.getDataValue('chainId');
            return +value;
          }
        },
        coinId: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
          field: 'COIN_ID'
        },
        decimals: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'DECIMALS'
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
        tableName: 'coingecko_tokens',
        modelName: 'CoingeckoTokens',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        freezeTableName: true,
        schema: schema,
    });
};

export { initializeCoingeckoModel };