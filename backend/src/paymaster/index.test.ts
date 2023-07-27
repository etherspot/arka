/* eslint-disable @typescript-eslint/no-explicit-any */
import { privateKeyToAccount } from "viem/accounts";
import { Paymaster } from "./index.js";
import { PAYMASTER_ADDRESS } from "../constants/Token.js";

describe("Validate the Arka Paymaster on Sepolia", () => {
  const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));
  const paymaster = new Paymaster({
    feeMarkUp: "0",
    multiTokenMarkUp: "1150000",
    ep7TokenVGL: "100000",
    ep7TokenPGL: "48000",
    sequelize: {} as any,
    mtpVglMarkup: "0",
    ep7Pvgl: "100000",
    mtpPvgl: "100000",
    mtpPpgl: "48000",
    ep8Pvgl: "100000",
    skipType2Txns: []
  });
  const relayerKey =
    "0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb2"; // Testing wallet private key only has Mumbai funds in it
  const chainId = 80002;
  const Mock_Valid_Until = "0x000000ffffffff"; // max value
  const Mock_Valid_After = "0x0000000000001234"; // min value
  const feeTokenMultiToken = "0x453478e2e0c846c069e544405d5877086960bef2";
  const oracleAggregatorMultiToken =
    "0xbf3ff099fb6c23296fd192df643ad49fced658d0";
  const ethPriceMultiToken = "3099";
  const oracleNameMultiToken = "orochi";

  const paymasterAddressV06 = "0xe893a26dd53b325bffaacdfa224692eff4c448c4";
  const paymasterAddressV07 = "0x810FA4C915015b703db0878CF2B9344bEB254a40";
  const paymasterAddressMultiToken =
    "0xe85649152d15825f2226b2d9c49c07b1cd2b36c7";
  const entryPointAddressV06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const entryPointAddressV07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
  const entryPointAddressMultiToken =
    "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
  const bundlerUrlV06 = "https://testnet-rpc.etherspot.io/v1/80002";
  const bundlerUrlV07 = "https://testnet-rpc.etherspot.io/v2/80002";
  const bundlerUrlMultiToken = "https://testnet-rpc.etherspot.io/v1/28122024";

  const signerV06 = privateKeyToAccount(relayerKey as `0x${string}`);
  const signerV07 = privateKeyToAccount(relayerKey as `0x${string}`);
  const signerMultiToken = privateKeyToAccount(relayerKey as `0x${string}`);

  const userOpV06 = {
    sender: "0x1434E767F0D878de8C053896ec6F7e5d1951eE00",
    nonce: "0x0",
    initCode:
      "0x7f6d8f107fe8551160bd5351d5f1514a6ad5d40e5fbfb9cf0000000000000000000000009ae4935fae629dd042c18df520322e0e9efad73d0000000000000000000000000000000000000000000000000000000000000000",
    callData:
      "0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000009184e72a000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0xc7ed",
    verificationGasLimit: "0x186a0",
    maxFeePerGas: "0x6fc23ac10",
    maxPriorityFeePerGas: "0x6fc23ac00",
    paymasterAndData: "0x",
    signature:
      "0x0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101",
    preVerificationGas: "0xc6c4",
  };

  const userOpV07 = {
    sender: "0x1434E767F0D878de8C053896ec6F7e5d1951eE00",
    nonce: "0x0",
    factory: "0x7f6d8f107fe8551160bd5351d5f1514a6ad5d40e5",
    factoryData: "0xfbfb9cf0000000000000000000000000001f0b7ae5b5da5d8ac35946fb7da39b7a6c4b6a8a0000000000000000000000000000000000000000000000000000000000000000",
    callData:
      "0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000009184e72a000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0xc7ed",
    verificationGasLimit: "0x186a0",
    preVerificationGas: "0xc6c4",
    maxFeePerGas: "0x6fc23ac10",
    maxPriorityFeePerGas: "0x6fc23ac00",
    paymaster: "0x",
    paymasterVerificationGasLimit: "0x",
    paymasterPostOpGasLimit: "0x",
    paymasterData: "0x",
    signature:
      "0x0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101",
  };

  const UserOpMultiToken = {
    sender: "0xc29f2c87d8b3b88b657acb3e0634c5dede3c7096",
    nonce: "0xc",
    initCode: "0x",
    callData: "0xb61d27f6000000000000000000000000bddd95b5ee221f92ba8b0ba4e82ded5b5e9648d6000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0xccf6",
    verificationGasLimit: "0x13bac",
    maxFeePerGas: "0x6fc23ac10",
    maxPriorityFeePerGas: "0x6fc23ac00",
    paymasterAndData: "0x",
    signature: "0x0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101",
    preVerificationGas: "0xcdf8"
  };

  test("SMOKE: validate the signV06 function with valid details", async () => {
    await delay(3000);
    try {
      const signResponse = await paymaster.signV06(
        userOpV06,
        Mock_Valid_Until,
        Mock_Valid_After,
        entryPointAddressV06,
        paymasterAddressV06,
        bundlerUrlV06,
        signerV06,
        true
      );

      try {
        expect(signResponse).toHaveProperty("paymasterAndData");
      } catch (e) {
        throw new Error(
          "The paymasterAndData details is not displayed in the signV06 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("verificationGasLimit");
      } catch (e) {
        throw new Error(
          "The verificationGasLimit details is not displayed in the signV06 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("preVerificationGas");
      } catch (e) {
        throw new Error(
          "The preVerificationGas details is not displayed in the signV06 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("callGasLimit");
      } catch (e) {
        throw new Error(
          "The callGasLimit details is not displayed in the signV06 response"
        );
      }
    } catch (e) {
      throw new Error("An error is displayed while performing signV06 action.");
    }
  });

  test("SMOKE: validate the signV07 function with valid details", async () => {
    await delay(3000);
    try {
      const signResponse = await paymaster.signV07(
        userOpV07,
        Mock_Valid_Until,
        Mock_Valid_After,
        entryPointAddressV07,
        paymasterAddressV07,
        bundlerUrlV07,
        signerV07,
        true
      );

      try {
        expect(signResponse).toHaveProperty("paymaster");
      } catch (e) {
        throw new Error(
          "The paymaster details is not displayed in the signV07 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("paymasterVerificationGasLimit");
      } catch (e) {
        throw new Error(
          "The paymasterVerificationGasLimit details is not displayed in the signV07 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("paymasterPostOpGasLimit");
      } catch (e) {
        throw new Error(
          "The paymasterPostOpGasLimit details is not displayed in the signV07 response"
        );
      }
    } catch (e) {
      throw new Error("An error is displayed while performing signV07 action.");
    }
  });

  test("SMOKE: validate the getPaymasterAndDataForMultiTokenPaymaster function with valid details", async () => {
    await delay(3000);

    try {
      await paymaster.getPaymasterAndDataForMultiTokenPaymaster(
        UserOpMultiToken,
        Mock_Valid_Until,
        Mock_Valid_After,
        feeTokenMultiToken,
        ethPriceMultiToken,
        {} as any, // paymasterContract placeholder
        signerMultiToken,
        chainId
      );
    } catch (e) {
      throw new Error(
        "An error is displayed while performing getPaymasterAndDataForMultiTokenPaymaster action."
      );
    }
  });

  test("SMOKE: validate the signMultiTokenPaymaster function with valid details", async () => {
    await delay(3000);
    try {
      await paymaster.signMultiTokenPaymaster(
        UserOpMultiToken,
        Mock_Valid_Until,
        Mock_Valid_After,
        entryPointAddressMultiToken,
        paymasterAddressMultiToken,
        feeTokenMultiToken,
        oracleAggregatorMultiToken,
        bundlerUrlMultiToken,
        signerMultiToken,
        oracleNameMultiToken,
        "0x0000000000000000000000000000000000000000", // nativeOracleAddress
        chainId
      );
    } catch (e) {
      throw new Error(
        "An error is displayed while performing signMultiTokenPaymaster action."
      );
    }
  });

  // Skip Pimlico tests as those methods don't exist in current Paymaster class
  test.skip("SMOKE: validate the pimlicoAddress function with valid details", async () => {
    // These tests are skipped because pimlico methods are not available in current Paymaster implementation
  });

  test("SMOKE: validate the deposit function with epv06 details", async () => {
    await delay(3000);
    try {
      const depositResponse = await paymaster.deposit(
        "100000000000000000",
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId,
        true
      );

      try {
        expect(depositResponse).toHaveProperty("receipt");
      } catch (e) {
        throw new Error(
          "The receipt details is not displayed in the deposit response"
        );
      }

      try {
        expect(depositResponse).toHaveProperty("userOpResponse");
      } catch (e) {
        throw new Error(
          "The userOpResponse details is not displayed in the deposit response"
        );
      }
    } catch (e) {
      throw new Error("An error is displayed while performing deposit action.");
    }
  });

  test("SMOKE: validate the deposit function with epv07 details", async () => {
    await delay(3000);
    try {
      const depositResponse = await paymaster.deposit(
        "100000000000000000",
        paymasterAddressV07,
        bundlerUrlV07,
        relayerKey,
        chainId,
        false
      );

      try {
        expect(depositResponse).toHaveProperty("receipt");
      } catch (e) {
        throw new Error(
          "The receipt details is not displayed in the deposit response"
        );
      }

      try {
        expect(depositResponse).toHaveProperty("userOpResponse");
      } catch (e) {
        throw new Error(
          "The userOpResponse details is not displayed in the deposit response"
        );
      }
    } catch (e) {
      throw new Error("An error is displayed while performing deposit action.");
    }
  });

  // Additional tests can be added here as needed
});