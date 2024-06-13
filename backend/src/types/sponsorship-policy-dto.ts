
// DTO for receiving data in the POST request to create a sponsorship policy
export interface CreateSponsorshipPolicyDTO {
    walletAddress: string;         // The wallet address associated with the API key
    name: string;                  // Name of the sponsorship policy
    description: string;           // Description of the sponsorship policy
    startDate?: string;            // Optional start date for the policy
    endDate?: string;              // Optional end date for the policy
    isPerpetual: boolean;          // Flag to indicate if the policy is perpetual
    contractRestrictions?: string; // JSON string containing any contract-specific restrictions
    limits: SponsorshipPolicyLimitDTO[];  // Array of limits associated with the policy
}

// DTO for sponsorship policy limits
export interface SponsorshipPolicyLimitDTO {
    limitType: LimitType;  // Type of limit (GLOBAL, PER_USER, PER_OPERATION)
    maxUsd?: number;    // Optional maximum USD limit
    maxEth?: number;    // Optional maximum ETH limit
    maxOperations?: number; // Optional maximum number of operations
}

// enum for LimitTypes
export enum LimitType {
    GLOBAL = 'GLOBAL',
    PER_USER = 'PER_USER',
    PER_OPERATION = 'PER_OPERATION'
}