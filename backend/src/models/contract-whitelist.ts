import { Sequelize, DataTypes, Model } from 'sequelize';

export class ContractWhitelist extends Model {
  public id!: number;
  public walletAddress!: string;
  public contractAddress!: string;
  public functionSelectors!: string[];
  public abi!: string;
  public chainId!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initializeContractWhitelistModel(sequelize: Sequelize, schema: string) {
  const initializedContractWhitelistModel = ContractWhitelist.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'ID'
    },
    walletAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'WALLET_ADDRESS'
    },
    contractAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'CONTRACT_ADDRESS'
    },
    functionSelectors: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      field: 'FUNCTION_SELECTORS'
    },
    abi: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'ABI'
    },
    chainId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'CHAIN_ID'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'CREATED_AT',
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'UPDATED_AT',
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'contract_whitelist',
    sequelize, // passing the `sequelize` instance is required
    modelName: '',
    timestamps: true, // enabling timestamps
    createdAt: 'createdAt', // mapping 'createdAt' to 'CREATED_AT'
    updatedAt: 'updatedAt', // mapping 'updatedAt' to 'UPDATED_AT'
    freezeTableName: true,
    schema: schema,
  });

  return initializedContractWhitelistModel;
}