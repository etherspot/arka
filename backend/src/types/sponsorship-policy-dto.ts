// DTO for receiving data in the POST request to create a sponsorship policy
export interface SponsorshipPolicyDto {
    id?: number;              // ID of the policy
    walletAddress: string;         // The wallet address associated with the API key
    name: string;                  // Name of the sponsorship policy
    description: string;           // Description of the sponsorship policy
    isPublic: boolean;             // Flag to indicate if the policy is public
    isEnabled: boolean;            // Flag to indicate if the policy is enabled
    isApplicableToAllNetworks: boolean;          // Flag to indicate if the policy is universal
    enabledChains?: number[];      // Array of enabled chain IDs
    isPerpetual: boolean;          // Flag to indicate if the policy is perpetual
    startTime?: Date | null;            // Optional start date for the policy
    endTime?: Date | null;              // Optional end date for the policy
    globalMaximumApplicable: boolean; // Flag to indicate if the global maximum is applicable
    globalMaximumUsd?: number | null; // Optional global maximum USD limit
    globalMaximumNative?: number | null; // Optional global maximum native limit
    globalMaximumOpCount?: number | null; // Optional global maximum operation count
    perUserMaximumApplicable: boolean; // Flag to indicate if the per user maximum is applicable
    perUserMaximumUsd?: number | null; // Optional per user maximum USD limit
    perUserMaximumNative?: number | null; //   Optional per user maximum native limit 
    perUserMaximumOpCount?: number; // Optional per user maximum operation count
    perOpMaximumApplicable: boolean; // Flag to indicate if the per operation maximum is applicable
    perOpMaximumUsd?: number | null; // Optional per operation maximum USD limit
    perOpMaximumNative?: number | null; // Optional per operation maximum native limit
    addressAllowList?: string[] | null; // Optional array of allowed addresses
    addressBlockList?: string[] | null; // Optional array of blocked addresses
    isExpired: boolean; // Flag to indicate if the policy is expired
    isCurrent: boolean; // Flag to indicate if the policy is current
    isApplicable: boolean; // Flag to indicate if the policy is applicable
    createdAt: Date; // Date the policy was created
    updatedAt: Date; // Date the policy was last updated
}
