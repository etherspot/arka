import { Sequelize, DataTypes, Model } from 'sequelize';

export class APIKey extends Model {
  public apiKey!: string;
  public walletAddress!: string;
  public privateKey!: string;
  public supportedNetworks?: string | null;
  public erc20Paymasters?: string | null;
  public erc20PaymastersV2?: string | null;
  public verifyingPaymasters?: string | null;
  public verifyingPaymastersV2?: string | null;
  public verifyingPaymastersV3?: string | null;
  public multiTokenPaymasters?: string | null;
  public multiTokenPaymastersV2?: string | null;
  public multiTokenOracles?: string | null;
  public sponsorName?: string | null;
  public logoUrl?: string | null;
  public bundlerApiKey?: string | null;
  public transactionLimit!: number;
  public noOfTransactionsInAMonth?: number | null;
  public indexerEndpoint?: string | null;
  public contractWhitelistMode?: boolean | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initializeAPIKeyModel(sequelize: Sequelize, schema: string) {
  const initializedAPIKeyModel = APIKey.init({
    apiKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
      field: 'API_KEY'
    },
    walletAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: 'WALLET_ADDRESS'
    },
    privateKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'PRIVATE_KEY'
    },
    supportedNetworks: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'SUPPORTED_NETWORKS'
    },
    erc20Paymasters: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ERC20_PAYMASTERS'
    },
    erc20PaymastersV2: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ERC20_PAYMASTERS_V2'
    },
    verifyingPaymasters: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'VERIFYING_PAYMASTERS'
    },
    verifyingPaymastersV2: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'VERIFYING_PAYMASTERS_V2'
    },
    verifyingPaymastersV3: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'VERIFYING_PAYMASTERS_V3'
    },
    bundlerApiKey: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'BUNDLER_API_KEY',
      defaultValue: null
    },
    multiTokenPaymasters: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'MULTI_TOKEN_PAYMASTERS'
    },
    multiTokenPaymastersV2: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'MULTI_TOKEN_PAYMASTERS_V2'
    },
    multiTokenOracles: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'MULTI_TOKEN_ORACLES'
    },
    sponsorName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'SPONSOR_NAME'
    },
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'LOGO_URL'
    },
    transactionLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'TRANSACTION_LIMIT'
    },
    noOfTransactionsInAMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'NO_OF_TRANSACTIONS_IN_A_MONTH'
    },
    indexerEndpoint: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'INDEXER_ENDPOINT'
    },
    contractWhitelistMode: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'CONTRACT_WHITELIST_MODE'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'CREATED_AT'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'UPDATED_AT'
    },
  }, {
    tableName: 'api_keys',
    sequelize, // passing the `sequelize` instance is required
    modelName: 'APIKey',
    timestamps: true, // enabling timestamps
    createdAt: 'createdAt', // mapping 'createdAt' to 'CREATED_AT'
    updatedAt: 'updatedAt', // mapping 'updatedAt' to 'UPDATED_AT'
    freezeTableName: true,
    schema: schema,
  });

  return initializedAPIKeyModel;
}