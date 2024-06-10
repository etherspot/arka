// associations.ts
import { APIKey } from './APIKey';
import { Policy } from './Policy';
import { PolicyChain } from './PolicyChain';
import { PolicyLimit } from './PolicyLimit';

export function setupAssociations() {
    // APIKey to Policy
    APIKey.hasMany(Policy, {
        foreignKey: 'walletAddress',
        as: 'policies',  // Optional alias for easier access in code
        onDelete: 'CASCADE',  // Ensures related policies are deleted when an APIKey is deleted
        onUpdate: 'CASCADE'  // Ensures changes in APIKey are cascaded to policies
    });

    Policy.belongsTo(APIKey, {
        foreignKey: 'walletAddress',
        as: 'apiKey',  // Optional alias
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // Policy to PolicyChain
    Policy.hasMany(PolicyChain, {
        foreignKey: 'policyId',
        as: 'policyChains',  // Optional alias for easier access in code
        onDelete: 'CASCADE',  // Ensures related policy chains are deleted when a Policy is deleted
        onUpdate: 'CASCADE'
    });

    PolicyChain.belongsTo(Policy, {
        foreignKey: 'policyId',
        as: 'policy',  // Optional alias
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // Policy to PolicyLimit
    Policy.hasMany(PolicyLimit, {
        foreignKey: 'policyId',
        as: 'policyLimits',  // Optional alias for easier access in code
        onDelete: 'CASCADE',  // Ensures related policy limits are deleted when a Policy is deleted
        onUpdate: 'CASCADE'
    });

    PolicyLimit.belongsTo(Policy, {
        foreignKey: 'policyId',
        as: 'policy',  // Optional alias
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
}
