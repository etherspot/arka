import { createConfig } from "@ponder/core";
import { http } from "viem";
import SupportedNetworks from "../config.json";
import { EtherspotPaymasterAbi } from "./EtherspotAbi";
 
export default createConfig({
  networks: {
    mainnet: { chainId: 1, transport: http((SupportedNetworks.find((chain) => chain.chainId == 1))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    goerli: { chainId: 5, transport: http((SupportedNetworks.find((chain) => chain.chainId == 5))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    optimism: { chainId: 10, transport: http((SupportedNetworks.find((chain) => chain.chainId == 10))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    flare: { chainId: 14, transport: http((SupportedNetworks.find((chain) => chain.chainId == 14))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    bnb: { chainId: 56, transport: http((SupportedNetworks.find((chain) => chain.chainId == 56))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    bnbTestnet: { chainId: 97, transport: http((SupportedNetworks.find((chain) => chain.chainId == 97))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    gnosis: { chainId: 100, transport: http((SupportedNetworks.find((chain) => chain.chainId == 100))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    flareTestnet: { chainId: 114, transport: http((SupportedNetworks.find((chain) => chain.chainId == 114))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    fuse: { chainId: 122, transport: http((SupportedNetworks.find((chain) => chain.chainId == 122))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    polygon: { chainId: 137, transport: http((SupportedNetworks.find((chain) => chain.chainId == 137))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    opGoerli: { chainId: 420, transport: http((SupportedNetworks.find((chain) => chain.chainId == 420))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    klaytnTestnet: { chainId: 1001, transport: http((SupportedNetworks.find((chain) => chain.chainId == 1001))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    mantle: { chainId: 5000, transport: http((SupportedNetworks.find((chain) => chain.chainId == 5000))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    mantleTestnet: { chainId: 5001, transport: http((SupportedNetworks.find((chain) => chain.chainId == 5001))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    klaytn: { chainId: 8217, transport: http((SupportedNetworks.find((chain) => chain.chainId == 8217))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    base: { chainId: 8453, transport: http((SupportedNetworks.find((chain) => chain.chainId == 8453))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    arbitrum: { chainId: 42161, transport: http((SupportedNetworks.find((chain) => chain.chainId == 42161))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    avalanche:  { chainId: 43114, transport: http((SupportedNetworks.find((chain) => chain.chainId == 43114))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    linea: { chainId: 59144, transport: http((SupportedNetworks.find((chain) => chain.chainId == 59144))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    mumbai: { chainId: 80001, transport: http((SupportedNetworks.find((chain) => chain.chainId == 80001))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 1 },
    baseGoerli: { chainId: 84531, transport: http((SupportedNetworks.find((chain) => chain.chainId == 84531))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    arbitrumGoerli: { chainId: 421613, transport: http((SupportedNetworks.find((chain) => chain.chainId == 421613))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    scrollSepolia: { chainId: 534351, transport: http((SupportedNetworks.find((chain) => chain.chainId == 534351))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
    sepolia: { chainId: 11155111, transport: http((SupportedNetworks.find((chain) => chain.chainId == 11155111))?.bundler), maxHistoricalTaskConcurrency: 1, maxRequestsPerSecond: 10 },
  },
  contracts: {
    EtherspotPaymaster: {
      abi: EtherspotPaymasterAbi,
      network: {
        mainnet: {
          address: '0x7F690e93CecFca5A31E6e1dF50A33F6d3059048c',
          startBlock: 18026150
        },
        goerli: {
          address: "0xcaDBADcFeD5530A49762DFc9d1d712CcD6b09b25",
          startBlock: 9600295
        },
        optimism: {
          address: "0x805650ce74561C85baA44a8Bd13E19633Fd0F79d",
          startBlock: 108859074
        },
        flare: {
          address: "0x8A41594e5c6Fe492e437414c24eA6f401186b8d2",
          startBlock: 13893451
        },
        bnb: {
          address: "0xEA5ecE95D3A28f9faB161779d20128b449F9EC9C",
          startBlock: 31278246
        },
        bnbTestnet: {
          address: "0x153e26707DF3787183945B88121E4Eb188FDCAAA",
          startBlock: 32874243
        },
        gnosis: {
          address: "0x373aBcF1EA9e5802778E32870e7f72C8A6a90349",
          startBlock: 29705973
        },
        flareTestnet: {
          address: "0x2a18C360b525824B3e5656B5a705554f2a5036Be",
          startBlock: 6417126
        },
        fuse: {
          address: "0xEC2EE24E79C73DB13Dd9bC782856a5296626b7eb",
          startBlock: 25126646
        },
        polygon: {
          address: "0x26FeC24b0D467C9de105217B483931e8f944ff50",
          startBlock: 46898238
        },
        opGoerli: {
          address: "0x898c530A5fA37720DcF1843AeCC34b6B0cBaEB8a",
          startBlock: 13936022
        },
        klaytnTestnet: {
          address: "0x810FA4C915015b703db0878CF2B9344bEB254a40",
          startBlock: 131731991
        },
        mantle: {
          address: "0x8A41594e5c6Fe492e437414c24eA6f401186b8d2",
          startBlock: 3588793
        },
        mantleTestnet: {
          address: "0xb56eC212C60C47fb7385f13b7247886FFa5E9D5C",
          startBlock: 19258864
        },
        klaytn: {
          address: "0x4ebd86AAF89151b5303DB072e0205C668e31E5E7",
          startBlock: 131354386
        },
        base: {
          address: "0x810FA4C915015b703db0878CF2B9344bEB254a40",
          startBlock: 3265420
        },
        arbitrum: {
          address: "0xEC2EE24E79C73DB13Dd9bC782856a5296626b7eb",
          startBlock: 126094060
        },
        avalanche: {
          address: "0x527569794781671319f20374A050BDbef4181aB3",
          startBlock: 34521365
        },
        linea: {
          address: "0xB3AD9B9B06c6016f81404ee8FcCD0526F018Cf0C",
          startBlock: 303424
        },
        mumbai: {
          address: "0x8350355c08aDAC387b443782124A30A8942BeC2e",
          startBlock: 41860287
        },
        baseGoerli: {
          address: "0x898c530A5fA37720DcF1843AeCC34b6B0cBaEB8a",
          startBlock: 9059086
        },
        arbitrumGoerli: {
          address: "0x898c530A5fA37720DcF1843AeCC34b6B0cBaEB8a",
        },
        scrollSepolia: {
          address: "0xe893A26DD53b325BffAacDfA224692EfF4C448c4",
          startBlock: 386998
        },
        sepolia: {
          address: "0xcaDBADcFeD5530A49762DFc9d1d712CcD6b09b25",
          startBlock: 4183498
        }
      },
      filter: { event: "SponsorSuccessful" },
      maxBlockRange: 5,
    },
  },
});
