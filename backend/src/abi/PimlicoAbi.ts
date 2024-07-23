export default [
    {
        inputs: [
            {
                internalType: "contract IERC20Metadata",
                name: "_token",
                type: "address"
            },
            {
                internalType: "contract IEntryPoint",
                name: "_entryPoint",
                type: "address"
            },
            {
                internalType: "contract IOracle",
                name: "_tokenOracle",
                type: "address"
            },
            {
                internalType: "contract IOracle",
                name: "_nativeAssetOracle",
                type: "address"
            },
            {
                internalType: "address",
                name: "_owner",
                type: "address"
            }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint32",
                name: "priceMarkup",
                type: "uint32"
            },
            {
                indexed: false,
                internalType: "uint32",
                name: "updateThreshold",
                type: "uint32"
            }
        ],
        name: "ConfigUpdated",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address"
            }
        ],
        name: "OwnershipTransferred",
        type: "event"
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "user",
                type: "address"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "actualTokenNeeded",
                type: "uint256"
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "actualGasCost",
                type: "uint256"
            }
        ],
        name: "UserOperationSponsored",
        type: "event"
    },
    {
        inputs: [],
        name: "REFUND_POSTOP_COST",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint32",
                name: "unstakeDelaySec",
                type: "uint32"
            }
        ],
        name: "addStake",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "deposit",
        outputs: [],
        stateMutability: "payable",
        type: "function"
    },
    {
        inputs: [],
        name: "entryPoint",
        outputs: [
            {
                internalType: "contract IEntryPoint",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getDeposit",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "nativeAssetOracle",
        outputs: [
            {
                internalType: "contract IOracle",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "enum IPaymaster.PostOpMode",
                name: "mode",
                type: "uint8"
            },
            {
                internalType: "bytes",
                name: "context",
                type: "bytes"
            },
            {
                internalType: "uint256",
                name: "actualGasCost",
                type: "uint256"
            }
        ],
        name: "postOp",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "previousPrice",
        outputs: [
            {
                internalType: "uint192",
                name: "",
                type: "uint192"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "priceDenominator",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "priceMarkup",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "priceUpdateThreshold",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "token",
        outputs: [
            {
                internalType: "contract IERC20",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "tokenDecimals",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "tokenOracle",
        outputs: [
            {
                internalType: "contract IOracle",
                name: "",
                type: "address"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "newOwner",
                type: "address"
            }
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "unlockStake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "uint32",
                name: "_priceMarkup",
                type: "uint32"
            },
            {
                internalType: "uint32",
                name: "_updateThreshold",
                type: "uint32"
            }
        ],
        name: "updateConfig",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [],
        name: "updatePrice",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "sender",
                        type: "address"
                    },
                    {
                        internalType: "uint256",
                        name: "nonce",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "initCode",
                        type: "bytes"
                    },
                    {
                        internalType: "bytes",
                        name: "callData",
                        type: "bytes"
                    },
                    {
                        internalType: "uint256",
                        name: "callGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "verificationGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "preVerificationGas",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "maxFeePerGas",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "maxPriorityFeePerGas",
                        type: "uint256"
                    },
                    {
                        internalType: "bytes",
                        name: "paymasterAndData",
                        type: "bytes"
                    },
                    {
                        internalType: "bytes",
                        name: "signature",
                        type: "bytes"
                    }
                ],
                internalType: "struct UserOperation",
                name: "userOp",
                type: "tuple"
            },
            {
                internalType: "bytes32",
                name: "userOpHash",
                type: "bytes32"
            },
            {
                internalType: "uint256",
                name: "maxCost",
                type: "uint256"
            }
        ],
        name: "validatePaymasterUserOp",
        outputs: [
            {
                internalType: "bytes",
                name: "context",
                type: "bytes"
            },
            {
                internalType: "uint256",
                name: "validationData",
                type: "uint256"
            }
        ],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address payable",
                name: "withdrawAddress",
                type: "address"
            }
        ],
        name: "withdrawStake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address payable",
                name: "withdrawAddress",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256"
            }
        ],
        name: "withdrawTo",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "to",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256"
            }
        ],
        name: "withdrawToken",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const;