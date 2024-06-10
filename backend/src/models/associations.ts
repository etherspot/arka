// associations.ts
import { APIKey } from './APIKey';
import { SponsorshipPolicy } from './SponsorshipPolicy';
import { SponsorshipPolicyChain } from './SponsorshipPolicyChain';
import { SponsorshipPolicyLimit } from './SponsorshipPolicyLimit';

export function setupAssociations() {
    // APIKey to Policy
    APIKey.hasMany(SponsorshipPolicy, {
        foreignKey: 'walletAddress',
        sourceKey: 'walletAddress', // This is the new line
        as: 'sponsorshipPolicies',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    SponsorshipPolicy.belongsTo(APIKey, {
        foreignKey: 'walletAddress',
        targetKey: 'walletAddress',
        as: 'apiKey',  // Optional alias
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // Policy to PolicyChain
    SponsorshipPolicy.hasMany(SponsorshipPolicyChain, {
        foreignKey: 'policyId',
        as: 'policyChains',  // Optional alias for easier access in code
        onDelete: 'CASCADE',  // Ensures related policy chains are deleted when a Policy is deleted
        onUpdate: 'CASCADE'
    });

    SponsorshipPolicyChain.belongsTo(SponsorshipPolicy, {
        foreignKey: 'policyId',
        as: 'policy',  // Optional alias
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // Policy to PolicyLimit
    SponsorshipPolicy.hasMany(SponsorshipPolicyLimit, {
        foreignKey: 'policyId',
        as: 'policyLimits',  // Optional alias for easier access in code
        onDelete: 'CASCADE',  // Ensures related policy limits are deleted when a Policy is deleted
        onUpdate: 'CASCADE'
    });

    SponsorshipPolicyLimit.belongsTo(SponsorshipPolicy, {
        foreignKey: 'policyId',
        as: 'policy',  // Optional alias
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
}
