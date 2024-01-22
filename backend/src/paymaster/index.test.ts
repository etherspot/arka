/* eslint-disable @typescript-eslint/no-explicit-any */
import { Paymaster } from "paymaster";

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  //
});

afterAll(async () => {
  jest.clearAllMocks();
});

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
  describe('sign function - success scenario', async () => {
    type response = {
      paymasterAndData: string,
      verificationGasLimit: any,
      preVerificationGas: any,
      callGasLimit: any,
    }
    const Mock_Valid_Until = '0x00000000deadbeef'; // max value
    const Mock_Valid_After = '0x0000000000001234'; // min value
    const signResponse = await paymaster.sign(userOp, Mock_Valid_Until, Mock_Valid_After, entryPointAddress, paymasterAddress, bundlerUrl, relayerKey);
    expect(signResponse).toMatchObject<response>(signResponse);
  });
  describe('pimlico function - success scenario', async () => {
    type response = {
      paymasterAndData: string,
      verificationGasLimit: any,
      preVerificationGas: any,
      callGasLimit: any,
    }
    const gasToken = 'USDC';
    const pimlicoResponse = await paymaster.pimlico(userOp, gasToken, bundlerUrl, entryPointAddress, null);
    expect(pimlicoResponse).toMatchObject<response>(pimlicoResponse);
  })
});