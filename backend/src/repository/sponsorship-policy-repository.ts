import { Sequelize, Op } from 'sequelize';
import { SponsorshipPolicy } from '../models/sponsorship-policy';
import { EPVersions, SponsorshipPolicyDto, getEPVersionString } from '../types/sponsorship-policy-dto';
import { ethers } from 'ethers';

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

    async findOneByWalletAddressAndHasSupportedEPVersion(walletAddress: string, epVersion: EPVersions): Promise<SponsorshipPolicy | null> {
        const result = await this.sequelize.models.SponsorshipPolicy.findOne({
            where: {
                walletAddress: walletAddress,
                isEnabled: true,
                supportedEPVersions: {
                    [Op.contains]: Sequelize.literal(`ARRAY['${getEPVersionString(epVersion)}']::text[]`)
                },
                [Op.or]: [
                    { isPerpetual: true },
                    {
                        startTime: {
                            [Op.or]: [
                                { [Op.lte]: Sequelize.literal(`CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`) },
                                { [Op.is]: null }
                            ]
                        },
                        endTime: {
                            [Op.or]: [
                                { [Op.gt]: Sequelize.literal(`CURRENT_TIMESTAMP AT TIME ZONE 'UTC'`) },
                                { [Op.is]: null }
                            ]
                        }
                    }
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        return result ? result.get() as SponsorshipPolicy : null;
    }

    async findOneByPolicyName(name: string): Promise<SponsorshipPolicy | null> {
        const result = await this.sequelize.models.SponsorshipPolicy.findOne({ where: { name: name } });
        return result ? result.get() as SponsorshipPolicy : null;
    }

    async findOneById(id: number): Promise<SponsorshipPolicy | null> {
        const sponsorshipPolicy = await this.sequelize.models.SponsorshipPolicy.findOne({ where: { id: id } }) as SponsorshipPolicy;
        if (!sponsorshipPolicy) {
            return null;
        }
        
        const dataValues = sponsorshipPolicy.get();
        return dataValues as SponsorshipPolicy;
    }

    async createSponsorshipPolicy(sponsorshipPolicy: SponsorshipPolicyDto): Promise<SponsorshipPolicy> {
        this.validateSponsorshipPolicy(sponsorshipPolicy);

        const result = await this.sequelize.models.SponsorshipPolicy.create({
            walletAddress: sponsorshipPolicy.walletAddress,
            name: sponsorshipPolicy.name,
            description: sponsorshipPolicy.description,
            isPublic: sponsorshipPolicy.isPublic,
            isEnabled: sponsorshipPolicy.isEnabled,
            isApplicableToAllNetworks: sponsorshipPolicy.isApplicableToAllNetworks,
            enabledChains: sponsorshipPolicy.enabledChains,
            supportedEPVersions: sponsorshipPolicy.supportedEPVersions,
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

    async updateSponsorshipPolicy(sponsorshipPolicy: SponsorshipPolicyDto): Promise<SponsorshipPolicy> {

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
        existingSponsorshipPolicy.supportedEPVersions = sponsorshipPolicy.supportedEPVersions;

        // if marked as IsPerpetual, then set startTime and endTime to null
        if (sponsorshipPolicy.isPerpetual) {
            existingSponsorshipPolicy.startTime = null;
            existingSponsorshipPolicy.endTime = null;
        } else {

            if (!sponsorshipPolicy.startTime || sponsorshipPolicy.startTime == null) {
                existingSponsorshipPolicy.startTime = null;
            } else {
                existingSponsorshipPolicy.startTime = sponsorshipPolicy.startTime;
            }

            if (!sponsorshipPolicy.endTime || sponsorshipPolicy.endTime == null) {
                existingSponsorshipPolicy.endTime = null;
            } else {
                existingSponsorshipPolicy.endTime = sponsorshipPolicy.endTime;
            }
        }

        existingSponsorshipPolicy.globalMaximumApplicable = sponsorshipPolicy.globalMaximumApplicable;

        if (existingSponsorshipPolicy.globalMaximumApplicable) {
            if (!sponsorshipPolicy.globalMaximumUsd || sponsorshipPolicy.globalMaximumUsd == null) {
                existingSponsorshipPolicy.globalMaximumUsd = null;
            } else {
                existingSponsorshipPolicy.globalMaximumUsd = sponsorshipPolicy.globalMaximumUsd;
            }

            if (!sponsorshipPolicy.globalMaximumNative || sponsorshipPolicy.globalMaximumNative == null) {
                existingSponsorshipPolicy.globalMaximumNative = null;
            } else {
                existingSponsorshipPolicy.globalMaximumNative = sponsorshipPolicy.globalMaximumNative;
            }

            if (!sponsorshipPolicy.globalMaximumOpCount || sponsorshipPolicy.globalMaximumOpCount == null) {
                existingSponsorshipPolicy.globalMaximumOpCount = null;
            } else {
                existingSponsorshipPolicy.globalMaximumOpCount = sponsorshipPolicy.globalMaximumOpCount;
            }
        } else {
            existingSponsorshipPolicy.globalMaximumUsd = null;
            existingSponsorshipPolicy.globalMaximumNative = null;
            existingSponsorshipPolicy.globalMaximumOpCount = null;
        }

        existingSponsorshipPolicy.perUserMaximumApplicable = sponsorshipPolicy.perUserMaximumApplicable;

        if (existingSponsorshipPolicy.perUserMaximumApplicable) {
            if (!sponsorshipPolicy.perUserMaximumUsd || sponsorshipPolicy.perUserMaximumUsd == null) {
                existingSponsorshipPolicy.perUserMaximumUsd = null;
            } else {
                existingSponsorshipPolicy.perUserMaximumUsd = sponsorshipPolicy.perUserMaximumUsd;
            }

            if (!sponsorshipPolicy.perUserMaximumNative || sponsorshipPolicy.perUserMaximumNative == null) {
                existingSponsorshipPolicy.perUserMaximumNative = null;
            } else {
                existingSponsorshipPolicy.perUserMaximumNative = sponsorshipPolicy.perUserMaximumNative;
            }

            if (!sponsorshipPolicy.perUserMaximumOpCount || sponsorshipPolicy.perUserMaximumOpCount == null) {
                existingSponsorshipPolicy.perUserMaximumOpCount = null;
            } else {
                existingSponsorshipPolicy.perUserMaximumOpCount = sponsorshipPolicy.perUserMaximumOpCount;
            }
        } else {
            existingSponsorshipPolicy.perUserMaximumUsd = null;
            existingSponsorshipPolicy.perUserMaximumNative = null;
            existingSponsorshipPolicy.perUserMaximumOpCount = null;
        }

        existingSponsorshipPolicy.perOpMaximumApplicable = sponsorshipPolicy.perOpMaximumApplicable;

        if (existingSponsorshipPolicy.perOpMaximumApplicable) {
            if (!sponsorshipPolicy.perOpMaximumUsd || sponsorshipPolicy.perOpMaximumUsd == null) {
                existingSponsorshipPolicy.perOpMaximumUsd = null;
            } else {
                existingSponsorshipPolicy.perOpMaximumUsd = sponsorshipPolicy.perOpMaximumUsd;
            }

            if (!sponsorshipPolicy.perOpMaximumNative || sponsorshipPolicy.perOpMaximumNative == null) {
                existingSponsorshipPolicy.perOpMaximumNative = null;
            } else {
                existingSponsorshipPolicy.perOpMaximumNative = sponsorshipPolicy.perOpMaximumNative;
            }
        } else {
            existingSponsorshipPolicy.perOpMaximumUsd = null;
            existingSponsorshipPolicy.perOpMaximumNative = null;
        }

        existingSponsorshipPolicy.isPublic = sponsorshipPolicy.isPublic;

        if (existingSponsorshipPolicy.addressAllowList && existingSponsorshipPolicy.addressAllowList.length > 0) {
            existingSponsorshipPolicy.addressAllowList = sponsorshipPolicy.addressAllowList as string[];
        } else {
            existingSponsorshipPolicy.addressAllowList = null;
        }

        if (existingSponsorshipPolicy.addressBlockList && existingSponsorshipPolicy.addressBlockList.length > 0) {
            existingSponsorshipPolicy.addressBlockList = sponsorshipPolicy.addressBlockList as string[];
        } else {
            existingSponsorshipPolicy.addressBlockList = null;
        }

        // const result = await existingSponsorshipPolicy.save();
        // return result.get() as SponsorshipPolicy;

        // apply same logic to update the record
        const result = await this.sequelize.models.SponsorshipPolicy.update({
            name: existingSponsorshipPolicy.name,
            description: existingSponsorshipPolicy.description,
            isApplicableToAllNetworks: existingSponsorshipPolicy.isApplicableToAllNetworks,
            enabledChains: existingSponsorshipPolicy.enabledChains,
            supportedEPVersions: existingSponsorshipPolicy.supportedEPVersions,
            isPerpetual: existingSponsorshipPolicy.isPerpetual,
            startTime: existingSponsorshipPolicy.startTime,
            endTime: existingSponsorshipPolicy.endTime,
            globalMaximumApplicable: existingSponsorshipPolicy.globalMaximumApplicable,
            globalMaximumUsd: existingSponsorshipPolicy.globalMaximumUsd,
            globalMaximumNative: existingSponsorshipPolicy.globalMaximumNative,
            globalMaximumOpCount: existingSponsorshipPolicy.globalMaximumOpCount,
            perUserMaximumApplicable: existingSponsorshipPolicy.perUserMaximumApplicable,
            perUserMaximumUsd: existingSponsorshipPolicy.perUserMaximumUsd,
            perUserMaximumNative: existingSponsorshipPolicy.perUserMaximumNative,
            perUserMaximumOpCount: existingSponsorshipPolicy.perUserMaximumOpCount,
            perOpMaximumApplicable: existingSponsorshipPolicy.perOpMaximumApplicable,
            perOpMaximumUsd: existingSponsorshipPolicy.perOpMaximumUsd,
            perOpMaximumNative: existingSponsorshipPolicy.perOpMaximumNative,
            addressAllowList: existingSponsorshipPolicy.addressAllowList,
            addressBlockList: existingSponsorshipPolicy.addressBlockList
        }, {
            where: { id: sponsorshipPolicy.id }
        });

        if (result[0] === 0) {
            throw new Error(`SponsorshipPolicy update failed for id: ${sponsorshipPolicy.id}`);
        }

        // return the updated record - fetch fresh from database
        const updatedSponsorshipPolicy = await this.findOneById(sponsorshipPolicy.id as number);
        return updatedSponsorshipPolicy as SponsorshipPolicy;
    }

    validateSponsorshipPolicy(sponsorshipPolicy: SponsorshipPolicyDto) {
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

            const currentTime = new Date();

            if (sponsorshipPolicy.startTime && sponsorshipPolicy.endTime) {
                const startTime = new Date(sponsorshipPolicy.startTime + 'Z');
                const endTime = new Date(sponsorshipPolicy.endTime + 'Z');

                if (startTime.getTime() < currentTime.getTime()) {
                    errors.push(`Invalid start time. Provided start time is ${startTime.toISOString()} in GMT. The start time must be now or in the future. Current time is ${currentTime.toISOString()} in GMT.`);
                }
                if (endTime.getTime() < currentTime.getTime()) {
                    errors.push(`Invalid end time. Provided end time is ${endTime.toISOString()} in GMT. The end time must be in the future. Current time is ${currentTime.toISOString()} in GMT.`);
                }
                if (endTime.getTime() < startTime.getTime()) {
                    errors.push(`Invalid end time. Provided end time is ${endTime.toISOString()} in GMT and start time is ${startTime.toISOString()} in GMT. The end time must be greater than the start time.`);
                }
            }
        }

        if (!sponsorshipPolicy.supportedEPVersions ||
            !sponsorshipPolicy.supportedEPVersions.every(version => Object.values(EPVersions).includes(version as EPVersions))) {
            const enteredVersions = sponsorshipPolicy.supportedEPVersions ? sponsorshipPolicy.supportedEPVersions.join(', ') : 'none';
            errors.push(`Supported entry point versions are required and must be valid. You entered: ${enteredVersions}. Valid values are: ${Object.values(EPVersions).join(', ')}`);
        }

        if (sponsorshipPolicy.globalMaximumApplicable) {
            if (!sponsorshipPolicy.globalMaximumUsd && !sponsorshipPolicy.globalMaximumNative && !sponsorshipPolicy.globalMaximumOpCount) {
                errors.push('At least 1 Global maximum value is required');
            }

            const globalMaximumUsd = sponsorshipPolicy.globalMaximumUsd;

            if (globalMaximumUsd !== undefined && globalMaximumUsd !== null) {
                const parts = globalMaximumUsd.toString().split('.');
                if (parts.length > 2 || parts[0].length > 6 || (parts[1] && parts[1].length > 4)) {
                    errors.push(`Invalid value for globalMaximumUsd. The value ${globalMaximumUsd} exceeds the maximum allowed precision of 10 total digits, with a maximum of 4 digits allowed after the decimal point.`);
                }
            }

            const globalMaximumNative = sponsorshipPolicy.globalMaximumNative;

            if (globalMaximumNative !== undefined && globalMaximumNative !== null) {
                const parts = globalMaximumNative.toString().split('.');
                if (parts.length > 2 || parts[0].length > 4 || (parts[1] && parts[1].length > 18)) {
                    errors.push(`Invalid value for globalMaximumNative. The value ${globalMaximumNative} exceeds the maximum allowed precision of 22 total digits, with a maximum of 18 digits allowed after the decimal point.`);
                }
            }
        }

        if (sponsorshipPolicy.perUserMaximumApplicable) {
            if (!sponsorshipPolicy.perUserMaximumUsd && !sponsorshipPolicy.perUserMaximumNative && !sponsorshipPolicy.perUserMaximumOpCount) {
                errors.push('At least 1 Per User maximum value is required');
            }

            const perUserMaximumUsd = sponsorshipPolicy.perUserMaximumUsd;

            if (perUserMaximumUsd !== undefined && perUserMaximumUsd !== null) {
                const parts = perUserMaximumUsd.toString().split('.');
                if (parts.length > 2 || parts[0].length > 6 || (parts[1] && parts[1].length > 4)) {
                    errors.push(`Invalid value for perUserMaximumUsd. The value ${perUserMaximumUsd} exceeds the maximum allowed precision of 10 total digits, with a maximum of 4 digits allowed after the decimal point.`);
                }
            }

            const perUserMaximumNative = sponsorshipPolicy.perUserMaximumNative;

            if (perUserMaximumNative !== undefined && perUserMaximumNative !== null) {
                const parts = perUserMaximumNative.toString().split('.');
                if (parts.length > 2 || parts[0].length > 4 || (parts[1] && parts[1].length > 18)) {
                    errors.push(`Invalid value for perUserMaximumNative. The value ${perUserMaximumNative} exceeds the maximum allowed precision of 22 total digits, with a maximum of 18 digits allowed after the decimal point.`);
                }
            }
        }

        if (sponsorshipPolicy.perOpMaximumApplicable) {
            if (!sponsorshipPolicy.perOpMaximumUsd && !sponsorshipPolicy.perOpMaximumNative) {
                errors.push('At least 1 Per Op maximum value is required');
            }

            const perOpMaximumUsd = sponsorshipPolicy.perOpMaximumUsd;

            if (perOpMaximumUsd !== undefined && perOpMaximumUsd !== null) {
                const parts = perOpMaximumUsd.toString().split('.');
                if (parts.length > 2 || parts[0].length > 6 || (parts[1] && parts[1].length > 4)) {
                    errors.push(`Invalid value for perOpMaximumUsd. The value ${perOpMaximumUsd} exceeds the maximum allowed precision of 10 total digits, with a maximum of 4 digits allowed after the decimal point.`);
                }
            }

            const perOpMaximumNative = sponsorshipPolicy.perOpMaximumNative;

            if (perOpMaximumNative !== undefined && perOpMaximumNative !== null) {
                const parts = perOpMaximumNative.toString().split('.');
                if (parts.length > 2 || parts[0].length > 4 || (parts[1] && parts[1].length > 18)) {
                    errors.push(`Invalid value for perOpMaximumNative. The value ${perOpMaximumNative} exceeds the maximum allowed precision of 22 total digits, with a maximum of 18 digits allowed after the decimal point.`);
                }
            }
        }

        // check if the addressAllowList and addressBlockList are valid addresses
        if (sponsorshipPolicy.addressAllowList && sponsorshipPolicy.addressAllowList.length > 0) {
            const invalidAddresses: string[] = [];

            sponsorshipPolicy.addressAllowList.forEach(address => {
                if (!address || !ethers.utils.isAddress(address)) {
                    invalidAddresses.push(address);
                }
            });

            if (invalidAddresses.length > 0) {
                errors.push(`The following addresses in addressAllowList are invalid: ${invalidAddresses.join(', ')}`);
            }
        }

        if (sponsorshipPolicy.addressBlockList && sponsorshipPolicy.addressBlockList.length > 0) {
            const invalidAddresses: string[] = [];

            sponsorshipPolicy.addressBlockList.forEach(address => {
                if (!address || !ethers.utils.isAddress(address)) {
                    invalidAddresses.push(address);
                }
            });

            if (invalidAddresses.length > 0) {
                errors.push(`The following addresses in addressBlockList are invalid: ${invalidAddresses.join(', ')}`);
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

        if (!existingSponsorshipPolicy.isEnabled) {
            throw new Error('Cannot disable a policy which is already disabled');
        }

        SponsorshipPolicy.update({ isEnabled: false }, { where: { id: id } });
    }

    async enableSponsorshipPolicy(id: number): Promise<void> {
        const existingSponsorshipPolicy = await this.findOneById(id);

        if (!existingSponsorshipPolicy) {
            throw new Error('Sponsorship Policy not found');
        }

        if (existingSponsorshipPolicy.isEnabled) {
            throw new Error('Cannot enable a policy which is already enabled');
        }

        SponsorshipPolicy.update({ isEnabled: true }, { where: { id: id } });
    }

    async deleteSponsorshipPolicy(id: number): Promise<number> {
        const existingSponsorshipPolicy = await this.findOneById(id);

        if (!existingSponsorshipPolicy) {
            throw new Error(`Sponsorship Policy deletion failed as Policy doesnot exist with id: ${id}`);
        }

        const deletedCount = await this.sequelize.models.SponsorshipPolicy.destroy({
            where
                : { id: id }
        });

        if (deletedCount === 0) {
            throw new Error(`SponsorshipPolicy deletion failed for id: ${id}`);
        }

        return deletedCount;
    }

    async deleteAllSponsorshipPolicies(): Promise<{ message: string }> {
        try {
            await this.sequelize.models.SponsorshipPolicy.destroy({ where: {} });
            return { message: 'Successfully deleted all policies' };
        } catch (err) {
            console.error(err);
            throw new Error('Failed to delete all policies');
        }
    }
}