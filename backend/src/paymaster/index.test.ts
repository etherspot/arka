/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, Wallet } from "ethers";
import { Paymaster } from "./index.js";

describe('Paymaster on Mumbai', () => {
  const paymaster = new Paymaster();
  const paymasterAddress = '0x8350355c08aDAC387b443782124A30A8942BeC2e'; // Mumbai Etherspot Paymaster Address
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // EntryPoint v0.6 as default
  const bundlerUrl = 'https://mumbai-bundler.etherspot.io';
  const relayerKey = '0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb2'; // Testing wallet private key only has Mumbai funds in it
  const userOp = {
    sender: '0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321',
    nonce: '0x1',
    initCode: '0x',
    callData: '0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
    callGasLimit: '0x88b8',
    verificationGasLimit: '0x186a0',
    maxFeePerGas: '0x6fc23ac10',
    maxPriorityFeePerGas: '0x6fc23ac00',
    paymasterAndData: '0x0101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000001010101010100000000000000000000000000000000000000000000000000000000000000000101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101',
    signature: '0x0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101',
    preVerificationGas: '0xc6c4'
  };

  test('sign function - valid details', async () => {
    type response = {
      paymasterAndData: string,
      verificationGasLimit: any,
      preVerificationGas: any,
      callGasLimit: any,
    }
    const Mock_Valid_Until = '0x00000000deadbeef'; // max value
    const Mock_Valid_After = '0x0000000000001234'; // min value
    try {
      const signResponse = await paymaster.sign(userOp, Mock_Valid_Until, Mock_Valid_After, entryPointAddress, paymasterAddress, bundlerUrl, relayerKey);
      expect(signResponse).toMatchObject<response>(signResponse);
    } catch (e) {
      throw new Error('AN error is displayed while performing sign action.')
    }
  });

  test('sign function - invalid sender address detail', async () => {
    const userOp = {
      sender: '0x7b3078b9A28DF76453CDfD2bA5E75f32f067632', // invalid sender address
      nonce: '0x1',
      initCode: '0x',
      callData: '0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
      callGasLimit: '0x88b8',
      verificationGasLimit: '0x186a0',
      maxFeePerGas: '0x6fc23ac10',
      maxPriorityFeePerGas: '0x6fc23ac00',
      paymasterAndData: '0x0101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000001010101010100000000000000000000000000000000000000000000000000000000000000000101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101',
      signature: '0x0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101',
      preVerificationGas: '0xc6c4'
    };

    type response = {
      paymasterAndData: string,
      verificationGasLimit: any,
      preVerificationGas: any,
      callGasLimit: any,
    }
    const Mock_Valid_Until = '0x00000000deadbeef'; // max value
    const Mock_Valid_After = '0x0000000000001234'; // min value
    try {
      await paymaster.sign(userOp, Mock_Valid_Until, Mock_Valid_After, entryPointAddress, paymasterAddress, bundlerUrl, relayerKey);
      throw new Error('The sign function is worked, however the sender address is invalid.')

    } catch (e: any) {
      const actualMessage = 'Transaction Execution reverted';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The sender address is invalid while using the sign function.')
      } else {
        throw new Error('The respective validation is not displayed for invalid sender address while using the sign function.')
      }
    }

  });

  test('pimlico function - valid details', async () => {
    type response = {
      paymasterAndData: string,
      verificationGasLimit: any,
      preVerificationGas: any,
      callGasLimit: any,
    }
    const gasToken = 'USDC';
    try {
      const pimlicoResponse = await paymaster.pimlico(userOp, gasToken, bundlerUrl, entryPointAddress, null);
      expect(pimlicoResponse).toMatchObject<response>(pimlicoResponse);
    } catch (e) {
      throw new Error('An error is displayed while using the pimlico function.')
    }
  })

  test('pimlico function - invalid custom paymaster address', async () => {
    type response = {
      paymasterAndData: string,
      verificationGasLimit: any,
      preVerificationGas: any,
      callGasLimit: any,
    }
    const gasToken = 'USDC';
    const address = ethers.Wallet.createRandom();
    try {
      await paymaster.pimlico(userOp, gasToken, bundlerUrl, entryPointAddress, address.toString()); // invalid custom paymaster address
      throw new Error('The pimlico function is worked, however the customPaymasterAddress is invalid.')
    } catch (e: any) {
      const actualMessage = 'Transaction Execution reverted network does not support ENS';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The customPaymasterAddress is invalid while using the pimlico function.')
      } else {
        throw new Error('The respective validation is not displayed for invalid customPaymasterAddress while using the pimlico function.')
      }
    }
  })

  test('pimlico function - invalid sender address', async () => {
    type response = {
      paymasterAndData: string,
      verificationGasLimit: any,
      preVerificationGas: any,
      callGasLimit: any,
    }
    const gasToken = 'USDC';
    const userOp = {
      sender: '0x7b3078b9A28DF76453CDfD2bA5E75f32f067632', // invalid address
      nonce: '0x1',
      initCode: '0x',
      callData: '0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
      callGasLimit: '0x88b8',
      verificationGasLimit: '0x186a0',
      maxFeePerGas: '0x6fc23ac10',
      maxPriorityFeePerGas: '0x6fc23ac00',
      paymasterAndData: '0x0101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000001010101010100000000000000000000000000000000000000000000000000000000000000000101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101',
      signature: '0x0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101',
      preVerificationGas: '0xc6c4'
    };

    try {
      await paymaster.pimlico(userOp, gasToken, bundlerUrl, entryPointAddress, null);
      throw new Error('The pimlico function is worked, however the sender address is invalid.')
    } catch (e: any) {
      const actualMessage = 'Transaction Execution reverted';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The sender address is invalid while using the pimlico function.')
      } else {
        throw new Error('The respective validation is not displayed for invalid sender address while using the pimlico function.')
      }
    }
  })

  test('pimlicoAddress function - valid details', async () => {
    type response = {
      message: string;
    }
    const gasToken = 'USDC';
    try {
      const pimlicoAddressResponse = await paymaster.pimlicoAddress(gasToken, bundlerUrl, entryPointAddress);
      expect(pimlicoAddressResponse).toMatchObject<response>(pimlicoAddressResponse);
    } catch (e) {
      throw new Error('An error is displayed while using the pimlicoAddress function.')
    }
  })

  test('pimlicoAddress function - invalid bundlerUrl', async () => {
    type response = {
      message: string;
    }
    const gasToken = 'USDC';
    const bundlerUrl = 'http://mumbai-bundler.etherspot.io'; // invalid bundlerUrl
    try {
      await paymaster.pimlicoAddress(gasToken, bundlerUrl, entryPointAddress);
      throw new Error('The pimlicoAddress function is worked, however the bundlerUrl is invalid.')
    } catch (e: any) {
      const actualMessage = 'could not detect network';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The bundlerUrl is invalid while using the pimlicoAddress function.')
      } else {
        throw new Error('The respective validation is not displayed for invalid bundlerUrl while using the pimlicoAddress function.')
      }
    }
  })

  test('whitelistAddresses function - not whitelisted address', async () => {
    const wallet = ethers.Wallet.createRandom();
    const address = [wallet.address]; // not whitelisted address
    try {
      const whitelistAddresses = await paymaster.whitelistAddresses(address, paymasterAddress, bundlerUrl, relayerKey);

      if (whitelistAddresses.message.includes('Successfully whitelisted with transaction Hash')) {
        console.log('The address is whitelisted successfully.')
      } else {
        throw new Error('The expected success message is not displayed while performing the whitelistAddress action.')
      }
    } catch (e: any) {
      throw new Error('An error is displayed while performing the whitelistAddress action.')
    }
  })

  test('whitelistAddresses function - already whitelisted address', async () => {
    const address = ['0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321']; // already whitelisted address
    try {
      await paymaster.whitelistAddresses(address, paymasterAddress, bundlerUrl, relayerKey);
      throw new Error('Address is whitelisted, However it was already whitelisted.')
    } catch (e: any) {
      const actualMessage = 'already whitelisted';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The address is already whitelisted.')
      } else {
        throw new Error('The respective validation is not displayed for already whitelisted address.  ')
      }
    }
  })

  test('whitelistAddresses function - invalid relayerKey', async () => {
    const address = ['0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321']; // already whitelisted address
    const relayerKey = '0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb'; // invalid relayerKey
    try {
      await paymaster.whitelistAddresses(address, paymasterAddress, bundlerUrl, relayerKey);
      throw new Error('Address is whitelisted, however the relayerKey is invalid.')
    } catch (e: any) {
      const actualMessage = 'Error while submitting transaction';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The relayerKey is invalid while whitelisting the address.')
      } else {
        throw new Error('The respective validation is not displayed for invalid relayerKey while address whitelisting.')
      }
    }
  })

  test('checkWhitelistAddress function - whitelisted address', async () => {
    const address = '0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321'; // whitelisted address
    try {
      const checkWhitelistAddressResponse = await paymaster.checkWhitelistAddress(address, paymasterAddress, bundlerUrl, relayerKey);
      if (checkWhitelistAddressResponse === true) {
        console.log('The address is whitelisted.')
      } else {
        throw new Error('The address is displayed not whitelisted, however it is already whitelisted.')
      }
    } catch (e: any) {
      throw new Error('An error is displayed while checking the address for whitelisting.')

    }
  })

  test('checkWhitelistAddress function - non whitelisted address', async () => {
    const address = '0x8350355c08aDAC387b443782124A30A8942BeC2e'; // non whitelisted address 
    try {
      const checkWhitelistAddressResponse = await paymaster.checkWhitelistAddress(address, paymasterAddress, bundlerUrl, relayerKey);
      if (checkWhitelistAddressResponse === false) {
        console.log('The address is not whitelisted as expected.')
      } else {
        throw new Error('The address is displayed whitelisted, however it is not whitelisted.')
      }
    } catch (e: any) {
      throw new Error('An error is displayed while checking the address for whitelisting.')
    }
  })

  test('checkWhitelistAddress function - invalid relayerKey', async () => {
    const address = '0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321';
    const relayerKey = '0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb'; // invalid relayerKey 
    try {
      await paymaster.checkWhitelistAddress(address, paymasterAddress, bundlerUrl, relayerKey);
      throw new Error('The whitelist address checking is performed, however the relayerKey is invalid.')
    } catch (e: any) {
      const actualMessage = 'rpcError while checking whitelist';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The relayerKey is invalid while checking the whitelist address.')
      } else {
        throw new Error('The respective validation is not displayed for invalid relayerKey while checking the whitelist address.')
      }
    }
  })

  test('deposit function - valid details', async () => {
    const amount = '0.0000001'
    try {
      const depositResponse = await paymaster.deposit(amount, paymasterAddress, bundlerUrl, relayerKey);

      const expectedMessage = depositResponse.message;
      const actualMessage = 'Successfully deposited with transaction Hash';

      if (expectedMessage.includes(actualMessage)) {
        console.log('The deposit function is working as expected.')
      } else {
        throw new Error('The valid message is not displayed while performing the deposit action.')
      }
    } catch (e: any) {
      throw new Error('An error is displayed while performing the deposit action.')
    }
  })

  test('deposit function - with invalid amount', async () => {
    const amount = '10000' // invalid amount
    try {
      await paymaster.deposit(amount, paymasterAddress, bundlerUrl, relayerKey);
      throw new Error('The deposite action is performed with invalid amount.')
    } catch (e: any) {
      const actualMessage = 'Error while submitting transaction';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The amount is invalid while performing the deposit.')
      } else {
        throw new Error('The respective validation is not displayed for invalid amount while deposit.')
      }
    }
  })
});