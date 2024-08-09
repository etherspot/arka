import { Sequelize } from 'sequelize';
import { ContractWhitelist } from '../models/contract-whitelist.js';
import { ContractWhitelistDto } from '../types/contractWhitelist-dto.js';

export class ContractWhitelistRepository {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async create(record: ContractWhitelistDto): Promise<ContractWhitelist | null> {

    // generate APIKey sequelize model instance from APIKeyDto
    const result = await this.sequelize.models.ContractWhitelist.create({
      walletAddress: record.walletAddress,
      contractAddress: record.contractAddress,
      eventNames: record.eventNames,
      abi: record.abi,
      chainId: record.chainId,
    }) as ContractWhitelist;



    return result;
  }

  async delete(walletAddress: string): Promise<number> {
    const deletedCount = await this.sequelize.models.ContractWhitelist.destroy({
      where
        : { walletAddress: walletAddress }
    });

    if (deletedCount === 0) {
      throw new Error('Wallet Address deletion failed');
    }

    return deletedCount;
  }

  async findAll(): Promise<ContractWhitelist[]> {
    const result = await this.sequelize.models.ContractWhitelist.findAll();
    return result.map(id => id.get() as ContractWhitelist);
  }

  async findOneByChainIdContractAddressAndWalletAddress(chainId: number, walletAddress: string, contractAddress: string): Promise<ContractWhitelist | null> {
    const result = await this.sequelize.models.ContractWhitelist.findOne({
      where: {
        chainId: chainId, walletAddress: walletAddress, contractAddress: contractAddress
      }
    }) as ContractWhitelist;

    if (!result) {
      return null;
    }

    return result.get() as ContractWhitelist;
  }

  async findOneById(id: number): Promise<ContractWhitelist | null> {
    const contractWhitelist = await this.sequelize.models.ContractWhitelist.findOne({ where: { id: id } }) as ContractWhitelist;
    if (!contractWhitelist) {
      return null;
    }

    const dataValues = contractWhitelist.get();
    return dataValues as ContractWhitelist;
  }

  async updateOneById(record: ContractWhitelist): Promise<ContractWhitelist | null> {
    const result = await this.sequelize.models.ContractWhitelist.update({
      eventNames: record.eventNames,
      contractAddress: record.contractAddress,
      abi: record.abi
    }, {
      where: { id: record.id }
    })

    if (result[0] === 0) {
      throw new Error(`ContractWhitelist update failed for id: ${record.id}`);
    }

    // return the updated record - fetch fresh from database
    const updatedWhitelist = await this.findOneById(record.id);
    return updatedWhitelist as ContractWhitelist;
  }

  async deleteById(id: number): Promise<number> {

    const deletedCount = await this.sequelize.models.ContractWhitelist.destroy({
      where
        : { id: id }
    });

    return deletedCount;
  }

  async deleteAllByWalletAddress(address: string): Promise<number> {

    const deletedCount = await this.sequelize.models.ContractWhitelist.destroy({
      where
        : { walletAddress: address }
    });

    return deletedCount;
  }

  async deleteAllWhitelist(): Promise<{ message: string }> {
    try {
      await this.sequelize.models.ContractWhitelist.destroy({ where: {} });
      return { message: 'Successfully deleted all whitelist' };
    } catch (err) {
      console.error(err);
      throw new Error('Failed to delete all contract whitelist');
    }
  }

}