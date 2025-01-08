# Changelog
## [2.0.1] - 2025-01-08
### New
- added `/whitelist/v2`, `/removeWhitelist/v2` and `/checkWhitelist/v2` endpoints back.
- `/whitelist`, `/removeWhitelist`, `checkWhitelist`, `/deposit/v2`, `/` endpoints accept `useVp` param which when set to true uses VerifyingPaymaster contract instead of EtherspotPaymaster.


## [2.0.0] - 2024-12-25
### Breaking changes
- removed `/whitelist/v2`, `/removeWhitelist/v2`, `/checkWhitelist/v2` endpoints.

### New
- added support for VerifyingPaymaster allowing users to deploy their individual paymaster contracts for both EPV6 and EPV7.
- added `/deploVerifyingPaymaster`, `/addStake` endpoints.
- added `/whitelist`, `/removeWhitelist`, `/checkWhitelist` endpoints which accepts `useEp` in query params which when set to true uses EtherspotPaymaster contracts instead of VerifyingPaymaster.