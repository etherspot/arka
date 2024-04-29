/* eslint-disable @typescript-eslint/no-explicit-any */
import { providers, Wallet, ethers, Contract, BigNumber } from 'ethers';
import { arrayify, defaultAbiCoder, hexConcat } from 'ethers/lib/utils.js';
import { FastifyBaseLogger } from 'fastify';
import abi from "../abi/EtherspotAbi.js";
import { PimlicoPaymaster } from './pimlico.js';
import ErrorMessage from '../constants/ErrorMessage.js';
import { PAYMASTER_ADDRESS } from '../constants/Pimlico.js';
import { getEtherscanFee } from '../utils/common.js';
import MultiTokenPaymasterAbi from '../abi/MultiTokenPaymasterAbi.js';
import OrochiOracleAbi from '../abi/OrochiOracleAbi.js';

export class Paymaster {
  feeMarkUp: BigNumber;
  multiTokenMarkUp: Number;

  constructor(feeMarkUp: string, multiTokenMarkUp: string) {
    this.feeMarkUp = ethers.utils.parseUnits(feeMarkUp, 'gwei');
    if (isNaN(Number(multiTokenMarkUp))) this.multiTokenMarkUp = 1150000 // 15% more of the actual cost. Can be anything between 1e6 to 2e6
    else this.multiTokenMarkUp = Number(multiTokenMarkUp);
  }

  async getPaymasterAndData(userOp: any, validUntil: string, validAfter: string, paymasterContract: Contract, signer: Wallet) {
    // actual signing...
    const hash = await paymasterContract.getHash(
      userOp,
      validUntil,
      validAfter
    );

    const sig = await signer.signMessage(arrayify(hash));

    const paymasterAndData = hexConcat([
      paymasterContract.address,
      defaultAbiCoder.encode(
        ['uint48', 'uint48'],
        [validUntil, validAfter]
      ),
      sig,
    ]);

    return paymasterAndData;
  }

  async sign(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string, bundlerRpc: string, signer: Wallet, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      userOp.paymasterAndData = await this.getPaymasterAndData(userOp, validUntil, validAfter, paymasterContract, signer);
      if (!userOp.signature) userOp.signature = '0x';
      const response = await provider.send('eth_estimateUserOperationGas', [userOp, entryPoint]);
      userOp.verificationGasLimit = response.verificationGasLimit;
      userOp.preVerificationGas = response.preVerificationGas;
      userOp.callGasLimit = response.callGasLimit;

      const paymasterAndData = await this.getPaymasterAndData(userOp, validUntil, validAfter, paymasterContract, signer);

      const returnValue = {
        paymasterAndData,
        verificationGasLimit: response.verificationGasLimit,
        preVerificationGas: response.preVerificationGas,
        callGasLimit: response.callGasLimit,
      }

      return returnValue;
    } catch (err: any) {
      if (log) log.error(err, 'sign');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  }

  async getPaymasterAndDataForMultiTokenPaymaster(userOp: any, validUntil: string, validAfter: string, feeToken: string, ethPrice: string, paymasterContract: Contract, signer: Wallet) {
    const exchangeRate = 1000000; // This is for setting min tokens required for the txn that gets validated on estimate
    const rate = ethers.BigNumber.from(exchangeRate).mul(ethPrice);
    const priceMarkup = this.multiTokenMarkUp; 
    // actual signing...
    // priceSource inputs available 0 - for using external exchange price and 1 - for oracle based price
    const hash = await paymasterContract.getHash(
      userOp,
      0,
      validUntil,
      validAfter,
      feeToken,
      ethers.constants.AddressZero,
      rate.toNumber().toFixed(0),
      priceMarkup,
    );

    const sig = await signer.signMessage(arrayify(hash));

    const paymasterAndData = hexConcat([
      paymasterContract.address,
      '0x00',
      defaultAbiCoder.encode(
        ['uint48', 'uint48', 'address', 'address', 'uint256', 'uint32'],
        [validUntil, validAfter, feeToken, ethers.constants.AddressZero, rate.toNumber().toFixed(0), priceMarkup]
      ),
      sig,
    ]);

    return paymasterAndData;
  }

  async signMultiTokenPaymaster(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string, feeToken: string, oracleAggregator: string, bundlerRpc: string, signer: Wallet, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, MultiTokenPaymasterAbi, provider);
      const oracleContract = new ethers.Contract(oracleAggregator, OrochiOracleAbi, provider);
      const result = await oracleContract.getLatestData(1, ethers.utils.hexlify(ethers.utils.toUtf8Bytes('ETH')).padEnd(42, '0'))
      const ethPrice = Number(ethers.utils.formatEther(result)).toFixed(0);
      userOp.paymasterAndData = await this.getPaymasterAndDataForMultiTokenPaymaster(userOp, validUntil, validAfter, feeToken, ethPrice, paymasterContract, signer);
      
      if (!userOp.signature) userOp.signature = '0x';
      const response = await provider.send('eth_estimateUserOperationGas', [userOp, entryPoint]);
      userOp.verificationGasLimit = response.verificationGasLimit;
      userOp.preVerificationGas = response.preVerificationGas;
      userOp.callGasLimit = response.callGasLimit;
      const paymasterAndData = await this.getPaymasterAndDataForMultiTokenPaymaster(userOp, validUntil, validAfter, feeToken, ethPrice, paymasterContract, signer);

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

  async pimlico(userOp: any, bundlerRpc: string, entryPoint: string, PaymasterAddress: string, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const erc20Paymaster = new PimlicoPaymaster(PaymasterAddress, provider)
      if (!userOp.signature) userOp.signature = '0x';

      // The minimum ABI to get the ERC20 Token balance
      const minABI = [
        // balanceOf
        {
          constant: true,

          inputs: [{ name: '_owner', type: 'address' }],

          name: 'balanceOf',

          outputs: [{ name: 'balance', type: 'uint256' }],

          type: 'function',
        },
      ]
      const tokenAmountRequired = await erc20Paymaster.calculateTokenAmount(userOp);
      const tokenContract = new Contract(await erc20Paymaster.tokenAddress, minABI, provider)
      const tokenBalance = await tokenContract.balanceOf(userOp.sender);

      if (tokenAmountRequired.gte(tokenBalance)) throw new Error(`The required token amount ${tokenAmountRequired.toString()} is more than what the sender has ${tokenBalance}`)

      let paymasterAndData = await erc20Paymaster.generatePaymasterAndDataForTokenAmount(userOp, tokenAmountRequired)
      userOp.paymasterAndData = paymasterAndData;

      const response = await provider.send('eth_estimateUserOperationGas', [userOp, entryPoint]);
      userOp.verificationGasLimit = ethers.BigNumber.from(response.verificationGasLimit).add(100000).toString();
      userOp.preVerificationGas = response.preVerificationGas;
      userOp.callGasLimit = response.callGasLimit;
      paymasterAndData = await erc20Paymaster.generatePaymasterAndData(userOp);

      return {
        paymasterAndData,
        verificationGasLimit: userOp.verificationGasLimit,
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

  async whitelistAddresses(address: string[], paymasterAddress: string, bundlerRpc: string, relayerKey: string, chainId: number, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      const signer = new Wallet(relayerKey, provider)
      for (let i = 0; i < address.length; i++) {
        const isAdded = await paymasterContract.check(signer.address, address[i]);
        if (isAdded) {
          throw new Error(`${address[i]} already whitelisted`)
        }
      }
      const encodedData = paymasterContract.interface.encodeFunctionData('addBatchToWhitelist', [address]);

      const etherscanFeeData = await getEtherscanFee(chainId);
      let feeData;
      if (etherscanFeeData) {
        feeData = etherscanFeeData;
      } else {
        feeData = await provider.getFeeData();
        feeData.gasPrice = feeData.gasPrice ? feeData.gasPrice.add(this.feeMarkUp) : null;
        feeData.maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas.add(this.feeMarkUp) : null;
        feeData.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.add(this.feeMarkUp) : null;
      }

      let tx: providers.TransactionResponse;
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
          type: 2,
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait();

      return {
        message: `Successfully whitelisted with transaction Hash ${tx.hash}`
      };
    } catch (err: any) {
      if (err.message.includes('already whitelisted')) throw new Error(err.message);
      if (log) log.error(err, 'whitelistAddresses')
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN + ` RawErrorMsg: ${err.message}`);
    }
  }

  async removeWhitelistAddress(address: string[], paymasterAddress: string, bundlerRpc: string, relayerKey: string, chainId: number, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      const signer = new Wallet(relayerKey, provider)
      for (let i = 0; i < address.length; i++) {
        const isAdded = await paymasterContract.check(signer.address, address[i]);
        if (!isAdded) {
          throw new Error(`${address[i]} is not whitelisted`)
        }
      }

      const encodedData = paymasterContract.interface.encodeFunctionData('removeBatchFromWhitelist', [address]);
      const etherscanFeeData = await getEtherscanFee(chainId);
      let feeData;
      if (etherscanFeeData) {
        feeData = etherscanFeeData;
      } else {
        feeData = await provider.getFeeData();
        feeData.gasPrice = feeData.gasPrice ? feeData.gasPrice.add(this.feeMarkUp) : null;
        feeData.maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas.add(this.feeMarkUp) : null;
        feeData.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.add(this.feeMarkUp) : null;
      }

      let tx: providers.TransactionResponse;
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
          type: 2,
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait();

      return {
        message: `Successfully removed whitelisted addresses with transaction Hash ${tx.hash}`
      };
    } catch (err: any) {
      if (err.message.includes('is not whitelisted')) throw new Error(err.message);
      if (log) log.error(err, 'removeWhitelistAddress');
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN);
    }
  }

  async checkWhitelistAddress(accountAddress: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const signer = new Wallet(relayerKey, provider)
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      return paymasterContract.check(signer.address, accountAddress);
    } catch (err) {
      if (log) log.error(err, 'checkWhitelistAddress');
      throw new Error(ErrorMessage.RPC_ERROR);
    }
  }

  async deposit(amount: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string, chainId: number, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      const signer = new Wallet(relayerKey, provider)
      const balance = await signer.getBalance();
      const amountInWei = ethers.utils.parseEther(amount.toString());
      if (amountInWei.gte(balance))
        throw new Error(`${signer.address} Balance is less than the amount to be deposited`)

      const encodedData = paymasterContract.interface.encodeFunctionData('depositFunds', []);

      const etherscanFeeData = await getEtherscanFee(chainId);
      console.log('etherscanFeeData: ', etherscanFeeData);
      let feeData;
      if (etherscanFeeData) {
        feeData = etherscanFeeData;
      } else {
        feeData = await provider.getFeeData();
        feeData.gasPrice = feeData.gasPrice ? feeData.gasPrice.add(this.feeMarkUp) : null;
        feeData.maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas.add(this.feeMarkUp) : null;
        feeData.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.add(this.feeMarkUp) : null;
      }

      let tx: providers.TransactionResponse;
      if (!feeData.maxFeePerGas) {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          value: amountInWei,
          gasPrice: feeData.gasPrice ?? undefined,
        })
      } else {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          value: amountInWei,
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: 2,
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait(); 

      return {
        message: `Successfully deposited with transaction Hash ${tx.hash}`
      };
    } catch (err: any) {
      if (log) log.error(err, 'deposit');
      if (err.message.includes('Balance is less than the amount to be deposited')) throw new Error(err.message);
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN);
    }
  }
}
