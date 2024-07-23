export default {
    INVALID_DATA: 'Invalid data provided',
    INVALID_SPONSORSHIP_POLICY: 'Invalid sponsorship policy data',
    INVALID_SPONSORSHIP_POLICY_ID: 'Invalid sponsorship policy id',
    INVALID_API_KEY: 'Invalid Api Key',
    UNSUPPORTED_NETWORK: 'Unsupported network',
    UNSUPPORTED_NETWORK_TOKEN: 'Unsupported network/token',
    EMPTY_BODY: 'Empty Body received',
    API_KEY_IS_REQUIRED_IN_HEADER: 'Api Key is required in header',
    API_KEY_DOES_NOT_EXIST_FOR_THE_WALLET_ADDRESS: 'Api Key does not exist for the wallet address',
    WALLET_ADDRESS_DOES_NOT_MATCH_FOR_THE_API_KEY: 'Wallet address does not match for the Api Key',
    FAILED_TO_CREATE_SPONSORSHIP_POLICY: 'Failed to create sponsorship policy',
    FAILED_TO_UPDATE_SPONSORSHIP_POLICY: 'Failed to update sponsorship policy',
    SPONSORSHIP_POLICY_CHAINS_NOT_IN_SUBSET_OF_APIKEY_SUPPORTED_CHAINS: 'Sponsorship policy chains: {sponsorshipPolicyChains} are not in subset of ApiKey supported networks {apiKeyChains}',
    SPONSORSHIP_POLICY_NOT_FOUND: 'Sponsorship policy not found',
    ACTIVE_SPONSORSHIP_POLICY_NOT_FOUND: "Sponsorship policy not found for wallet address {walletAddress} with EP version {epVersion} and ChainId: ${chainId}",
    SPONSORSHIP_POLICY_ALREADY_EXISTS: 'Sponsorship policy already exists',
    NO_ACTIVE_SPONSORSHIP_POLICY_FOR_CURRENT_TIME: 'No active sponsorship policy for wallet address {walletAddress} with EP version {epVersion} and ChainId: ${chainId}',
    SPONSORSHIP_POLICY_IS_DISABLED: 'Sponsorship policy is disabled',
    FAILED_TO_DELETE_SPONSORSHIP_POLICY: 'Failed to delete sponsorship policy',
    FAILED_TO_ENABLE_SPONSORSHIP_POLICY: 'Failed to enable sponsorship policy - {error}',
    FAILED_TO_DISABLE_SPONSORSHIP_POLICY: 'Failed to disable sponsorship policy - {error}',
    FAILED_TO_QUERY_SPONSORSHIP_POLICY: 'Failed to query sponsorship policy',
    FAILED_TO_PROCESS: 'Failed to process the request. Please try again or contact ARKA support team',
    INVALID_MODE: 'Invalid mode selected',
    DUPLICATE_RECORD: 'Duplicate record found',
    ERROR_ON_SUBMITTING_TXN: 'The wallet does not have enough funds or the gas price is too high at the moment. Please try again later or contact support team',
    RPC_ERROR: 'rpcError while checking whitelist. Please try again later',
    QUOTA_EXCEEDED: 'Quota exceeded for this month',
    INVALID_USER: 'Unauthorised User',
    NOT_AUTHORIZED: 'Not authorized to perform this action',
    RECORD_NOT_FOUND: 'Api Key provided not found',
    API_KEY_VALIDATION_FAILED: 'Api Key is not in the right format as described in readme file',
    UNSUPPORTED_METHOD: 'Unsupported method name received',
    UNSUPPORTED_ENTRYPOINT: 'Unsupported EntryPoint Address',
    ADDRESS_ALREADY_ADDED: 'Addresses were already added',
    ADDRESS_NOT_WHITELISTED: 'Addresses sent were not whitelisted',
    NO_WHITELIST_FOUND: 'No whitelist were found on the given apiKey/policyId',
    INVALID_ADDRESS_PASSSED: 'Invalid Address passed',
}

export function generateErrorMessage(template: string, values: { [key: string]: string | number }): string {
    let message = template;
    for (const key in values) {
        if (!key || !values[key]) {
            message = message.replace(`{${key}}`, 'N/A');
        } else {
            message = message.replace(`{${key}}`, values[key].toString());
        }
    }
    return message;
}
