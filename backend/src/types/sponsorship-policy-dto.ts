// DTO for receiving data in the POST request to create a sponsorship policy
export interface SponsorshipPolicyDto {
    id: number;              // ID of the policy
    walletAddress: string;         // The wallet address associated with the API key
    name: string;                  // Name of the sponsorship policy
    description: string;           // Description of the sponsorship policy
    isPublic: boolean;             // Flag to indicate if the policy is public
    isEnabled: boolean;            // Flag to indicate if the policy is enabled
    isUniversal: boolean;          // Flag to indicate if the policy is universal
    enabledChains?: number[];      // Array of enabled chain IDs
    isPerpetual: boolean;          // Flag to indicate if the policy is perpetual
    startDate?: string;            // Optional start date for the policy
    endDate?: string;              // Optional end date for the policy
    globalMaximumApplicable: boolean; // Flag to indicate if the global maximum is applicable
    globalMaximumUsd?: number; // Optional global maximum USD limit
    globalMaximumNative?: number; // Optional global maximum native limit
    globalMaximumOpCount?: number; // Optional global maximum operation count
    perUserMaximumApplicable: boolean; // Flag to indicate if the per user maximum is applicable
    perUserMaximumUsd?: number; // Optional per user maximum USD limit
    perUserMaximumNative?: number; //   Optional per user maximum native limit 
    perUserMaximumOpCount?: number; // Optional per user maximum operation count
    perOpMaximumApplicable: boolean; // Flag to indicate if the per operation maximum is applicable
    perOpMaximumUsd?: number; // Optional per operation maximum USD limit
    perOpMaximumNative?: number; // Optional per operation maximum native limit
    addressAllowList?: string[]; // Optional array of allowed addresses
    addressBlockList?: string[]; // Optional array of blocked addresses
    isExpired: boolean; // Flag to indicate if the policy is expired
    isCurrent: boolean; // Flag to indicate if the policy is current
    isApplicable: boolean; // Flag to indicate if the policy is applicable
    createdAt: Date; // Date the policy was created
    updatedAt: Date; // Date the policy was last updated
}
