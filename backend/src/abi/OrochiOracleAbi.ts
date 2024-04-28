export default [
  {
      "inputs": [
          {
              "internalType": "address[]",
              "name": "operatorList",
              "type": "address[]"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "user",
              "type": "address"
          }
      ],
      "name": "DeactivatedUser",
      "type": "error"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "length",
              "type": "uint256"
          }
      ],
      "name": "InvalidDataLength",
      "type": "error"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "sender",
              "type": "address"
          }
      ],
      "name": "InvalidOperator",
      "type": "error"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "requiredLen",
              "type": "uint256"
          },
          {
              "internalType": "uint256",
              "name": "maxLen",
              "type": "uint256"
          }
      ],
      "name": "OutOfRange",
      "type": "error"
  },
  {
      "inputs": [
          {
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
          }
      ],
      "name": "UnableToPublishData",
      "type": "error"
  },
  {
      "inputs": [
          {
              "internalType": "uint64",
              "name": "round",
              "type": "uint64"
          }
      ],
      "name": "UndefinedRound",
      "type": "error"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "newOperator",
              "type": "address"
          }
      ],
      "name": "AddOperator",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "actor",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "bool",
              "name": "status",
              "type": "bool"
          }
      ],
      "name": "Deactivated",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "actor",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "uint256",
              "name": "identifier",
              "type": "uint256"
          },
          {
              "indexed": true,
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
          }
      ],
      "name": "FulFill",
      "type": "event"
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
      "inputs": [
          {
              "indexed": true,
              "internalType": "uint32",
              "name": "application",
              "type": "uint32"
          },
          {
              "indexed": true,
              "internalType": "uint64",
              "name": "round",
              "type": "uint64"
          },
          {
              "indexed": true,
              "internalType": "bytes20",
              "name": "identifier",
              "type": "bytes20"
          },
          {
              "indexed": false,
              "internalType": "bytes32",
              "name": "data",
              "type": "bytes32"
          }
      ],
      "name": "PublishData",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "OldOperator",
              "type": "address"
          }
      ],
      "name": "RemoveOperator",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "actor",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "uint256",
              "name": "identifier",
              "type": "uint256"
          },
          {
              "indexed": true,
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
          }
      ],
      "name": "Request",
      "type": "event"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "newOperator",
              "type": "address"
          }
      ],
      "name": "addOperator",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint256",
              "name": "identifier",
              "type": "uint256"
          },
          {
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
          }
      ],
      "name": "fulfill",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint32",
              "name": "appId",
              "type": "uint32"
          },
          {
              "internalType": "uint64",
              "name": "round",
              "type": "uint64"
          },
          {
              "internalType": "bytes20",
              "name": "identifier",
              "type": "bytes20"
          }
      ],
      "name": "getData",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "data",
              "type": "bytes32"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint32",
              "name": "appId",
              "type": "uint32"
          },
          {
              "internalType": "bytes20",
              "name": "identifier",
              "type": "bytes20"
          }
      ],
      "name": "getLatestData",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "data",
              "type": "bytes32"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint32",
              "name": "appId",
              "type": "uint32"
          },
          {
              "internalType": "bytes20",
              "name": "identifier",
              "type": "bytes20"
          }
      ],
      "name": "getLatestRound",
      "outputs": [
          {
              "internalType": "uint64",
              "name": "round",
              "type": "uint64"
          },
          {
              "internalType": "uint64",
              "name": "lastUpdate",
              "type": "uint64"
          },
          {
              "internalType": "bytes32",
              "name": "data",
              "type": "bytes32"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "uint32",
              "name": "appId",
              "type": "uint32"
          },
          {
              "internalType": "bytes20",
              "name": "identifier",
              "type": "bytes20"
          }
      ],
      "name": "getMetadata",
      "outputs": [
          {
              "internalType": "uint64",
              "name": "round",
              "type": "uint64"
          },
          {
              "internalType": "uint64",
              "name": "lastUpdate",
              "type": "uint64"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "user",
              "type": "address"
          }
      ],
      "name": "isDeactivated",
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
      "inputs": [
          {
              "internalType": "address",
              "name": "checkAddress",
              "type": "address"
          }
      ],
      "name": "isOperator",
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
      "inputs": [
          {
              "internalType": "uint32",
              "name": "appId",
              "type": "uint32"
          },
          {
              "internalType": "bytes",
              "name": "packedData",
              "type": "bytes"
          }
      ],
      "name": "publishData",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes",
              "name": "packedData",
              "type": "bytes"
          }
      ],
      "name": "publishPrice",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "oldOperator",
              "type": "address"
          }
      ],
      "name": "removeOperator",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
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
      "inputs": [
          {
              "internalType": "uint256",
              "name": "identifier",
              "type": "uint256"
          },
          {
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
          }
      ],
      "name": "request",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "userAddress",
              "type": "address"
          },
          {
              "internalType": "bool",
              "name": "status",
              "type": "bool"
          }
      ],
      "name": "setDeactivatedStatus",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "nonpayable",
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
] as const;