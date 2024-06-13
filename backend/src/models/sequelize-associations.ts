import { APIKey } from './api-key';
import { SponsorshipPolicy } from './sponsorship-policy';

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
}
