import { Sequelize, DataTypes, Model } from 'sequelize';
import { EPVersions } from '../types/sponsorship-policy-dto.js';

export class ArkaWhitelist extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public apiKey!: string;
    public addresses!: string[];
    public policyId?: number;
    public epVersion?: EPVersions;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

const initializeArkaWhitelistModel = (sequelize: Sequelize, schema: string) => {
  ArkaWhitelist.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            field: 'ID'
        },
        apiKey: {
          type: DataTypes.TEXT,
          allowNull: false,
          primaryKey: true,
          field: 'API_KEY'
        },
        addresses: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          field: 'ADDRESSES'
        },
        policyId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'POLICY_ID'
        },
        epVersion: {
          type: DataTypes.ENUM,
          values: [EPVersions.EPV_06, EPVersions.EPV_07],
          allowNull: true,
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
        tableName: 'arka_whitelist',
        modelName: 'ArkaWhitelist',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        freezeTableName: true,
        schema: schema,
    });
};

export { initializeArkaWhitelistModel };