import { Sequelize } from 'sequelize';
import { MultiTokenPaymaster } from '../models/multiTokenPaymaster.js';

export class MultiTokenPaymasterRepository {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async findAll(): Promise<MultiTokenPaymaster[]> {
    const result = await this.sequelize.models.MultiTokenPaymaster.findAll();
    return result.map(id => id.get() as MultiTokenPaymaster);
  }

  async findOneByChainIdAndTokenAddress(chainId: number, tokenAddress: string): Promise<MultiTokenPaymaster | null> {
    const result = await this.sequelize.models.MultiTokenPaymaster.findOne({
      where: {
        chainId: chainId, tokenAddress: tokenAddress
      }
    }) as MultiTokenPaymaster;

    if (!result) {
      return null;
    }

    return result.get() as MultiTokenPaymaster;
  }

  async findOneById(id: number): Promise<MultiTokenPaymaster | null> {
    const multiTokenPaymaster = await this.sequelize.models.MultiTokenPaymaster.findOne({ where: { id: id } }) as MultiTokenPaymaster;
    if (!multiTokenPaymaster) {
      return null;
    }

    const dataValues = multiTokenPaymaster.get();
    return dataValues as MultiTokenPaymaster;
  }

  async getAllDistinctPaymasterAddrWithChainId(): Promise<MultiTokenPaymaster[]> {
    const result = await this.sequelize.models.MultiTokenPaymaster.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('PAYMASTER_ADDRESS')), 'paymasterAddress'], 'chainId'],
    });
    return result.map(id => id.get() as MultiTokenPaymaster);
  }
}