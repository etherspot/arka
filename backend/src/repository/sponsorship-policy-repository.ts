import { Sequelize, Op } from 'sequelize';
import { SponsorshipPolicy } from '../models/sponsorship-policy';

export class SponsorshipPolicyRepository {
    private sequelize: Sequelize;

    constructor(sequelize: Sequelize) {
        this.sequelize = sequelize;
    }

    async findAll(): Promise<SponsorshipPolicy[]> {
        const result = await this.sequelize.models.SponsorshipPolicy.findAll();
        return result.map(apiKey => apiKey.get() as SponsorshipPolicy);
    }

    // findAllInADateRange must use the model fields startTime and endTime to filter the results
    // user will pass the date range and the query must compare if the startTime and endTime are within the range
    // if the policy is perpetual, then it should always be returned
    async findAllInADateRange(startDate: Date, endDate: Date): Promise<SponsorshipPolicy[]> {
        const result = await this.sequelize.models.SponsorshipPolicy.findAll({
            where: {
                [Op.or]: [
                    {
                        startTime: {
                            [Op.lte]: endDate
                        },
                        endTime: {
                            [Op.gte]: startDate
                        }
                    },
                    {
                        isPerpetual: true
                    }
                ]
            }
        });
        return result.map(apiKey => apiKey as SponsorshipPolicy);
    }

    async findAllEnabled(): Promise<SponsorshipPolicy[]> {
        const result = await this.sequelize.models.SponsorshipPolicy.findAll({ where: { isEnabled: true } });
        return result.map(apiKey => apiKey.get() as SponsorshipPolicy);
    }

    async findAllEnabledAndApplicable(): Promise<SponsorshipPolicy[]> {
        const result = await this.sequelize.models.SponsorshipPolicy.findAll({ where: { isEnabled: true } });
        return result.map(apiKey => apiKey.get() as SponsorshipPolicy).filter(apiKey => apiKey.isApplicable);
    }

    async findLatestEnabledAndApplicable(): Promise<SponsorshipPolicy | null> {
        const result = await this.sequelize.models.SponsorshipPolicy.findOne({ where: { isEnabled: true }, order: [['createdAt', 'DESC']] });
        return result ? result.get() as SponsorshipPolicy : null;
    }

    async findOneByWalletAddress(walletAddress: string): Promise<SponsorshipPolicy | null> {
        const result = await this.sequelize.models.SponsorshipPolicy.findOne({ where: { walletAddress: walletAddress } });
        return result ? result.get() as SponsorshipPolicy : null;
    }

    async findOneByPolicyName(name: string): Promise<SponsorshipPolicy | null> {
        const result = await this.sequelize.models.SponsorshipPolicy.findOne({ where: { name: name } });
        return result ? result.get() as SponsorshipPolicy : null;
    }

    async findOneById(id: number): Promise<SponsorshipPolicy | null> {
        const result = await this.sequelize.models.SponsorshipPolicy.findOne({ where: { id: id } });
        return result ? result.get() as SponsorshipPolicy : null;
    }

    async createSponsorshipPolicy(sponsorshipPolicy: SponsorshipPolicy): Promise<SponsorshipPolicy> {
        this.validateSponsorshipPolicy(sponsorshipPolicy);

        const result = await this.sequelize.models.SponsorshipPolicy.create({
            walletAddress: sponsorshipPolicy.walletAddress,
            name: sponsorshipPolicy.name,
            description: sponsorshipPolicy.description,
            isPublic: sponsorshipPolicy.isPublic,
            isEnabled: sponsorshipPolicy.isEnabled,
            isApplicableToAllNetworks: sponsorshipPolicy.isApplicableToAllNetworks,
            enabledChains: sponsorshipPolicy.enabledChains,
            isPerpetual: sponsorshipPolicy.isPerpetual,
            startTime: sponsorshipPolicy.startTime,
            endTime: sponsorshipPolicy.endTime,
            globalMaximumApplicable: sponsorshipPolicy.globalMaximumApplicable,
            globalMaximumUsd: sponsorshipPolicy.globalMaximumUsd,
            globalMaximumNative: sponsorshipPolicy.globalMaximumNative,
            globalMaximumOpCount: sponsorshipPolicy.globalMaximumOpCount,
            perUserMaximumApplicable: sponsorshipPolicy.perUserMaximumApplicable,
            perUserMaximumUsd: sponsorshipPolicy.perUserMaximumUsd,
            perUserMaximumNative: sponsorshipPolicy.perUserMaximumNative,
            perUserMaximumOpCount: sponsorshipPolicy.perUserMaximumOpCount,
            perOpMaximumApplicable: sponsorshipPolicy.perOpMaximumApplicable,
            perOpMaximumUsd: sponsorshipPolicy.perOpMaximumUsd,
            perOpMaximumNative: sponsorshipPolicy.perOpMaximumNative,
            addressAllowList: sponsorshipPolicy.addressAllowList,
            addressBlockList: sponsorshipPolicy.addressBlockList
        });

        return result.get() as SponsorshipPolicy;
    }

    async updateSponsorshipPolicy(sponsorshipPolicy: SponsorshipPolicy): Promise<SponsorshipPolicy> {

        // check if sponsorship policy exists (by primary key id)
        const existingSponsorshipPolicy = await this.findOneById(sponsorshipPolicy.id as number);

        if (!existingSponsorshipPolicy) {
            throw new Error('Sponsorship Policy not found');
        }

        this.validateSponsorshipPolicy(sponsorshipPolicy);

        existingSponsorshipPolicy.name = sponsorshipPolicy.name;
        existingSponsorshipPolicy.description = sponsorshipPolicy.description;
        existingSponsorshipPolicy.isApplicableToAllNetworks = sponsorshipPolicy.isApplicableToAllNetworks;
        existingSponsorshipPolicy.isPerpetual = sponsorshipPolicy.isPerpetual;
        // if marked as IsPerpetual, then set startTime and endTime to null
        if (sponsorshipPolicy.isPerpetual) {
            existingSponsorshipPolicy.startTime = null;
            existingSponsorshipPolicy.endTime = null;
        } else {
            existingSponsorshipPolicy.startTime = sponsorshipPolicy.startTime;
            existingSponsorshipPolicy.endTime = sponsorshipPolicy.endTime;
        }
        existingSponsorshipPolicy.globalMaximumApplicable = sponsorshipPolicy.globalMaximumApplicable;
        existingSponsorshipPolicy.globalMaximumUsd = sponsorshipPolicy.globalMaximumUsd;
        existingSponsorshipPolicy.globalMaximumNative = sponsorshipPolicy.globalMaximumNative;
        existingSponsorshipPolicy.globalMaximumOpCount = sponsorshipPolicy.globalMaximumOpCount;
        existingSponsorshipPolicy.perUserMaximumApplicable = sponsorshipPolicy.perUserMaximumApplicable;
        existingSponsorshipPolicy.perUserMaximumNative = sponsorshipPolicy.perUserMaximumNative;
        existingSponsorshipPolicy.perUserMaximumOpCount = sponsorshipPolicy.perUserMaximumOpCount;
        existingSponsorshipPolicy.perUserMaximumUsd = sponsorshipPolicy.perUserMaximumUsd;
        existingSponsorshipPolicy.perOpMaximumApplicable = sponsorshipPolicy.perOpMaximumApplicable;
        existingSponsorshipPolicy.perOpMaximumNative = sponsorshipPolicy.perOpMaximumNative;
        existingSponsorshipPolicy.perOpMaximumUsd = sponsorshipPolicy.perOpMaximumUsd;
        existingSponsorshipPolicy.isPublic = sponsorshipPolicy.isPublic;
        existingSponsorshipPolicy.addressAllowList = sponsorshipPolicy.addressAllowList;
        existingSponsorshipPolicy.addressBlockList = sponsorshipPolicy.addressBlockList;

        const result = await existingSponsorshipPolicy.save();
        return result.get() as SponsorshipPolicy;
    }

    validateSponsorshipPolicy(sponsorshipPolicy: SponsorshipPolicy) {
        let errors: string[] = [];

        if (!sponsorshipPolicy.name || !sponsorshipPolicy.description) {
            errors.push('Name and description are required fields');
        }

        if (!sponsorshipPolicy.isApplicableToAllNetworks) {
            if (!sponsorshipPolicy.enabledChains || sponsorshipPolicy.enabledChains.length === 0) {
                errors.push('Enabled chains are required');
            }
        }

        if (!sponsorshipPolicy.isPerpetual) {
            if (!sponsorshipPolicy.startTime || !sponsorshipPolicy.endTime) {
                errors.push('Start and End time are required fields');
            }

            if (sponsorshipPolicy.startTime && sponsorshipPolicy.endTime) {
                if (sponsorshipPolicy.startTime < new Date() || sponsorshipPolicy.endTime < new Date() || sponsorshipPolicy.endTime < sponsorshipPolicy.startTime) {
                    errors.push('Invalid start and end time');
                }
            }
        }

        if (sponsorshipPolicy.globalMaximumApplicable) {
            if (!sponsorshipPolicy.globalMaximumUsd && !sponsorshipPolicy.globalMaximumNative && !sponsorshipPolicy.globalMaximumOpCount) {
                errors.push('At least 1 Global maximum value is required');
            }
        }

        if (sponsorshipPolicy.perUserMaximumApplicable) {
            if (!sponsorshipPolicy.perUserMaximumUsd && !sponsorshipPolicy.perUserMaximumNative && !sponsorshipPolicy.perUserMaximumOpCount) {
                errors.push('At least 1 Per User maximum value is required');
            }
        }

        if (sponsorshipPolicy.perOpMaximumApplicable) {
            if (!sponsorshipPolicy.perOpMaximumUsd && !sponsorshipPolicy.perOpMaximumNative) {
                errors.push('At least 1 Per Op maximum value is required');
            }
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }

    async disableSponsorshipPolicy(id: number): Promise<void> {
        const existingSponsorshipPolicy = await this.findOneById(id);

        if (!existingSponsorshipPolicy) {
            throw new Error('Sponsorship Policy not found');
        }

        existingSponsorshipPolicy.isEnabled = false;
        await existingSponsorshipPolicy.save();
    }

    async enableSponsorshipPolicy(id: number): Promise<void> {
        const existingSponsorshipPolicy = await this.findOneById(id);

        if (!existingSponsorshipPolicy) {
            throw new Error('Sponsorship Policy not found');
        }

        existingSponsorshipPolicy.isEnabled = true;
        await existingSponsorshipPolicy.save();
    }

    async deleteSponsorshipPolicy(id: number): Promise<void> {
        const existingSponsorshipPolicy = await this.findOneById(id);

        if (!existingSponsorshipPolicy) {
            throw new Error('Sponsorship Policy not found');
        }

        await existingSponsorshipPolicy.destroy();
    }

    async deleteAllSponsorshipPolicies(): Promise<void> {
        await this.sequelize.models.SponsorshipPolicy.destroy({ where: {} });
    }
}