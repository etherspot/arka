import { APIKey } from './api-key';
import { SponsorshipPolicy } from './sponsorship-policy';
import { SponsorshipPolicyLimit } from './sponsorship-policy-limit';

export function setupAssociations() {

    /**
     * APIKey to SponsorshipPolicy
     * A single APIKey (the parent) can have many SponsorshipPolicy (the children). 
     * The link between them is made using the 'walletAddress' field of the APIKey and the 'walletAddress' field of the SponsorshipPolicy.
     */
    APIKey.hasMany(SponsorshipPolicy, {
        foreignKey: 'walletAddress',
        sourceKey: 'walletAddress',
        as: 'sponsorshipPolicies'
    });

    /**
     * SponsorshipPolicy to APIKey
     * A single SponsorshipPolicy (the child) belongs to one APIKey (the parent). 
     * The link between them is made using the 'walletAddress' field of the SponsorshipPolicy and the 'walletAddress' field of the APIKey.
     */
    SponsorshipPolicy.belongsTo(APIKey, {
        foreignKey: 'walletAddress',
        targetKey: 'walletAddress',
        as: 'apiKey',  // Optional alias
    });

    /**
     * SponsorshipPolicy to SponsorshipPolicyLimit
     * A single SponsorshipPolicy (the parent) can have many SponsorshipPolicyLimits (the children). 
     * The link between them is made using the 'id' field of the SponsorshipPolicy and the 'policyId' field of the SponsorshipPolicyLimit.
     */
    SponsorshipPolicy.hasMany(SponsorshipPolicyLimit, {
        foreignKey: 'policyId',
        sourceKey: 'id',
        as: 'sponsorshipPolicyLimits'
    });

    /**
     * SponsorshipPolicyLimit to SponsorshipPolicy
     * A single SponsorshipPolicyLimit (the child) belongs to one SponsorshipPolicy (the parent). 
     * The link between them is made using the 'policyId' field of the SponsorshipPolicyLimit and the 'id' field of the SponsorshipPolicy.
     */
    SponsorshipPolicyLimit.belongsTo(SponsorshipPolicy, {
        foreignKey: 'policyId',
        targetKey: 'id',
        as: 'sponsorshipPolicy'
    });
}
