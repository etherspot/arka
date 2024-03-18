/* eslint-disable @typescript-eslint/no-explicit-any */
import { providers, Wallet, ethers, Contract, BigNumber } from 'ethers';
import { arrayify, defaultAbiCoder, hexConcat } from 'ethers/lib/utils.js';
import abi from "../abi/EtherspotAbi.js";
import { PimlicoPaymaster, getERC20Paymaster } from './pimlico.js';
import ErrorMessage from '../constants/ErrorMessage.js';
import { PAYMASTER_ADDRESS } from '../constants/Pimlico.js';

export class Paymaster {
  feeMarkUp: BigNumber;

  constructor(feeMarkUp: string) {
    this.feeMarkUp = ethers.utils.parseUnits(feeMarkUp, 'gwei');
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

  async sign(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string, bundlerRpc: string, signer: Wallet) {
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
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  }

  async pimlico(userOp: any, bundlerRpc: string, entryPoint: string, PaymasterAddress: string) {
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
      const tokenContract = new Contract(erc20Paymaster.tokenAddress, minABI, provider)
      const tokenBalance = await tokenContract.balanceOf(userOp.sender);

      if (tokenAmountRequired.gte(tokenBalance)) throw new Error(`The required token amount ${tokenAmountRequired.toString()} is more than what the sender has ${tokenBalance}`)
      
      let paymasterAndData = await erc20Paymaster.generatePaymasterAndDataWithTokenAmount(userOp, tokenAmountRequired)
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
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg: ' + err.message)
    }
  }

  async pimlicoAddress(gasToken: string, chainId: number) {
    try {
      return {
        message: PAYMASTER_ADDRESS[chainId][gasToken] ?? 'Requested Token Paymaster is not available/deployed',
      }
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  async whitelistAddresses(address: string[], paymasterAddress: string, bundlerRpc: string, relayerKey: string) {
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
      const feeData = await provider.getFeeData();
      let tx: providers.TransactionResponse;
      if (!feeData.maxFeePerGas) {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          gasPrice: feeData.gasPrice ? feeData.gasPrice.add(this.feeMarkUp) : undefined,
        })
      } else {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.add(this.feeMarkUp) : undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.add(this.feeMarkUp) : undefined,
          type: 2,
        });
      }
      await tx.wait();
      return {
        message: `Successfully whitelisted with transaction Hash ${tx.hash}`
      };
    } catch (err: any) {
      if (err.message.includes('already whitelisted')) throw new Error(err.message);
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN + ` RawErrorMsg: ${err.message}`);
    }
  }

  async removeWhitelistAddress(address: string[], paymasterAddress: string, bundlerRpc: string, relayerKey: string) {
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
      const feeData = await provider.getFeeData();
      let tx: providers.TransactionResponse;
      if (!feeData.maxFeePerGas) {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          gasPrice: feeData.gasPrice ? feeData.gasPrice.add(this.feeMarkUp) : undefined,
        })
      } else {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.add(this.feeMarkUp) : undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.add(this.feeMarkUp) : undefined,
          type: 2,
        });
      }
      await tx.wait();
      return {
        message: `Successfully removed whitelisted addresses with transaction Hash ${tx.hash}`
      };
    } catch (err: any) {
      if (err.message.includes('is not whitelisted')) throw new Error(err.message);
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN);
    }
  }

  async checkWhitelistAddress(accountAddress: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const signer = new Wallet(relayerKey, provider)
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      return paymasterContract.check(signer.address, accountAddress);
    } catch (err) {
      throw new Error(ErrorMessage.RPC_ERROR);
    }
  }

  async deposit(amount: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      const signer = new Wallet(relayerKey, provider)
      const balance = await signer.getBalance();
      const amountInWei = ethers.utils.parseEther(amount);
      if (amountInWei.gte(balance))
        throw new Error(`${signer.address} Balance is less than the amount to be deposited`)

      const encodedData = paymasterContract.interface.encodeFunctionData('depositFunds', []);
      const feeData = await provider.getFeeData();
      let tx: providers.TransactionResponse;
      if (!feeData.maxFeePerGas) {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          value: amountInWei,
          gasPrice: feeData.gasPrice ? feeData.gasPrice.add(this.feeMarkUp) : undefined,
        })
      } else {
        tx = await signer.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          value: amountInWei,
          maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.add(this.feeMarkUp) : undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.add(this.feeMarkUp) : undefined,
          type: 2,
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait(); 
      return {
        message: `Successfully deposited with transaction Hash ${tx.hash}`
      };
    } catch (err: any) {
      if (err.message.includes('Balance is less than the amount to be deposited')) throw new Error(err.message);
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN);
    }
  }
}
