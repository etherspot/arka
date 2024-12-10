import { Sequelize } from 'sequelize';
import { WhitelistDto } from '../types/whitelist-dto.js';
import { ArkaWhitelist } from '../models/whitelist.js';

export class WhitelistRepository {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async create(apiKey: WhitelistDto): Promise<ArkaWhitelist | null> {
    // generate APIKey sequelize model instance from APIKeyDto
    const result = await this.sequelize.models.ArkaWhitelist.create({
      apiKey: apiKey.apiKey,
      addresses: apiKey.addresses,
      policyId: apiKey.policyId ?? null
    }) as ArkaWhitelist;



    return result;
  }

  async delete(apiKey: string): Promise<number> {
    const deletedCount = await this.sequelize.models.ArkaWhitelist.destroy({
      where
        : { apiKey: apiKey }
    });

    if (deletedCount === 0) {
      throw new Error('APIKey deletion failed');
    }

    return deletedCount;
  }

  async findAll(): Promise<ArkaWhitelist[]> {
    const result = await this.sequelize.models.APIKey.findAll();
    return result.map(apiKey => apiKey.get() as ArkaWhitelist);
  }

  async findOneByApiKeyAndPolicyId(apiKey: string, policyId?: number): Promise<ArkaWhitelist | null> {
    let result;
    if (policyId) {
      result = await this.sequelize.models.ArkaWhitelist.findOne({ where: { apiKey: apiKey, policyId: policyId } });
    } else {
      result = await this.sequelize.models.ArkaWhitelist.findOne({ where: { apiKey: apiKey, policyId: null } });
    }
    return result ? result.get() as ArkaWhitelist : null;
  }

  async updateOneById(record: ArkaWhitelist): Promise<ArkaWhitelist | null> {
    const result = await this.sequelize.models.ArkaWhitelist.update({
      apiKey: record.apiKey,
      addresses: record.addresses,
      policyId: record.policyId
    }, {
      where: { id: record.id }
    })

    if (result[0] === 0) {
      throw new Error(`ArkaWhitelist update failed for id: ${record.id}`);
    }

    // return the updated record - fetch fresh from database
    const updatedWhitelist = await this.findOneByApiKeyAndPolicyId(record.apiKey, record.policyId);
    return updatedWhitelist as ArkaWhitelist;
  }

  async deleteById(id: number): Promise<number> {

    const deletedCount = await this.sequelize.models.ArkaWhitelist.destroy({
      where
        : { id: id }
    });

    return deletedCount;
  }

  async deleteAllBySponsorshipPolicies(id: number): Promise<number> {

    const deletedCount = await this.sequelize.models.ArkaWhitelist.destroy({
      where
        : { policyId: id }
    });

    return deletedCount;
  }

  async deleteAllByApiKey(apiKey: string): Promise<number> {

    const deletedCount = await this.sequelize.models.ArkaWhitelist.destroy({
      where
        : { apiKey: apiKey }
    });

    return deletedCount;
  }

  async deleteAllWhitelist(): Promise<{ message: string }> {
    try {
      await this.sequelize.models.ArkaWhitelist.destroy({ where: {} });
      return { message: 'Successfully deleted all whitelist' };
    } catch (err) {
      console.error(err);
      throw new Error('Failed to delete all whitelist');
    }
  }

}