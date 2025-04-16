/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers, providers, Wallet } from "ethers";
import { Paymaster } from "./index.js";
import { PAYMASTER_ADDRESS } from "../constants/Token.js";
import MultiTokenPaymasterAbi from "../abi/MultiTokenPaymasterAbi.js";

describe("Validate the Arka Paymaster on Sepolia", () => {
  const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));
  const paymaster = new Paymaster("0", "1150000");
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
  const entryPointAddressPimlico = "0xcaDBADcFeD5530A49762DFc9d1d712CcD6b09b25";
  const entryPointAddressMultiToken =
    "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
  const bundlerUrlV06 = "https://testnet-rpc.etherspot.io/v1/80002";
  const bundlerUrlV07 = "https://testnet-rpc.etherspot.io/v2/80002";
  const bundlerUrlPimlico = "https://testnet-rpc.etherspot.io/v1/11155111";
  const bundlerUrlMultiToken = "https://testnet-rpc.etherspot.io/v1/28122024";
  const providerV06 = new providers.JsonRpcProvider(bundlerUrlV06);
  const providerV07 = new providers.JsonRpcProvider(bundlerUrlV07);
  const providerMultiToken = new providers.JsonRpcProvider(
    bundlerUrlMultiToken
  );
  const signerV06 = new Wallet(relayerKey, providerV06);
  const signerV07 = new Wallet(relayerKey, providerV07);
  const signerMultiToken = new Wallet(relayerKey, providerMultiToken);

  const userOpV06 = {
    sender: "0x1434E767F0D878de8C053896ec6F7e5d1951eE00",
    nonce: "0x0",
    initCode:
      "0x7f6d8f107fe8551160bd5351d5f1514a6ad5d40e5fbfb9cf0000000000000000000000009ae4935fae629dd042c18df520322e0e9efad73d0000000000000000000000000000000000000000000000000000000000000000",
    callData:
      "0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000009184e72a000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0xc7ed",
    verificationGasLimit: "0x4d62f",
    maxFeePerGas: "0x59682f1e",
    maxPriorityFeePerGas: "0x59682f00",
    paymasterAndData: "0x",
    preVerificationGas: "0xb1f4",
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
  };

  const userOpV07 = {
    sender: "0x4040fC64C54FFD875F635D16ff2807a619AeFd69",
    nonce: "0x4",
    callData:
      "0x541d63c800000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac00000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0x0",
    verificationGasLimit: "0x0",
    preVerificationGas: "0x0",
    maxFeePerGas: "0x85e0abb614",
    maxPriorityFeePerGas: "0x85e0abb600",
    signature:
      "0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  };

  const UserOpMultiToken = {
    sender: "0x1434E767F0D878de8C053896ec6F7e5d1951eE00",
    nonce: "0x0",
    initCode:
      "0x7f6d8f107fe8551160bd5351d5f1514a6ad5d40e5fbfb9cf0000000000000000000000009ae4935fae629dd042c18df520322e0e9efad73d0000000000000000000000000000000000000000000000000000000000000000",
    callData:
      "0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000453478e2e0c846c069e544405d5877086960bef200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000e85649152d15825f2226b2d9c49c07b1cd2b36c700000000000000000000000000000000000000000000000000000000001e848000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0xffb0",
    verificationGasLimit: "0x4aa47",
    maxFeePerGas: "0x596830f8",
    maxPriorityFeePerGas: "0x59682f00",
    preVerificationGas: "0xbef0",
    paymasterAndData: "0x",
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
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
        expect(signResponse).toHaveProperty("paymasterData");
      } catch (e) {
        throw new Error(
          "The paymasterData details is not displayed in the signV07 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("verificationGasLimit");
      } catch (e) {
        throw new Error(
          "The verificationGasLimit details is not displayed in the signV07 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("preVerificationGas");
      } catch (e) {
        throw new Error(
          "The preVerificationGas details is not displayed in the signV07 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("callGasLimit");
      } catch (e) {
        throw new Error(
          "The callGasLimit details is not displayed in the signV07 response"
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
    const paymasterContract = new ethers.Contract(
      paymasterAddressMultiToken,
      MultiTokenPaymasterAbi,
      providerMultiToken
    );

    try {
      await paymaster.getPaymasterAndDataForMultiTokenPaymaster(
        UserOpMultiToken,
        Mock_Valid_Until,
        Mock_Valid_After,
        feeTokenMultiToken,
        ethPriceMultiToken,
        paymasterContract,
        signerMultiToken
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
        oracleNameMultiToken
      );
    } catch (e) {
      throw new Error(
        "An error is displayed while performing signMultiTokenPaymaster action."
      );
    }
  });

  test.skip("SMOKE: validate the pimlico function with valid details", async () => {
    await delay(3000);
    const chainId = "11155111";
    const gasToken = "USDC";
    try {
      const tokenPaymasterAddress = PAYMASTER_ADDRESS[chainId][gasToken];
      const pimlicoResponse = await paymaster.pimlico(
        userOpV06,
        bundlerUrlPimlico,
        entryPointAddressPimlico,
        tokenPaymasterAddress
      );

      try {
        expect(pimlicoResponse).toHaveProperty("paymasterAndData");
      } catch (e) {
        throw new Error(
          "The paymasterAndData details is not displayed in the pimlico response"
        );
      }

      try {
        expect(pimlicoResponse).toHaveProperty("verificationGasLimit");
      } catch (e) {
        throw new Error(
          "The verificationGasLimit details is not displayed in the pimlico response"
        );
      }

      try {
        expect(pimlicoResponse).toHaveProperty("preVerificationGas");
      } catch (e) {
        throw new Error(
          "The preVerificationGas details is not displayed in the pimlico response"
        );
      }

      try {
        expect(pimlicoResponse).toHaveProperty("callGasLimit");
      } catch (e) {
        throw new Error(
          "The callGasLimit details is not displayed in the pimlico response"
        );
      }
    } catch (e) {
      throw new Error(
        "An error is displayed while using the pimlico function."
      );
    }
  });

  test("SMOKE: validate the pimlicoAddress function with valid details", async () => {
    await delay(3000);
    const chainId = 11155111;
    const gasToken = "USDC";
    try {
      const pimlicoAddressResponse = await paymaster.pimlicoAddress(
        gasToken,
        chainId
      );
      try {
        expect(pimlicoAddressResponse).toHaveProperty("message");
      } catch (e) {
        throw new Error(
          "The message details is not displayed in the pimlico address response"
        );
      }
    } catch (e) {
      throw new Error(
        "An error is displayed while using the pimlicoAddress function."
      );
    }
  });

  test("SMOKE: validate the deposit function with epv06 details", async () => {
    await delay(3000);
    const amount = "0.0000001";
    try {
      const depositResponse = await paymaster.deposit(
        amount,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId,
        true
      );

      const expectedMessage = depositResponse.message;
      const actualMessage = "Successfully deposited with transaction Hash";

      if (expectedMessage.includes(actualMessage)) {
        console.log("The deposit function is working as expected.");
      } else {
        throw new Error(
          "The valid message is not displayed while performing the deposit action."
        );
      }
    } catch (e: any) {
      throw new Error(
        "An error is displayed while performing the deposit action."
      );
    }
  });

  test("SMOKE: validate the deposit function with epv07 details", async () => {
    await delay(3000);
    const amount = "0.0000001";
    try {
      const depositResponse = await paymaster.deposit(
        amount,
        paymasterAddressV07,
        bundlerUrlV07,
        relayerKey,
        chainId,
        false
      );

      const expectedMessage = depositResponse.message;
      const actualMessage = "Successfully deposited with transaction Hash";

      if (expectedMessage.includes(actualMessage)) {
        console.log("The deposit function is working as expected.");
      } else {
        throw new Error(
          "The valid message is not displayed while performing the deposit action."
        );
      }
    } catch (e: any) {
      throw new Error(
        "An error is displayed while performing the deposit action."
      );
    }
  });

  test("REGRESSION: validate the signV06 function with invalid sender address detail", async () => {
    await delay(3000);
    const userOp = {
      sender: "0x1434E767F0D878de8C053896ec6F7e5d1951eE0", // invalid sender address
      nonce: "0x0",
      initCode:
        "0x7f6d8f107fe8551160bd5351d5f1514a6ad5d40e5fbfb9cf0000000000000000000000009ae4935fae629dd042c18df520322e0e9efad73d0000000000000000000000000000000000000000000000000000000000000000",
      callData:
        "0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000009184e72a000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
      callGasLimit: "0xc7ed",
      verificationGasLimit: "0x4d62f",
      maxFeePerGas: "0x59682f1e",
      maxPriorityFeePerGas: "0x59682f00",
      paymasterAndData: "0x",
      preVerificationGas: "0xb1f4",
      signature:
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    };

    try {
      await paymaster.signV06(
        userOp,
        Mock_Valid_Until,
        Mock_Valid_After,
        entryPointAddressV06,
        paymasterAddressV06,
        bundlerUrlV06,
        signerV06,
        true
      );
      throw new Error(
        "The sign function is worked, however the sender address is invalid."
      );
    } catch (e: any) {
      const actualMessage =
        "Please contact support team RawErrorMsg:invalid address";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The sender address is invalid while using the sign function."
        );
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid sender address while using the sign function."
        );
      }
    }
  });

  test("REGRESSION: validate the signV06 function with estimation is false", async () => {
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
        false
      );

      try {
        expect(signResponse).toHaveProperty("paymasterAndData");
      } catch (e) {
        throw new Error(
          "The paymasterAndData details is not displayed in the signV06 response"
        );
      }
    } catch (e) {
      throw new Error("An error is displayed while performing signV06 action.");
    }
  });

  test("REGRESSION: validate the signV06 function with invalid bundler", async () => {
    await delay(3000);
    try {
      await paymaster.signV06(
        userOpV06,
        Mock_Valid_Until,
        Mock_Valid_After,
        entryPointAddressV06,
        paymasterAddressV06,
        bundlerUrlV07,
        signerV06,
        true
      );
    } catch (e: any) {
      const actualMessage =
        "Failed to process request to bundler. Please contact support team RawErrorMsg";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log("The bundler is invalid while using the signV06 function.");
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid bundler while using the signV06 function."
        );
      }
    }
  });

  test("REGRESSION: validate the signV07 function with estimation is false", async () => {
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
        false
      );

      try {
        expect(signResponse).toHaveProperty("paymaster");
      } catch (e) {
        throw new Error(
          "The paymaster details is not displayed in the signV07 response"
        );
      }

      try {
        expect(signResponse).toHaveProperty("paymasterData");
      } catch (e) {
        throw new Error(
          "The paymasterData details is not displayed in the signV07 response"
        );
      }
    } catch (e) {
      throw new Error("An error is displayed while performing signV07 action.");
    }
  });

  test("REGRESSION: validate the signV07 function with invalid bundler", async () => {
    await delay(3000);
    try {
      await paymaster.signV07(
        userOpV07,
        Mock_Valid_Until,
        Mock_Valid_After,
        entryPointAddressV07,
        paymasterAddressV07,
        bundlerUrlV06,
        signerV07,
        true
      );
    } catch (e: any) {
      const actualMessage =
        "Failed to process request to bundler. Please contact support team RawErrorMsg";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log("The bundler is invalid while using the signv07 function.");
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid bundler while using the signv07 function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the pimlico function with invalid custom paymaster address", async () => {
    await delay(3000);
    const gasToken = "USDC";
    const address = ethers.Wallet.createRandom(); // random address
    try {
      await paymaster.pimlico(
        userOpV06,
        bundlerUrlV06,
        entryPointAddressV06,
        address.toString()
      ); // invalid custom paymaster address
      throw new Error(
        "The pimlico function is worked, however the customPaymasterAddress is invalid."
      );
    } catch (e: any) {
      const actualMessage =
        "Please contact support team RawErrorMsg: network does not support ENS";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The customPaymasterAddress is invalid while using the pimlico function."
        );
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid customPaymasterAddress while using the pimlico function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the pimlico function with invalid sender address", async () => {
    await delay(3000);
    const gasToken = "USDC";
    const userOp = {
      sender: "0x1434E767F0D878de8C053896ec6F7e5d1951eE0", // invalid sender address
      nonce: "0x0",
      initCode:
        "0x7f6d8f107fe8551160bd5351d5f1514a6ad5d40e5fbfb9cf0000000000000000000000009ae4935fae629dd042c18df520322e0e9efad73d0000000000000000000000000000000000000000000000000000000000000000",
      callData:
        "0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000009184e72a000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
      callGasLimit: "0xc7ed",
      verificationGasLimit: "0x4d62f",
      maxFeePerGas: "0x59682f1e",
      maxPriorityFeePerGas: "0x59682f00",
      paymasterAndData: "0x",
      preVerificationGas: "0xb1f4",
      signature:
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    };

    try {
      await paymaster.pimlico(
        userOp,
        bundlerUrlV06,
        entryPointAddressV06,
        PAYMASTER_ADDRESS[chainId][gasToken]
      );
      throw new Error(
        "The pimlico function is worked, however the sender address is invalid."
      );
    } catch (e: any) {
      const actualMessage =
        " Please contact support team RawErrorMsg: invalid address";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The sender address is invalid while using the pimlico function."
        );
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid sender address while using the pimlico function."
        );
      }
    }
  });

  test("REGRESSION: validate the whitelistAddresses function with not whitelisted address", async () => {
    await delay(3000);
    const wallet = ethers.Wallet.createRandom();
    const address = [wallet.address]; // not whitelisted address
    try {
      const whitelistAddresses = await paymaster.whitelistAddresses(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );

      if (
        whitelistAddresses.message.includes(
          "Successfully whitelisted with transaction Hash"
        )
      ) {
        console.log("The address is whitelisted successfully.");
      } else {
        throw new Error(
          "The expected success message is not displayed while performing the whitelistAddress action."
        );
      }
    } catch (e: any) {
      throw new Error(
        "An error is displayed while performing the whitelistAddress action."
      );
    }
  });

  test("REGRESSION: validate the whitelistAddresses function with already whitelisted address", async () => {
    await delay(3000);
    const address = ["0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321"]; // already whitelisted address
    try {
      await paymaster.whitelistAddresses(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );
      throw new Error(
        "Address is whitelisted, However it was already whitelisted."
      );
    } catch (e: any) {
      const actualMessage = "already whitelisted";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log("The address is already whitelisted.");
      } else {
        throw new Error(
          "The respective validation is not displayed for already whitelisted address.  "
        );
      }
    }
  });

  test("REGRESSION: validate the whitelistAddresses function with invalid relayerKey", async () => {
    await delay(3000);
    const address = ["0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321"]; // already whitelisted address
    const relayerKey =
      "0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb"; // invalid relayerKey
    try {
      await paymaster.whitelistAddresses(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );
      throw new Error(
        "Address is whitelisted, however the relayerKey is invalid."
      );
    } catch (e: any) {
      const actualMessage =
        "Please try again later or contact support team RawErrorMsg: hex data is odd-length";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The relayerKey is invalid while whitelisting the address."
        );
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid relayerKey while address whitelisting."
        );
      }
    }
  });

  test("REGRESSION: validate the checkWhitelistAddress function with whitelisted address", async () => {
    await delay(3000);
    const address = "0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321"; // whitelisted address
    try {
      const checkWhitelistAddressResponse =
        await paymaster.checkWhitelistAddress(
          address,
          paymasterAddressV06,
          bundlerUrlV06,
          relayerKey
        );
      if (checkWhitelistAddressResponse === true) {
        console.log("The address is whitelisted.");
      } else {
        throw new Error(
          "The address is displayed not whitelisted, however it is already whitelisted."
        );
      }
    } catch (e: any) {
      throw new Error(
        "An error is displayed while checking the address for whitelisting."
      );
    }
  });

  test("REGRESSION: validate the checkWhitelistAddress function with non whitelisted address", async () => {
    await delay(3000);
    const address = "0x8350355c08aDAC387b443782124A30A8942BeC2e"; // non whitelisted address
    try {
      const checkWhitelistAddressResponse =
        await paymaster.checkWhitelistAddress(
          address,
          paymasterAddressV06,
          bundlerUrlV06,
          relayerKey
        );
      if (checkWhitelistAddressResponse === false) {
        console.log("The address is not whitelisted as expected.");
      } else {
        throw new Error(
          "The address is displayed whitelisted, however it is not whitelisted."
        );
      }
    } catch (e: any) {
      throw new Error(
        "An error is displayed while checking the address for whitelisting."
      );
    }
  });

  test("REGRESSION: validate the checkWhitelistAddress function with invalid relayerKey", async () => {
    await delay(3000);
    const address = "0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321";
    const relayerKey =
      "0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb"; // invalid relayerKey
    try {
      await paymaster.checkWhitelistAddress(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey
      );
      throw new Error(
        "The whitelist address checking is performed, however the relayerKey is invalid."
      );
    } catch (e: any) {
      const actualMessage = "rpcError while checking whitelist";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The relayerKey is invalid while checking the whitelist address."
        );
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid relayerKey while checking the whitelist address."
        );
      }
    }
  });

  test("REGRESSION: validate the removeWhitelistAddress function with not whitelisted address", async () => {
    await delay(3000);
    let wallet = ethers.Wallet.createRandom();
    let address = [wallet.address]; // not whitelisted address

    // make the address whitelisted
    try {
      const whitelistAddresses = await paymaster.whitelistAddresses(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );

      if (
        whitelistAddresses.message.includes(
          "Successfully whitelisted with transaction Hash"
        )
      ) {
        console.log("The address is whitelisted successfully.");
      } else {
        throw new Error(
          "The expected success message is not displayed while performing the whitelistAddress action."
        );
      }
    } catch (e: any) {
      throw new Error(
        "An error is displayed while performing the whitelistAddress action."
      );
    }

    // wait for 10 second
    await delay(10000);

    // remove the address from the whitelisting
    try {
      const removeWhitelistAddress = await paymaster.removeWhitelistAddress(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );

      if (
        removeWhitelistAddress.message.includes(
          "Successfully removed whitelisted addresses"
        )
      ) {
        console.log(
          "The address is removed from the whitelisting successfully."
        );
      } else {
        throw new Error(
          "The expected success message is not displayed while performing the removeWhitelistAddress action."
        );
      }
    } catch (e: any) {
      throw new Error(
        "An error is displayed while performing the whitelistAddress action."
      );
    }
  });

  test("REGRESSION: validate the removeWhitelistAddress function with already removed from whitelisted address", async () => {
    await delay(3000);
    let wallet = ethers.Wallet.createRandom();
    let address = [wallet.address]; // not whitelisted address

    // make the address whitelisted
    try {
      await paymaster.whitelistAddresses(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );
    } catch (e: any) {
      console.log("error 1:::::::::", e);
      throw new Error(
        "An error is displayed while performing the whitelistAddress action."
      );
    }

    // wait for 10 second
    await delay(10000);

    // remove the address from the whitelisting
    try {
      await paymaster.removeWhitelistAddress(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );
    } catch (e: any) {
      console.log("error 2:::::::::", e);
      throw new Error(
        "An error is displayed while performing the removeWhitelistAddress action."
      );
    }

    // wait for 5 second
    await delay(5000);

    // again trying for removing address from whitelisting
    try {
      await paymaster.removeWhitelistAddress(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );
      throw new Error(
        "Address is removed from the whitelisting, However it was already removed from the whitelisting."
      );
    } catch (e: any) {
      console.log("error 3:::::::::", e);
      const actualMessage = "is not whitelisted";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log("The address is already removed from the whitelisting.");
      } else {
        throw new Error(
          "The respective validation is not displayed for already removed the address from whitelisting.  "
        );
      }
    }
  });

  test("REGRESSION: validate the removeWhitelistAddress function with invalid relayerKey", async () => {
    await delay(3000);
    let wallet = ethers.Wallet.createRandom();
    let address = [wallet.address]; // not whitelisted address
    const relayerKey =
      "0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb2"; // valid relayerKey
    const relayerKey_invalid =
      "0xdd45837c9d94e7cc3ed3b24be7c1951eff6ed3c6fd0baf68fc1ba8c0e51debb"; // invalid relayerKey

    // make the address whitelisted
    try {
      await paymaster.whitelistAddresses(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId
      );
    } catch (e: any) {
      console.log("error 1:::::::::", e);
      throw new Error(
        "An error is displayed while performing the whitelistAddress action."
      );
    }

    // wait for 10 second
    await delay(10000);

    // remove the address from the whitelisting
    try {
      await paymaster.removeWhitelistAddress(
        address,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey_invalid,
        chainId
      );
      throw new Error(
        "The removeWhitelistAddress action is performed with invalid relayerKey."
      );
    } catch (e: any) {
      console.log("error 2:::::::::", e);
      const actualMessage =
        "The wallet does not have enough funds or the gas price is too high at the moment.";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The relayerKey is invalid while perform the removing the address from the whitelisting."
        );
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid relayerKey while perform the removing the address from the whitelisting."
        );
      }
    }
  });

  test("REGRESSION: validate the deposit function with exceeded amount", async () => {
    await delay(3000);
    const amount = "10000000"; // exceeded amount
    try {
      await paymaster.deposit(
        amount,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId,
        true
      );
      throw new Error("The deposite action is performed with exceeded amount.");
    } catch (e: any) {
      const actualMessage = "Balance is less than the amount to be deposited";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log("The amount is exceeded while performing the deposit.");
      } else {
        throw new Error(
          "The respective validation is not displayed for exceeded amount while deposit."
        );
      }
    }
  });

  test("REGRESSION: validate the deposit function with invalid amount", async () => {
    await delay(3000);
    const amount = "abc"; // invalid amount
    try {
      await paymaster.deposit(
        amount,
        paymasterAddressV06,
        bundlerUrlV06,
        relayerKey,
        chainId,
        true
      );
      throw new Error("The deposite action is performed with invalid amount.");
    } catch (e: any) {
      console.log("error 1:::::::::", e);
      const actualMessage =
        "The wallet does not have enough funds or the gas price is too high at the moment.";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log("The amount is invalid while performing the deposit.");
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid amount while deposit."
        );
      }
    }
  });

  test("REGRESSION: validate the signV06 function with multiTokenMarkUp is NaN", async () => {
    await delay(3000);
    const paymaster1 = new Paymaster("0", "NaN");
    try {
      const signResponse = await paymaster1.signV06(
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

  test("REGRESSION: validate the signMultiTokenPaymaster function with valid details", async () => {
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
        "chainlink"
      );
    } catch (e: any) {
      const actualMessage =
        "Failed to process request to bundler. Please contact support team RawErrorMsg";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The oraclename is invalid while performing the signMultiTokenPaymaster."
        );
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid oraclename while signMultiTokenPaymaster."
        );
      }
    }
  });

  test("REGRESSION: validate the pimlicoAddress function with invalid chainid", async () => {
    await delay(3000);
    const chainId = 1115511; // invalid chainid
    const gasToken = "USDC";
    try {
      await paymaster.pimlicoAddress(gasToken, chainId);
    } catch (e: any) {
      const actualMessage = "Cannot read properties of undefined";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The chainid is invalid while performing the pimlicoAddress."
        );
      } else {
        throw new Error(
          "The respective validation is not displayed for invalid chainid while pimlicoAddress."
        );
      }
    }
  });
});
