# Changelog
## [2.0.1] - 2025-01-17
### Fixes
- Signing of MTP happens after estimation
- Updated supportedNetworks to use from default if apiKey specific config is not found

## [1.8.0] - 2024-12-25
### Breaking changes
- removed `/whitelist/v1`, `/removeWhitelist/v1`, `/checkWhitelist/v1` endpoints.
- removed `/whitelist/v2`, `/removeWhitelist/v2`, `/checkWhitelist/v2` endpoints.

### New
- added support for VerifyingPaymaster allowing users to deploy their individual paymaster contracts for both EPV6 and EPV7.
- added `/deploVerifyingPaymaster`, `/addStake` endpoints.
- added `/whitelist`, `/removeWhitelist`, `/checkWhitelist` endpoints which accepts `useEp` in query params which when set to true uses EtherspotPaymaster contracts instead of VerifyingPaymaster.