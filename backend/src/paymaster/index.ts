/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyBaseLogger } from 'fastify';
import EtherspotAbiV06 from '../abi/EtherspotAbi.js';
import EtherspotAbiV07 from "../abi/EtherspotVerifyingSignerAbi.js";
import { PimlicoPaymaster } from './pimlico.js';
import ErrorMessage from '../constants/ErrorMessage.js';
import { PAYMASTER_ADDRESS } from '../constants/Pimlico.js';
import { getEtherscanFee } from '../utils/common.js';
import MultiTokenPaymasterAbi from '../abi/MultiTokenPaymasterAbi.js';
import OrochiOracleAbi from '../abi/OrochiOracleAbi.js';
import ChainlinkOracleAbi from '../abi/ChainlinkOracleAbi.js';
import {
  pad,
  toHex,
  concat,
  parseUnits,
  PrivateKeyAccount,
  encodeAbiParameters,
  http,
  GetContractReturnType,
  createPublicClient,
  getContract,
  createWalletClient,
  parseEther,
  encodeFunctionData,
  SendTransactionReturnType,
  erc20Abi,
  Hex,
  formatEther,
  PublicClient,
  stringToBytes,
  formatUnits,
  zeroAddress,
  Chain
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export class Paymaster {
  feeMarkUp: bigint;
  multiTokenMarkUp: Number;

  constructor(feeMarkUp: string, multiTokenMarkUp: string) {
    this.feeMarkUp = parseUnits(feeMarkUp, 9);
    if (isNaN(Number(multiTokenMarkUp))) this.multiTokenMarkUp = 1150000 // 15% more of the actual cost. Can be anything between 1e6 to 2e6
    else this.multiTokenMarkUp = Number(multiTokenMarkUp);
  }

  packUint (high128: bigint, low128: bigint): Hex {
    return pad((toHex((high128 << BigInt(128)) + low128)), {size: 32});
  }

  packPaymasterData (paymaster: Hex, paymasterVerificationGasLimit: bigint, postOpGasLimit: bigint, paymasterData?: Hex): Hex {
    return concat([
      paymaster,
      this.packUint(paymasterVerificationGasLimit, postOpGasLimit),
      paymasterData ?? '0x'
    ])
  }

  async getPaymasterData(userOp: any, validUntil: number, validAfter: number, paymasterContract: GetContractReturnType<typeof EtherspotAbiV07, PublicClient>, signer: PrivateKeyAccount) {
    // actual signing...
    const hash = await paymasterContract.read.getHash([userOp, validUntil, validAfter]);

    const sig = await signer.signMessage({message: {raw: hash}});

    const paymasterData = concat([
      encodeAbiParameters(
        [{type: 'uint48'}, {type: 'uint48'}],
        [validUntil, validAfter]  
      ),
      sig
    ]);

    return paymasterData;
  }

  async signV07(userOp: any, validUntil: string, validAfter: string, entryPoint: Hex, paymasterAddress: Hex,
    bundlerRpc: string, signer: PrivateKeyAccount, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const client = createPublicClient({
        transport: http(bundlerRpc)
      });
      const paymasterContract = getContract({
        abi: EtherspotAbiV07,
        address: paymasterAddress,
        client
      })
      if (!userOp.signature) userOp.signature = '0x';
      if (userOp.factory && userOp.factoryData) userOp.initCode = concat([userOp.factory, userOp.factoryData ?? ''])
      if (!userOp.initCode) userOp.initCode = "0x";
      if (estimate) {
        const response: {verificationGasLimit: string, preVerificationGas: string, callGasLimit: string} = await client.request({
          method: "eth_estimateUserOperationGas" as any,
          params: [userOp, entryPoint]
        })
        userOp.verificationGasLimit = BigInt(response.verificationGasLimit);
        userOp.callGasLimit = BigInt(response.callGasLimit);
        userOp.preVerificationGas = BigInt(response.preVerificationGas);
      }
      const accountGasLimits = this.packUint(userOp.verificationGasLimit, userOp.callGasLimit)
      const gasFees = this.packUint(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas);
      let packedUserOp = {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode,
        callData: userOp.callData,
        accountGasLimits: accountGasLimits,
        preVerificationGas: userOp.preVerificationGas,
        gasFees: gasFees,
        paymasterAndData: this.packPaymasterData(paymasterAddress, BigInt(30000), BigInt("0x1")),
        signature: userOp.signature
      }

      let paymasterData = await this.getPaymasterData(packedUserOp, +validUntil, +validAfter, paymasterContract, signer);
      let returnValue;
      if (estimate) {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: paymasterData,
          preVerificationGas: packedUserOp.preVerificationGas.toString(),
          verificationGasLimit: userOp.verificationGasLimit,
          callGasLimit: userOp.callGasLimit,
          paymasterVerificationGasLimit: BigInt(30000).toString(),
          paymasterPostOpGasLimit: BigInt("0x1").toString()
        }
      } else {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: paymasterData,
        }
      }

      return returnValue;
    } catch (err: any) {
      if (log) log.error(err, 'signv07');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  }

  async getPaymasterAndData(userOp: any, validUntil: number, validAfter: number, paymasterContract: GetContractReturnType<typeof EtherspotAbiV06, PublicClient>, signer: PrivateKeyAccount) {
    // actual signing...
    const hash = await paymasterContract.read.getHash([
      userOp,
      validUntil,
      validAfter
    ]);

    const sig = await signer.signMessage({message: {raw: hash}});

    const paymasterAndData = concat([
      paymasterContract.address,
      encodeAbiParameters(
        [{type: 'uint48'}, {type: 'uint48'}],
        [validUntil, validAfter]
      ),
      sig,
    ]);

    return paymasterAndData;
  }

  async signV06(userOp: any, validUntil: string, validAfter: string, entryPoint: Hex, paymasterAddress: Hex,
    bundlerRpc: string, signer: PrivateKeyAccount, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const client = createPublicClient({
        transport: http(bundlerRpc)
      });
      const paymasterContract = getContract({
        abi: EtherspotAbiV06,
        address: paymasterAddress,
        client
      });
      userOp.paymasterAndData = await this.getPaymasterAndData(userOp, +validUntil, +validAfter, paymasterContract, signer);
      if (!userOp.signature) userOp.signature = '0x';
      if (estimate) {
        const response: {verificationGasLimit: string, preVerificationGas: string, callGasLimit: string} = await client.request({
          method: "eth_estimateUserOperationGas" as any,
          params: [userOp, entryPoint]
        })
        userOp.verificationGasLimit = BigInt(response.verificationGasLimit);
        userOp.preVerificationGas = BigInt(response.preVerificationGas);
        userOp.callGasLimit = BigInt(response.callGasLimit);
      }
      const paymasterAndData = await this.getPaymasterAndData(userOp, +validUntil, +validAfter, paymasterContract, signer);
      let returnValue;
      if (estimate) {
        returnValue = {
          paymasterAndData,
          verificationGasLimit: userOp.verificationGasLimit.toString(),
          preVerificationGas: userOp.preVerificationGas.toString(),
          callGasLimit: userOp.callGasLimit.toString(),
        }
      } else {
        returnValue = {
          paymasterAndData
        }
      }

      return returnValue;
    } catch (err: any) {
      if (log) log.error(err, 'signV06');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  } 

  async getPaymasterAndDataForMultiTokenPaymaster(userOp: any, validUntil: number, validAfter: number, feeToken: Hex,
    ethPrice: string, paymasterContract: GetContractReturnType<typeof MultiTokenPaymasterAbi, PublicClient>, signer: PrivateKeyAccount) {
    const exchangeRate = 1000000n; // This is for setting min tokens required for the txn that gets validated on estimate
    const rate = exchangeRate * BigInt(ethPrice);
    const priceMarkup = this.multiTokenMarkUp as number;
    // actual signing...
    // priceSource inputs available 0 - for using external exchange price and 1 - for oracle based price
    const hash = await paymasterContract.read.getHash([
      userOp,
      0,
      validUntil,
      validAfter,
      feeToken,
      zeroAddress,
      rate,
      priceMarkup,
    ]);

    const sig = await signer.signMessage({message: {raw: hash}});

    const paymasterAndData = concat([
      paymasterContract.address,
      '0x00',
      encodeAbiParameters(
        [{type: 'uint48'}, {type: 'uint48'}, {type: 'address'}, {type: 'address'}, {type: 'uint256'}, {type: 'uint32'}],
        [validUntil, validAfter, feeToken, zeroAddress, rate, priceMarkup]
      ),
      sig
    ]);

    return paymasterAndData;
  }

  async signMultiTokenPaymaster(userOp: any, validUntil: string, validAfter: string, entryPoint: Hex, paymasterAddress: Hex,
    feeToken: Hex, oracleAggregator: Hex, bundlerRpc: string, signer: PrivateKeyAccount, oracleName: string, log?: FastifyBaseLogger) {
    try {
      const client = createPublicClient({
        transport: http(bundlerRpc)
      });
      const paymasterContract = getContract({
        abi: MultiTokenPaymasterAbi,
        address: paymasterAddress,
        client
      });
      let ethPrice = "";
      if (oracleName === "orochi") {
        const oracleContract = getContract({
          abi: OrochiOracleAbi,
          address: oracleAggregator,
          client
        });
        const result = await oracleContract.read.getLatestData([1, toHex(stringToBytes('ETH')).padEnd(42, '0') as Hex]);
        ethPrice = Number(formatEther(BigInt(result))).toFixed(0);
      } else {
        const chainlinkContract = getContract({
          abi: ChainlinkOracleAbi,
          address: oracleAggregator,
          client
        });
        const decimals = await chainlinkContract.read.decimals();
        const result = await chainlinkContract.read.latestAnswer();
        ethPrice = Number(formatUnits(result, decimals)).toFixed(0);
      }
      userOp.paymasterAndData = await this.getPaymasterAndDataForMultiTokenPaymaster(userOp, +validUntil, +validAfter, feeToken, ethPrice, paymasterContract, signer);

      if (!userOp.signature) userOp.signature = '0x';
      const response: {verificationGasLimit: string, preVerificationGas: string, callGasLimit: string} = await client.request({
        method: "eth_estimateUserOperationGas" as any,
        params: [userOp, entryPoint]
      })
      userOp.verificationGasLimit = BigInt(response.verificationGasLimit);
      userOp.preVerificationGas = BigInt(response.preVerificationGas);
      userOp.callGasLimit = BigInt(response.callGasLimit);
      const paymasterAndData = await this.getPaymasterAndDataForMultiTokenPaymaster(userOp, +validUntil, +validAfter, feeToken, ethPrice, paymasterContract, signer);

      const returnValue = {
        paymasterAndData,
        verificationGasLimit: response.verificationGasLimit,
        preVerificationGas: response.preVerificationGas,
        callGasLimit: response.callGasLimit,
      }

      return returnValue;
    } catch (err: any) {
      if (log) log.error(err, 'signCombinedPaymaster');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  }

  async pimlico(userOp: any, bundlerRpc: string, entryPoint: Hex, PaymasterAddress: Hex, log?: FastifyBaseLogger) {
    try {
      const client = createPublicClient({
        transport: http(bundlerRpc)
      });
      const erc20Paymaster = new PimlicoPaymaster(PaymasterAddress, client)
      if (!userOp.signature) userOp.signature = '0x';
      const tokenAmountRequired = await erc20Paymaster.calculateTokenAmount(userOp);
      const tokenContract = getContract({
        abi: erc20Abi,
        address: (await erc20Paymaster.tokenAddress),
        client
      });
      const tokenBalance = await tokenContract.read.balanceOf([userOp.sender]);

      if (tokenAmountRequired >= tokenBalance)
        throw new Error(`The required token amount ${tokenAmountRequired.toString()} is more than what the sender has ${tokenBalance}`)

      let paymasterAndData = await erc20Paymaster.generatePaymasterAndDataForTokenAmount(userOp, tokenAmountRequired)
      userOp.paymasterAndData = paymasterAndData;

      const response: {verficationGasLimit: string, preVerificationGas: string, callGasLimit: string} = await client.request({
        method: "eth_estimateUserOperationGas" as any,
        params: [userOp, entryPoint]
      })
      userOp.verificationGasLimit = (BigInt(response.verficationGasLimit) + BigInt(100000))
      userOp.preVerificationGas = BigInt(response.preVerificationGas)
      userOp.callGasLimit = BigInt(response.callGasLimit)
      paymasterAndData = await erc20Paymaster.generatePaymasterAndData(userOp);

      return {
        paymasterAndData,
        verificationGasLimit: userOp.verificationGasLimit.toString(),
        preVerificationGas: response.preVerificationGas,
        callGasLimit: response.callGasLimit,
      };
    } catch (err: any) {
      if (err.message.includes('The required token amount')) throw new Error(err.message);
      if (log) log.error(err, 'pimlico');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg: ' + err.message)
    }
  }

  async pimlicoAddress(gasToken: string, chainId: number, log?: FastifyBaseLogger) {
    try {
      return {
        message: PAYMASTER_ADDRESS[chainId][gasToken] ?? 'Requested Token Paymaster is not available/deployed',
      }
    } catch (err: any) {
      if (log) log.error(err, 'pimlicoAddress');
      throw new Error(err.message)
    }
  }

  async whitelistAddresses(address: Hex[], paymasterAddress: Hex, bundlerRpc: string, relayerKey: Hex, chainId: number, chain: Chain, log?: FastifyBaseLogger) {
    try {
      const client = createPublicClient({
        transport: http(bundlerRpc),
        chain
      });
      const paymasterContract = getContract({
        abi: EtherspotAbiV06,
        address: paymasterAddress,
        client
      });
      const signer = createWalletClient({
        transport: http(bundlerRpc),
        account: privateKeyToAccount(relayerKey),
        chain
      });
      for (let i = 0; i < address.length; i++) {
        const isAdded = await paymasterContract.read.check([signer.account.address, address[i]]);
        if (isAdded) {
          throw new Error(`${address[i]} already whitelisted`)
        }
      }
      const encodedData = encodeFunctionData({
        abi: EtherspotAbiV06,
        args: [address],
        functionName: 'addBatchToWhitelist'
      })

      const etherscanFeeData = await getEtherscanFee(chainId);
      let feeData;
      if (etherscanFeeData) {
        feeData = etherscanFeeData;
      } else {
        feeData = await client.estimateFeesPerGas();
        feeData.gasPrice = feeData.gasPrice ? feeData.gasPrice + this.feeMarkUp : undefined;
        feeData.maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas + this.feeMarkUp : undefined;
        feeData.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas + this.feeMarkUp : undefined;
      }

      let tx: SendTransactionReturnType;
      if (!feeData.maxFeePerGas) {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          gasPrice: feeData.gasPrice ?? undefined
        });
      } else {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: "eip1559"
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait();

      return {
        message: `Successfully whitelisted with transaction Hash ${tx}`
      };
    } catch (err: any) {
      if (err.message.includes('already whitelisted')) throw new Error(err.message);
      if (log) log.error(err, 'whitelistAddresses')
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN + ` RawErrorMsg: ${err.message}`);
    }
  }

  async removeWhitelistAddress(address: Hex[], paymasterAddress: Hex, bundlerRpc: string, relayerKey: Hex, chainId: number, chain: Chain, log?: FastifyBaseLogger) {
    try {
      const client = createPublicClient({
        transport: http(bundlerRpc),
        chain
      });
      const paymasterContract = getContract({
        abi: EtherspotAbiV06,
        address: paymasterAddress,
        client
      });
      const signer = createWalletClient({
        transport: http(bundlerRpc),
        account: privateKeyToAccount(relayerKey),
        chain
      });
      for (let i = 0; i < address.length; i++) {
        const isAdded = await paymasterContract.read.check([signer.account.address, address[i]]);
        if (!isAdded) {
          throw new Error(`${address[i]} is not whitelisted`)
        }
      }
      const encodedData = encodeFunctionData({
        abi: EtherspotAbiV06,
        args: [address],
        functionName: 'removeBatchFromWhitelist'
      })
      const etherscanFeeData = await getEtherscanFee(chainId);
      let feeData;
      if (etherscanFeeData) {
        feeData = etherscanFeeData;
      } else {
        feeData = await client.estimateFeesPerGas();
        feeData.gasPrice = feeData.gasPrice ? feeData.gasPrice + this.feeMarkUp : undefined;
        feeData.maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas + this.feeMarkUp : undefined;
        feeData.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas + this.feeMarkUp : undefined;
      }

      let tx: SendTransactionReturnType;
      if (!feeData.maxFeePerGas) {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          gasPrice: feeData.gasPrice ?? undefined,
        })
      } else {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: "eip1559",
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait();

      return {
        message: `Successfully removed whitelisted addresses with transaction Hash ${tx}`
      };
    } catch (err: any) {
      if (err.message.includes('is not whitelisted')) throw new Error(err.message);
      if (log) log.error(err, 'removeWhitelistAddress');
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN);
    }
  }

  async checkWhitelistAddress(accountAddress: Hex, paymasterAddress: Hex, bundlerRpc: string, relayerKey: Hex, log?: FastifyBaseLogger) {
    try {
      const client = createPublicClient({
        transport: http(bundlerRpc)
      });
      const account = privateKeyToAccount(relayerKey);
      const paymasterContract = getContract({
        abi: EtherspotAbiV06,
        address: paymasterAddress,
        client
      });
      return paymasterContract.read.check([account.address, accountAddress]);
    } catch (err) {
      if (log) log.error(err, 'checkWhitelistAddress');
      throw new Error(ErrorMessage.RPC_ERROR);
    }
  }

  async deposit(amount: string, paymasterAddress: Hex, bundlerRpc: string, relayerKey: Hex, chainId: number, isEpv06: boolean, chain: Chain, log?: FastifyBaseLogger) {
    try {
      const client = createPublicClient({
        transport: http(bundlerRpc),
        chain
      });
      const abi = isEpv06 ? EtherspotAbiV06 : EtherspotAbiV07;
      const signer = createWalletClient({
        account: privateKeyToAccount(relayerKey),
        transport: http(bundlerRpc),
        chain
      });
      const balance = await client.getBalance({
        address: signer.account.address
      });
      const amountInWei = parseEther(amount);
      if (amountInWei >= balance)
        throw new Error(`${signer.account.address} Balance is less than the amount to be deposited`)

      const encodedData = encodeFunctionData({
        abi,
        args: [],
        functionName: isEpv06 ? 'depositFunds' : 'deposit'
      });

      const etherscanFeeData = await getEtherscanFee(chainId);
      let feeData;
      if (etherscanFeeData) {
        feeData = etherscanFeeData;
      } else {
        feeData = await client.estimateFeesPerGas({
          type: 'eip1559'
        })
        feeData.gasPrice = feeData.gasPrice ? feeData.gasPrice + this.feeMarkUp : undefined;
        feeData.maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas + this.feeMarkUp : undefined;
        feeData.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas + this.feeMarkUp : undefined;
      }

      let tx: SendTransactionReturnType;
      if (!feeData.maxFeePerGas) {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          value: amountInWei,
          gasPrice: feeData.gasPrice
        })
      } else {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          value: amountInWei,
          maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas : undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: "eip1559",
          chain
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait(); 

      return {
        message: `Successfully deposited with transaction Hash ${tx}`
      };
    } catch (err: any) {
      if (log) log.error(err, 'deposit');
      if (err.message.includes('Balance is less than the amount to be deposited')) throw new Error(err.message);
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN);
    }
  }
}
