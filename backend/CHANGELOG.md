# Changelog
## [2.1.1] - 2025-01-09
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

## [1.8.0] - 2024-12-25
### Breaking changes
- removed `/whitelist/v1`, `/removeWhitelist/v1`, `/checkWhitelist/v1` endpoints.
- removed `/whitelist/v2`, `/removeWhitelist/v2`, `/checkWhitelist/v2` endpoints.

### New
- added support for VerifyingPaymaster allowing users to deploy their individual paymaster contracts for both EPV6 and EPV7.
- added `/deploVerifyingPaymaster`, `/addStake` endpoints.
- added `/whitelist`, `/removeWhitelist`, `/checkWhitelist` endpoints which accepts `useEp` in query params which when set to true uses EtherspotPaymaster contracts instead of VerifyingPaymaster.