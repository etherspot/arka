export default [
	{
			"inputs": [
					{
							"internalType": "string",
							"name": "_pairName",
							"type": "string"
					},
					{
							"internalType": "address",
							"name": "_token",
							"type": "address"
					},
					{
							"internalType": "address",
							"name": "_owner",
							"type": "address"
					}
			],
			"stateMutability": "nonpayable",
			"type": "constructor"
	},
	{
			"inputs": [],
			"name": "ActiveOracle",
			"type": "error"
	},
	{
			"inputs": [],
			"name": "InactiveOracle",
			"type": "error"
	},
	{
			"inputs": [],
			"name": "InvalidOwner",
			"type": "error"
	},
	{
			"inputs": [
					{
							"internalType": "uint256",
							"name": "currentTime",
							"type": "uint256"
					},
					{
							"internalType": "uint256",
							"name": "priceLastUpdatedAt",
							"type": "uint256"
					},
					{
							"internalType": "uint256",
							"name": "outdatedBy",
							"type": "uint256"
					}
			],
			"name": "StalePriceData",
			"type": "error"
	},
	{
			"anonymous": false,
			"inputs": [
					{
							"indexed": true,
							"internalType": "address",
							"name": "previousOwner",
							"type": "address"
					},
					{
							"indexed": true,
							"internalType": "address",
							"name": "newOwner",
							"type": "address"
					}
			],
			"name": "OwnershipTransferred",
			"type": "event"
	},
	{
			"anonymous": false,
			"inputs": [],
			"name": "PriceFeedUpdated",
			"type": "event"
	},
	{
			"anonymous": false,
			"inputs": [
					{
							"indexed": false,
							"internalType": "uint80",
							"name": "roundId",
							"type": "uint80"
					},
					{
							"indexed": false,
							"internalType": "int256",
							"name": "answer",
							"type": "int256"
					},
					{
							"indexed": false,
							"internalType": "uint256",
							"name": "startedAt",
							"type": "uint256"
					},
					{
							"indexed": false,
							"internalType": "uint256",
							"name": "updatedAt",
							"type": "uint256"
					},
					{
							"indexed": false,
							"internalType": "uint80",
							"name": "answeredInRound",
							"type": "uint80"
					}
			],
			"name": "ReceivedPriceData",
			"type": "event"
	},
	{
			"anonymous": false,
			"inputs": [
					{
							"indexed": false,
							"internalType": "address",
							"name": "token",
							"type": "address"
					},
					{
							"indexed": false,
							"internalType": "uint256",
							"name": "timestamp",
							"type": "uint256"
					}
			],
			"name": "UpdateReceived",
			"type": "event"
	},
	{
			"anonymous": false,
			"inputs": [
					{
							"indexed": false,
							"internalType": "address",
							"name": "token",
							"type": "address"
					},
					{
							"indexed": false,
							"internalType": "uint256",
							"name": "timestamp",
							"type": "uint256"
					}
			],
			"name": "UpdateRequested",
			"type": "event"
	},
	{
			"inputs": [],
			"name": "AGE",
			"outputs": [
					{
							"internalType": "uint256",
							"name": "",
							"type": "uint256"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "VERSION",
			"outputs": [
					{
							"internalType": "string",
							"name": "",
							"type": "string"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "activateOracle",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "active",
			"outputs": [
					{
							"internalType": "bool",
							"name": "",
							"type": "bool"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "cachedPrice",
			"outputs": [
					{
							"internalType": "uint256",
							"name": "",
							"type": "uint256"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "deactivateOracle",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "decimals",
			"outputs": [
					{
							"internalType": "uint8",
							"name": "",
							"type": "uint8"
					}
			],
			"stateMutability": "pure",
			"type": "function"
	},
	{
			"inputs": [
					{
							"internalType": "uint256",
							"name": "_price",
							"type": "uint256"
					}
			],
			"name": "fulfillPriceData",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "latestRoundData",
			"outputs": [
					{
							"internalType": "uint80",
							"name": "roundId",
							"type": "uint80"
					},
					{
							"internalType": "int256",
							"name": "answer",
							"type": "int256"
					},
					{
							"internalType": "uint256",
							"name": "startedAt",
							"type": "uint256"
					},
					{
							"internalType": "uint256",
							"name": "updatedAt",
							"type": "uint256"
					},
					{
							"internalType": "uint80",
							"name": "answeredInRound",
							"type": "uint80"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "owner",
			"outputs": [
					{
							"internalType": "address",
							"name": "",
							"type": "address"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "pairName",
			"outputs": [
					{
							"internalType": "string",
							"name": "",
							"type": "string"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "priceLastUpdatedAt",
			"outputs": [
					{
							"internalType": "uint256",
							"name": "",
							"type": "uint256"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "renounceOwnership",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "requestPriceData",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
	},
	{
			"inputs": [],
			"name": "token",
			"outputs": [
					{
							"internalType": "address",
							"name": "",
							"type": "address"
					}
			],
			"stateMutability": "view",
			"type": "function"
	},
	{
			"inputs": [
					{
							"internalType": "address",
							"name": "newOwner",
							"type": "address"
					}
			],
			"name": "transferOwnership",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
	}
]