export default {
    CONTEXT_NOT_ARRAY: 'Context sent is not an array',
    INVALID_DATA: 'Invalid data provided',
    INVALID_SPONSORSHIP_POLICY: 'Invalid sponsorship policy data',
    INVALID_SPONSORSHIP_POLICY_ID: 'Invalid sponsorship policy id',
    INVALID_API_KEY: 'Invalid Api Key',
    API_KEY_NOT_CONFIGURED_IN_DATABASE: 'Api Key not configured in database',
    UNSUPPORTED_NETWORK: 'Unsupported network',
    UNSUPPORTED_NETWORK_TOKEN: 'Unsupported network/token',
    UNSUPPORTED_TOKEN: 'Unsupported token',
    MISSING_PARAMS: 'You have not supplied the required input parameters for this function/endpoint',
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
    FAILED_TO_CREATE_CONTRACT_WHITELIST: 'Failed to create a record on contract whitelist',
    FAILED_TO_UPDATE_CONTRACT_WHITELIST: 'Failed to update the record on contract whitelist',
    FAILED_TO_DELETE_CONTRACT_WHITELIST: 'Failed to delete the record on contract whitelist',
    NO_CONTRACT_WHITELIST_FOUND: 'No contract whitelist found for the given chainId, apiKey and contractAddress passed',
    RECORD_ALREADY_EXISTS_CONTRACT_WHITELIST: 'Record already exists for the chainId, apiKey and contractAddress passed',
    BALANCE_EXCEEDS_THRESHOLD: 'Balance exceeds threshold to delete key',
    INVALID_SIGNATURE_OR_TIMESTAMP: 'Invalid signature or timestamp',
    VP_NOT_DEPLOYED: 'Verifying paymaster not deployed',
    INVALID_EP_VERSION: 'Invalid EntryPoint version',
    VP_ALREADY_DEPLOYED: 'Verifying paymaster already deployed',
    FAILED_TO_DEPLOY_VP: 'Failed to deploy verifying paymaster',
    FAILED_TO_ADD_STAKE: 'Failed to add stake',
    INVALID_AMOUNT_TO_STAKE: 'Invalid amount to stake',
    NO_KEY_SET: 'No MTP key set',
    MULTI_NOT_DEPLOYED: 'Token Paymaster not deployed on the current chainID: ',
    COINGECKO_PRICE_NOT_FETCHED: 'Token price not updated, Pls retry.'
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
