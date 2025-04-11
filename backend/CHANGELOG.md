# Changelog
## [3.2.0] - 2025-04-01
### New
- Added EPV08 Support

## [3.1.6] - 2025-04-02
### Fixes
- Fixed bug in paymaster estimation for multiTokenPaymaster getERC20Quotes API

## [3.1.5] - 2025-03-24
### Fixes
- Added all tokens used in multiTokenPaymaster to have decimals in constants rather than fetching from rpc 

## [3.1.4] - 2025-03-19
### Fixes
- Changed all endpoints to be case-insensitive
- Fetch `globalMaximumUsd` value to convert into Number for absolute value
- Improve error handling in deposit apis

## [3.1.3] - 2025-03-13
### Fixes
- Fixed Verifying Paymaster execution for undeployed wallets

## [3.1.2] - 2025-02-28
### Fixes
- Fixed invalid address error on cronJob

## [3.1.1] - 2025-02-14
### Fixes
- Fixed return type of paymasterVerificationGasLimit
- Added paymasterVerificationGasLimit to optional configurable env value and defaults to '30000'

## [3.1.0] - 2025-01-28
### New
- Added a separate mode for all the common erc20 paymasters in mind that in future will replace the current erc20 mode

## [3.0.3] - 2025-02-11
### Fixes
- Checked for undefined values on body params

## [3.0.2] - 2025-02-11
- Using Skandha for gas data for better transaction inclusion.
- USE_SKANDHA_FOR_GAS_DATA set this property to false to disable.
## [3.0.1] - 2025-02-04
### Fixes
- Changed error message to more meaningful reply
- Added API to reflect whats been cached on runtime

## [3.0.0] - 2025-01-09
### Breaking Changes
- changed `pimlicoAddress` endpoint name to `tokenPaymasterAddress` the functionality remains the same
- Changed the following endpoint names to be camelCases:-
  - `/policy/wallet-address/:walletAddress` to `/policy/walletAddress/:walletAddress`
  - `/policy/wallet-address/:walletAddress/ep-version/:epVersion` to `/policy/walletAddress/:walletAddress/epVersion/:epVersion`
  - `/policy/wallet-address/:walletAddress/ep-version/:epVersion/chain-id/:chainId` to `/policy/walletAddress/:walletAddress/epVersion/:epVersion/chainId/:chainId`
  - `/policy/wallet-address/:walletAddress/latest` to `/policy/walletAddress/:walletAddress/latest`
  - `/policy/wallet-address/:walletAddress/chain-id/:chainId/latest` to `/policy/walletAddress/:walletAddress/chainId/:chainId/latest`
  - `/policy/wallet-address/:walletAddress/ep-version/:epVersion/latest` to `/policy/walletAddress/:walletAddress/epVersion/:epVersion/latest`
  - `/policy/wallet-address/:walletAddress/ep-version/:epVersion/chainId/:chain-id/latest` to `/policy/walletAddress/:walletAddress/epVersion/:epVersion/chainId/:chainId/latest`
  - `/add-policy` to `/addPolicy`
  - `/delete-policy/:id` to `/deletePolicy/:id`
  - `/update-policy` to `/updatePolicy`
  - `/enable-policy/:id` to `/enablePolicy/:id`
  - `/disable-policy/:id` to `/disablePolicy/:id`

## [2.1.1] - 2025-01-21
### Bug Fixes
- Updated from master branch on bug fixes for MTP

## [2.0.1] - 2025-01-08
### New
- added `/whitelist/v2`, `/removeWhitelist/v2` and `/checkWhitelist/v2` endpoints back.
- `/whitelist`, `/removeWhitelist`, `checkWhitelist`, `/deposit/v2`, `/` endpoints accept `useVp` param which when set to true uses VerifyingPaymaster contract instead of EtherspotPaymaster.
- added coingecko support for token prices alone
- Added fetching of api_key data from db and for hosted setup only private key gets fetched from aws
- added `metadata/v2` api for ep7 config


## [2.0.0] - 2024-12-25
### Breaking changes
- removed `/whitelist/v2`, `/removeWhitelist/v2`, `/checkWhitelist/v2` endpoints.

### New
- added support for VerifyingPaymaster allowing users to deploy their individual paymaster contracts for both EPV6 and EPV7.
- added `/deploVerifyingPaymaster`, `/addStake` endpoints.
- added `/whitelist`, `/removeWhitelist`, `/checkWhitelist` endpoints which accepts `useEp` in query params which when set to true uses EtherspotPaymaster contracts instead of VerifyingPaymaster.