# Changelog
## [3.1.0] - 2025-01-28
### New
- Added a separate mode for all the common erc20 paymasters in mind that in future will replace the current erc20 mode

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