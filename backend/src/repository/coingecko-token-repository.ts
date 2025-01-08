import { Sequelize } from 'sequelize';
import { CoingeckoTokens } from 'models/coingecko';

export class CoingeckoTokensRepository {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async findAll(): Promise<CoingeckoTokens[]> {
    const result = await this.sequelize.models.CoingeckoTokens.findAll();
    return result.map(id => id.get() as CoingeckoTokens);
  }

  async findOneByChainIdAndTokenAddress(chainId: number, tokenAddress: string): Promise<CoingeckoTokens | null> {
    const result = await this.sequelize.models.CoingeckoTokens.findOne({
      where: {
        chainId: chainId, address: tokenAddress
      }
    }) as CoingeckoTokens;

    if (!result) {
      return null;
    }

    return result.get() as CoingeckoTokens;
  }

  async findOneById(id: number): Promise<CoingeckoTokens | null> {
    const coingeckoTokens = await this.sequelize.models.CoingeckoTokens.findOne({ where: { id: id } }) as CoingeckoTokens;
    if (!coingeckoTokens) {
      return null;
    }

    const dataValues = coingeckoTokens.get();
    return dataValues as CoingeckoTokens;
  }

}