import { Sequelize } from 'sequelize';
import { ArkaConfig } from '../models/arka-config.js';

export class ArkaConfigRepository {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async findAll(): Promise<ArkaConfig[]> {
    const result = await this.sequelize.models.ArkaConfig.findAll();
    return result.map(config => config.get() as ArkaConfig);
  }

  async findFirstConfig(): Promise<ArkaConfig | null> {
    const result = await this.sequelize.models.ArkaConfig.findOne();
    return result ? result.get() as ArkaConfig : null;
  }

  async updateConfig(body: any): Promise<any> {
    try {
      // Check if the record exists
      const existingRecord = await this.sequelize.models.ArkaConfig.findOne({
        where: {
          id: body.id
        }
      });

      // If the record doesn't exist, throw an error
      if (!existingRecord) {
        throw new Error('Record not found');
      }

      // Update the record
      await this.sequelize.models.ArkaConfig.update(
        {
          deployedErc20Paymasters: body.deployedErc20Paymasters,
          pythMainnetUrl: body.pythMainnetUrl,
          pythTestnetUrl: body.pythTestnetUrl,
          pythTestnetChainIds: body.pythTestnetChainIds,
          pythMainnetChainIds: body.pythMainnetChainIds,
          cronTime: body.cronTime,
          customChainlinkDeployed: body.customChainlinkDeployed,
          coingeckoIds: body.coingeckoIds,
          coingeckoApiUrl: body.coingeckoApiUrl
        },
        {
          where: {
            id: body.id
          }
        }
      );

      // Get the updated record
      const updatedRecord = await this.sequelize.models.ArkaConfig.findOne({
        where: {
          id: body.id
        }
      });

      return updatedRecord;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}