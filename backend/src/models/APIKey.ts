import { Sequelize, DataTypes, Model } from 'sequelize';

export class APIKey extends Model {
  declare apiKey: string;
  declare walletAddress: string;
  declare privateKey: string;
  declare supportedNetworks: string | null;
  declare erc20Paymasters: string | null;
  declare multiTokenPaymasters: string | null;
  declare multiTokenOracles: string | null;
  declare sponsorName: string | null;
  declare logoUrl: string | null;
  declare transactionLimit: number;
  declare noOfTransactionsInAMonth: number | null;
  declare indexerEndpoint: string | null;
  declare createdAt: Date; // Added this line
  declare updatedAt: Date; // Added this line
}

export function initializeAPIKeyModel(sequelize: Sequelize, schema: string) {

  console.log('Initializing APIKey model...')

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
      type: DataTypes.STRING,
      allowNull: false,
      field: 'PRIVATE_KEY'
    },
    supportedNetworks: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'SUPPORTED_NETWORKS'
    },
    erc20Paymasters: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ERC20_PAYMASTERS'
    },
    multiTokenPaymasters: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'MULTI_TOKEN_PAYMASTERS'
    },
    multiTokenOracles: {
      type: DataTypes.STRING,
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
    //modelName: 'APIKey',
    timestamps: true, // enabling timestamps
    createdAt: 'createdAt', // mapping 'createdAt' to 'CREATED_AT'
    updatedAt: 'updatedAt', // mapping 'updatedAt' to 'UPDATED_AT'
    freezeTableName: true,
    schema: schema,
  });

  console.log(`apiKey inited as: ${initializedAPIKeyModel}`)

  console.log('APIKey model initialized.')

  return initializedAPIKeyModel;
}