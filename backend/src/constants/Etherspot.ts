interface NetworkConfig {
    chainId: number;
    bundler: string;
    contracts: {
        paymasterAddress: string;
    };
}

const Networks: {
    [key: string]: NetworkConfig
} = {
    [5]: {
        chainId: 5,
        bundler: 'https://goerli-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0xcaDBADcFeD5530A49762DFc9d1d712CcD6b09b25',
        }
    },
    [80001]: {
        chainId: 80001,
        bundler: 'https://mumbai-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0x8350355c08aDAC387b443782124A30A8942BeC2e',
        }
    },
    [84531]: {
        chainId: 84531,
        bundler: 'https://basegoerli-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0x898c530A5fA37720DcF1843AeCC34b6B0cBaEB8a',
        }
    },
    [11155111]: {
        chainId: 11155111,
        bundler: 'https://sepolia-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0xcaDBADcFeD5530A49762DFc9d1d712CcD6b09b25',
        }
    },
    [10]: {
        chainId: 10,
        bundler: 'https://optimism-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0x805650ce74561C85baA44a8Bd13E19633Fd0F79d',
        }
    },
    [137]: {
        chainId: 137,
        bundler: 'https://polygon-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0x26FeC24b0D467C9de105217B483931e8f944ff50',
        }
    },
    [42161]: {
        chainId: 42161,
        bundler: 'https://arbitrum-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0xEC2EE24E79C73DB13Dd9bC782856a5296626b7eb',
        }
    },
    [1]: {
        chainId: 1,
        bundler: 'https://ethereum-bundler.etherspot.io/',
        contracts: {
            paymasterAddress: '0x7F690e93CecFca5A31E6e1dF50A33F6d3059048c',
        }
    },
    [421613]: {
        chainId: 421613,
        bundler: 'https://arbitrumgoerli-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0x898c530A5fA37720DcF1843AeCC34b6B0cBaEB8a',
        }
    },
    [122]: {
        chainId: 122,
        bundler: 'https://fuse-bundler.etherspot.io',
        contracts: {
            paymasterAddress: '0xEC2EE24E79C73DB13Dd9bC782856a5296626b7eb',
        }
    },
    [5000]: {
        chainId: 5000,
        bundler: 'https://mantle-bundler.etherspot.io/',
        contracts: {
            paymasterAddress: '0x8A41594e5c6Fe492e437414c24eA6f401186b8d2',
        }
    },
};

export function getNetworkConfig(key: number) {
    return Networks[key];
}