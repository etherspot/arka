import { Sequelize } from 'sequelize';
import { APIKey } from '../models/APIKey';

export class APIKeyRepository {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async create(apiKey: APIKeyCreationAttributes): Promise<APIKey | null> {
    const result = await this.sequelize.models.APIKey.create(apiKey);
    return result ? result.get() as APIKey : null;
  }

  async delete(apiKey: string): Promise<number> {
    return await this.sequelize.models.APIKey.destroy({
      where
        : { apiKey: apiKey }
    });
  }

  async findAll(): Promise<APIKey[]> {
    const result = await this.sequelize.models.APIKey.findAll();
    return result.map(apiKey => apiKey.get() as APIKey);
  }

  async findOneByApiKey(apiKey: string): Promise<APIKey | null> {
    const result = await this.sequelize.models.APIKey.findOne({ where: { apiKey: apiKey } });
    return result ? result.get() as APIKey : null;
  }

  async findOneByWalletAddress(walletAddress: string): Promise<APIKey | null> {
    const result = await this.sequelize.models.APIKey.findOne({ where: { walletAddress: walletAddress } });
    return result ? result.get() as APIKey : null;
  }
}