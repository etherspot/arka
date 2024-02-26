/* eslint-disable @typescript-eslint/no-explicit-any */
import { providers, Wallet, ethers, Contract } from 'ethers';
import { arrayify, defaultAbiCoder, hexConcat } from 'ethers/lib/utils.js';
import abi from "../abi/EtherspotAbi.js";
import { PimlicoPaymaster, getERC20Paymaster } from './pimlico.js';

export class Paymaster {

  constructor() {
    //
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

  async sign(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      const signer = new Wallet(relayerKey, provider)
      userOp.paymasterAndData = await this.getPaymasterAndData(userOp, validUntil, validAfter, paymasterContract, signer);
      userOp.signature = '0x';
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
    } catch (err) {
      throw new Error('Transaction Execution reverted')
    }
  }

  async pimlico(userOp: any, gasToken: string, bundlerRpc: string, entryPoint: string, customPaymasterAddress: string | null) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      let erc20Paymaster;
      if (customPaymasterAddress) erc20Paymaster = new PimlicoPaymaster(customPaymasterAddress, provider)
      else erc20Paymaster = await getERC20Paymaster(provider, gasToken, entryPoint)

      let paymasterAndData = await erc20Paymaster.generatePaymasterAndData(userOp)
      userOp.paymasterAndData = paymasterAndData;
      userOp.signature = '0x';
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
      throw new Error('Transaction Execution reverted ' + err.message)
    }
  }

  async pimlicoAddress(gasToken: string, bundlerRpc: string, entryPoint: string) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const erc20Paymaster = await getERC20Paymaster(provider, gasToken, entryPoint)
      return {
        message: erc20Paymaster.paymasterAddress
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
      const tx = await signer.sendTransaction({ to: paymasterAddress, data: encodedData });
      await tx.wait();
      return {
        message: `Successfully whitelisted with transaction Hash ${tx.hash}`
      };
    } catch (err: any) {
      if (err.message.includes('already whitelisted')) throw new Error(err);
      throw new Error('Error while submitting transaction');
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
      const encodedData = paymasterContract.interface.encodeFunctionData('removeBatchToWhitelist', [address]);
      const tx = await signer.sendTransaction({ to: paymasterAddress, data: encodedData });
      await tx.wait();
      return {
        message: `Successfully removed whitelisted addresses with transaction Hash ${tx.hash}`
      };
    } catch (err: any) {
      if (err.message.includes('is not whitelisted')) throw new Error(err);
      throw new Error('Error while submitting transaction');
    }
  }

  async checkWhitelistAddress(accountAddress: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const signer = new Wallet(relayerKey, provider)
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      return paymasterContract.check(signer.address, accountAddress);
    } catch (err) {
      throw new Error('rpcError while checking whitelist');
    }
  }

  async deposit(amount: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, abi, provider);
      const signer = new Wallet(relayerKey, provider)
      const balance = await signer.getBalance();
      if (ethers.utils.parseEther(amount.toString()).gte(balance))
        throw new Error(`${signer.address} Balance is less than the amount to be deposited`)
      const encodedData = paymasterContract.interface.encodeFunctionData('depositFunds', []);
      const tx = await signer.sendTransaction({ to: paymasterAddress, data: encodedData, value: ethers.utils.parseEther(amount.toString()) });
      await tx.wait();
      return {
        message: `Successfully deposited with transaction Hash ${tx.hash}`
      };
    } catch (err) {
      throw new Error('Error while submitting transaction');
    }
  }
}