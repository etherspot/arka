import { Sequelize, DataTypes, Model } from 'sequelize';

export class MultiTokenPaymaster extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public tokenAddress!: string;
    public oracleAddress!: string;
    public paymasterAddress!: string;
    public chainId!: number;
    public decimals!: string;
    public epVersion!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

const initializeMTPModel = (sequelize: Sequelize, schema: string) => {
  MultiTokenPaymaster.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            field: 'ID'
        },
        tokenAddress: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
          field: 'TOKEN_ADDRESS'
        },
        paymasterAddress: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'PAYMASTER_ADDRESS'
        },
        oracleAddress: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'ORACLE_ADDRESS'
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
        decimals: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'DECIMALS'
        },
        epVersion: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'EP_VERSION'
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
        tableName: 'multi_token_paymaster',
        modelName: 'MultiTokenPaymaster',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        freezeTableName: true,
        schema: schema,
    });
};

export { initializeMTPModel };