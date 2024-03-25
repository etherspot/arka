/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, providers, Wallet } from "ethers";
import { Paymaster } from "./index.js";
import { PAYMASTER_ADDRESS } from "../constants/Pimlico.js";

describe('Paymaster on Mumbai', () => {
  const paymaster = new Paymaster('10');
  const paymasterAddress = '0x8350355c08aDAC387b443782124A30A8942BeC2e'; // Mumbai Etherspot Paymaster Address
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // EntryPoint v0.6 as default
  const bundlerUrl = 'https://mumbai-bundler.etherspot.io';
  const chainId = 80001; // Mumbai chainId
  const relayerKey = '0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb2'; // Testing wallet private key only has Mumbai funds in it
  const provider = new providers.JsonRpcProvider(bundlerUrl);
  const signer = new Wallet(relayerKey, provider)
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
    signature: '0x',
    preVerificationGas: '0xc6c4'
  };

  test('SMOKE: validate the sign function with valid details', async () => {
    const Mock_Valid_Until = '0x00000000deadbeef'; // max value
    const Mock_Valid_After = '0x0000000000001234'; // min value
    try {
      const signResponse = await paymaster.sign(userOp, Mock_Valid_Until, Mock_Valid_After, entryPointAddress, paymasterAddress, bundlerUrl, signer);
      try {
        expect(signResponse).toHaveProperty('paymasterAndData');
      } catch (e) {
        fail("The paymasterAndData details is not displayed in the sign response")
      }

      try {
        expect(signResponse).toHaveProperty('verificationGasLimit');
      } catch (e) {
        fail("The verificationGasLimit details is not displayed in the sign response")
      }

      try {
        expect(signResponse).toHaveProperty('preVerificationGas');
      } catch (e) {
        fail("The preVerificationGas details is not displayed in the sign response")
      }

      try {
        expect(signResponse).toHaveProperty('callGasLimit');
      } catch (e) {
        fail("The callGasLimit details is not displayed in the sign response")
      }
    } catch (e) {
      fail('An error is displayed while performing sign action.')
    }
  });

  test('SMOKE: validate the pimlico function with valid details', async () => {
    const gasToken = 'USDC';
    try {
      const tokenPaymasterAddress = PAYMASTER_ADDRESS[chainId][gasToken];
      const pimlicoResponse = await paymaster.pimlico(userOp, bundlerUrl, entryPointAddress, tokenPaymasterAddress);

      try {
        expect(pimlicoResponse).toHaveProperty('paymasterAndData');
      } catch (e) {
        fail("The paymasterAndData details is not displayed in the pimlico response")
      }

      try {
        expect(pimlicoResponse).toHaveProperty('verificationGasLimit');
      } catch (e) {
        fail("The verificationGasLimit details is not displayed in the pimlico response")
      }

      try {
        expect(pimlicoResponse).toHaveProperty('preVerificationGas');
      } catch (e) {
        fail("The preVerificationGas details is not displayed in the pimlico response")
      }

      try {
        expect(pimlicoResponse).toHaveProperty('callGasLimit');
      } catch (e) {
        fail("The callGasLimit details is not displayed in the pimlico response")
      }

    } catch (e) {
      fail('An error is displayed while using the pimlico function.')
    }
  })

  test('SMOKE: validate the pimlicoAddress function with valid details', async () => {
    const gasToken = 'USDC';
    try {
      const pimlicoAddressResponse = await paymaster.pimlicoAddress(gasToken, chainId);

      try {
        expect(pimlicoAddressResponse).toHaveProperty('message');
      } catch (e) {
        fail("The message details is not displayed in the pimlico address response")
      }

    } catch (e) {
      fail('An error is displayed while using the pimlicoAddress function.')
    }
  })

  test('SMOKE: validate the deposit function with valid details', async () => {
    const amount = '0.0000001'
    try {
      const depositResponse = await paymaster.deposit(amount, paymasterAddress, bundlerUrl, relayerKey, chainId);

      const expectedMessage = depositResponse.message;
      const actualMessage = 'Successfully deposited with transaction Hash';

      if (expectedMessage.includes(actualMessage)) {
        console.log('The deposit function is working as expected.')
      } else {
        fail('The valid message is not displayed while performing the deposit action.')
      }
    } catch (e: any) {
      fail('An error is displayed while performing the deposit action.')
    }
  })

  test('REGRESSION: validate the sign function with invalid sender address detail', async () => {
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

    const Mock_Valid_Until = '0x00000000deadbeef';
    const Mock_Valid_After = '0x0000000000001234';
    try {
      await paymaster.sign(userOp, Mock_Valid_Until, Mock_Valid_After, entryPointAddress, paymasterAddress, bundlerUrl, signer);
      fail('The sign function is worked, however the sender address is invalid.')

    } catch (e: any) {
      const actualMessage = 'Please contact support team RawErrorMsg:invalid address';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The sender address is invalid while using the sign function.')
      } else {
        fail('The respective validation is not displayed for invalid sender address while using the sign function.')
      }
    }

  });

  test('REGRESSION: validate the pimlico function with invalid custom paymaster address', async () => {
    const gasToken = 'USDC';
    const address = ethers.Wallet.createRandom(); // random address
    try {
      await paymaster.pimlico(userOp, bundlerUrl, entryPointAddress, address.toString()); // invalid custom paymaster address
      fail('The pimlico function is worked, however the customPaymasterAddress is invalid.')
    } catch (e: any) {
      const actualMessage = 'Please contact support team RawErrorMsg: network does not support ENS';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The customPaymasterAddress is invalid while using the pimlico function.')
      } else {
        fail('The respective validation is not displayed for invalid customPaymasterAddress while using the pimlico function.')
      }
    }
  })

  test('REGRESSION: validate the pimlico function with invalid sender address', async () => {
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
      signature: '0x',
      preVerificationGas: '0xc6c4'
    };

    try {
      await paymaster.pimlico(userOp, bundlerUrl, entryPointAddress, PAYMASTER_ADDRESS[chainId][gasToken]);
      fail('The pimlico function is worked, however the sender address is invalid.')
    } catch (e: any) {
      const actualMessage = ' Please contact support team RawErrorMsg: invalid address';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The sender address is invalid while using the pimlico function.')
      } else {
        fail('The respective validation is not displayed for invalid sender address while using the pimlico function.')
      }
    }
  })

  test('REGRESSION: validate the whitelistAddresses function with not whitelisted address', async () => {
    const wallet = ethers.Wallet.createRandom();
    const address = [wallet.address]; // not whitelisted address
    try {
      const whitelistAddresses = await paymaster.whitelistAddresses(address, paymasterAddress, bundlerUrl, relayerKey, chainId);

      if (whitelistAddresses.message.includes('Successfully whitelisted with transaction Hash')) {
        console.log('The address is whitelisted successfully.')
      } else {
        fail('The expected success message is not displayed while performing the whitelistAddress action.')
      }
    } catch (e: any) {
      fail('An error is displayed while performing the whitelistAddress action.')
    }
  })

  test('REGRESSION: validate the whitelistAddresses function with already whitelisted address', async () => {
    const address = ['0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321']; // already whitelisted address
    try {
      await paymaster.whitelistAddresses(address, paymasterAddress, bundlerUrl, relayerKey, chainId);
      fail('Address is whitelisted, However it was already whitelisted.')
    } catch (e: any) {
      const actualMessage = 'already whitelisted';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The address is already whitelisted.')
      } else {
        fail('The respective validation is not displayed for already whitelisted address.  ')
      }
    }
  })

  test('REGRESSION: validate the whitelistAddresses function with invalid relayerKey', async () => {
    const address = ['0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321']; // already whitelisted address
    const relayerKey = '0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb'; // invalid relayerKey
    try {
      await paymaster.whitelistAddresses(address, paymasterAddress, bundlerUrl, relayerKey, chainId);
      fail('Address is whitelisted, however the relayerKey is invalid.')
    } catch (e: any) {
      const actualMessage = 'Please try again later or contact support team RawErrorMsg: hex data is odd-length';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The relayerKey is invalid while whitelisting the address.')
      } else {
        fail('The respective validation is not displayed for invalid relayerKey while address whitelisting.')
      }
    }
  })

  test('REGRESSION: validate the checkWhitelistAddress function with whitelisted address', async () => {
    const address = '0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321'; // whitelisted address
    try {
      const checkWhitelistAddressResponse = await paymaster.checkWhitelistAddress(address, paymasterAddress, bundlerUrl, relayerKey);
      if (checkWhitelistAddressResponse === true) {
        console.log('The address is whitelisted.')
      } else {
        fail('The address is displayed not whitelisted, however it is already whitelisted.')
      }
    } catch (e: any) {
      fail('An error is displayed while checking the address for whitelisting.')

    }
  })

  test('REGRESSION: validate the checkWhitelistAddress function with non whitelisted address', async () => {
    const address = '0x8350355c08aDAC387b443782124A30A8942BeC2e'; // non whitelisted address 
    try {
      const checkWhitelistAddressResponse = await paymaster.checkWhitelistAddress(address, paymasterAddress, bundlerUrl, relayerKey);
      if (checkWhitelistAddressResponse === false) {
        console.log('The address is not whitelisted as expected.')
      } else {
        fail('The address is displayed whitelisted, however it is not whitelisted.')
      }
    } catch (e: any) {
      fail('An error is displayed while checking the address for whitelisting.')
    }
  })

  test('REGRESSION: validate the checkWhitelistAddress function with invalid relayerKey', async () => {
    const address = '0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321';
    const relayerKey = '0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb'; // invalid relayerKey 
    try {
      await paymaster.checkWhitelistAddress(address, paymasterAddress, bundlerUrl, relayerKey);
      fail('The whitelist address checking is performed, however the relayerKey is invalid.')
    } catch (e: any) {
      const actualMessage = 'rpcError while checking whitelist';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The relayerKey is invalid while checking the whitelist address.')
      } else {
        fail('The respective validation is not displayed for invalid relayerKey while checking the whitelist address.')
      }
    }
  })

  test('REGRESSION: validate the deposit function with invalid amount', async () => {
    const amount = '10000' // invalid amount
    try {
      await paymaster.deposit(amount, paymasterAddress, bundlerUrl, relayerKey, chainId);
      fail('The deposite action is performed with invalid amount.')
    } catch (e: any) {
      const actualMessage = 'Balance is less than the amount to be deposited';
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log('The amount is invalid while performing the deposit.')
      } else {
        fail('The respective validation is not displayed for invalid amount while deposit.')
      }
    }
  })
});