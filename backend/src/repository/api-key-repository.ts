import { Sequelize } from 'sequelize';
import { APIKey } from '../models/api-key.js';
import { ApiKeyDto } from '../types/apikey-dto.js';
import { EPVersions } from '../types/sponsorship-policy-dto.js';

export class APIKeyRepository {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async create(apiKey: ApiKeyDto): Promise<APIKey | null> {
    // generate APIKey sequelize model instance from APIKeyDto
    const result = await this.sequelize.models.APIKey.create({
      apiKey: apiKey.apiKey,
      walletAddress: apiKey.walletAddress,
      privateKey: apiKey.privateKey,
      supportedNetworks: apiKey.supportedNetworks,
      erc20Paymasters: apiKey.erc20Paymasters,
      multiTokenPaymasters: apiKey.multiTokenPaymasters,
      multiTokenOracles: apiKey.multiTokenOracles,
      sponsorName: apiKey.sponsorName,
      logoUrl: apiKey.logoUrl,
      transactionLimit: apiKey.transactionLimit,
      noOfTransactionsInAMonth: apiKey.noOfTransactionsInAMonth,
      indexerEndpoint: apiKey.indexerEndpoint,
      bundlerApiKey: apiKey.bundlerApiKey,
    }) as APIKey;

    

    return result;
  }

  async delete(apiKey: string): Promise<number> {
    const deletedCount = await this.sequelize.models.APIKey.destroy({
      where
        : { apiKey: apiKey }
    });

    if (deletedCount === 0) {
      throw new Error('APIKey deletion failed');
    }

    return deletedCount;
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

  async updateVpAddresses(apiKey: string, vpAddresses: string, epVersion: EPVersions = EPVersions.EPV_06) {
    if (epVersion === EPVersions.EPV_06) {
      return await this.sequelize.models.APIKey.update({ verifyingPaymasters: vpAddresses }, { where: { apiKey } });
    } else if (epVersion === EPVersions.EPV_07) {
      return await this.sequelize.models.APIKey.update({ verifyingPaymastersV2: vpAddresses }, { where: { apiKey } });
    } else if (epVersion === EPVersions.EPV_08) {
      return await this.sequelize.models.APIKey.update({ verifyingPaymastersV3: vpAddresses }, { where: { apiKey } });
    } else {
      throw new Error(`Unsupported EP version: ${epVersion}`);
    }
  }
}