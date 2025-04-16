/* eslint-disable @typescript-eslint/no-explicit-any */
import { providers, ethers } from "ethers";
import { TokenPaymaster, getERC20Paymaster } from "./token.js";
import {
  NATIVE_ASSET,
  ORACLE_ADDRESS,
  TOKEN_ADDRESS,
} from "../constants/Token.js";

describe("TokenPaymaster on Mumbai", () => {
  const paymasterAddress = "0x32aCDFeA07a614E52403d2c1feB747aa8079A353"; // Mumbai Etherspot Paymaster Address
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // EntryPoint v0.6 as default
  const bundlerUrl = "https://mumbai-bundler.etherspot.io";
  const userOp = {
    sender: "0x7b3078b9A28DF76453CDfD2bA5E75f32f0676321",
    nonce: "0x1",
    initCode: "0x",
    callData:
      "0x47e1da2a000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000080a1874e1046b1cc5defdf4d3153838b72ff94ac0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000",
    callGasLimit: "0x88b8",
    verificationGasLimit: "0x186a0",
    maxFeePerGas: "0x6fc23ac10",
    maxPriorityFeePerGas: "0x6fc23ac00",
    paymasterAndData:
      "0x0101010101010101010101010101010101010101000000000000000000000000000000000000000000000000000001010101010100000000000000000000000000000000000000000000000000000000000000000101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101",
    signature:
      "0x0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101",
    preVerificationGas: "0xc6c4",
  };

  const ERC20PaymasterBuildOptions = {
    entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    nativeAsset: NATIVE_ASSET[80001],
    nativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
    tokenAddress: TOKEN_ADDRESS[80001].USDC,
    tokenOracle: ORACLE_ADDRESS[80001].USDC,
    owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
    deployer: "0x4337000c2828f5260d8921fd25829f606b9e8680",
  };

  const provider = new providers.JsonRpcProvider(bundlerUrl);
  const tokenPaymaster = new TokenPaymaster(paymasterAddress, provider);

  test.skip("SMOKE: validate the calculateTokenAmount function with valid details", async () => {
    try {
      const calculateTokenAmountResponse =
        await tokenPaymaster.calculateTokenAmount(userOp);

      try {
        expect(calculateTokenAmountResponse).toHaveProperty("_hex");
      } catch (e) {
        fail(
          "The _hex details is not displayed in the calculate token amount response"
        );
      }
    } catch (e) {
      fail(
        "An error is displayed while performing calculateTokenAmount action."
      );
    }
  });

  test.skip("SMOKE: validate the generatePaymasterAndData function with valid details", async () => {
    try {
      const generatePaymasterAndDataResponse =
        await tokenPaymaster.generatePaymasterAndData(userOp);
      try {
        expect(generatePaymasterAndDataResponse.length.toString()).toMatch(
          "106"
        );
      } catch (e) {
        fail(
          "The paymaster and data details is not displayed in the generatePaymasterAndData response"
        );
      }
    } catch (e) {
      fail(
        "An error is displayed while performing generatePaymasterAndData action."
      );
    }
  });

  test.skip("SMOKE: validate the getERC20Paymaster function with valid details", async () => {
    const erc20 = "USDC";
    try {
      const getERC20PaymasterResponse = await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress
      );

      try {
        expect(getERC20PaymasterResponse).toHaveProperty("paymasterAddress");
      } catch (e) {
        fail(
          "The paymasterAddress details is not displayed in the getERC20Paymaster response"
        );
      }
    } catch (e) {
      fail("An error is displayed while performing getERC20Paymaster action.");
    }
  });

  test.skip("SMOKE: validate the getERC20Paymaster function with valid details and ERC20 paymaster build options", async () => {
    const erc20 = "USDC";
    try {
      const getERC20PaymasterResponse = await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );

      try {
        expect(getERC20PaymasterResponse).toHaveProperty("paymasterAddress");
      } catch (e) {
        fail(
          "The paymasterAddress details is not displayed in the getERC20Paymaster response"
        );
      }
    } catch (e) {
      fail("An error is displayed while performing getERC20Paymaster action.");
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with without owner", async () => {
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: NATIVE_ASSET[80001],
      nativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
      tokenAddress: TOKEN_ADDRESS[80001].USDC,
      tokenOracle: ORACLE_ADDRESS[80001].USDC,
      deployer: "0x4337000c2828f5260d8921fd25829f606b9e8680",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the onwer is not available."
      );
    } catch (e: any) {
      const actualMessage = "Owner must be provided";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The owner is not available while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when owner not added while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with without deployer", async () => {
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: NATIVE_ASSET[80001],
      nativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
      tokenAddress: TOKEN_ADDRESS[80001].USDC,
      tokenOracle: ORACLE_ADDRESS[80001].USDC,
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the deployer is not available."
      );
    } catch (e: any) {
      const actualMessage = "Deployer must be provided";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The deployer is not available while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when deployer not added while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with invalid native asset", async () => {
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: "",
      nativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
      tokenAddress: TOKEN_ADDRESS[80001].USDC,
      tokenOracle: ORACLE_ADDRESS[80001].USDC,
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
      deployer: "0x4337000c2828f5260d8921fd25829f606b9e8680",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the Native asset is invalid."
      );
    } catch (e: any) {
      const actualMessage = "Native asset not found - chainId";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The Native asset is invalid while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when invalid Native asset added while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with invalid native asset oracle", async () => {
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: "80002",
      nativeAssetOracle: ORACLE_ADDRESS[80001].ETH,
      tokenAddress: TOKEN_ADDRESS[80001].USDC,
      tokenOracle: ORACLE_ADDRESS[80001].USDC,
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
      deployer: "0x4337000c2828f5260d8921fd25829f606b9e8680",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the Native asset oracle is invalid."
      );
    } catch (e: any) {
      const actualMessage = "Native asset oracle not found - chainId";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The Native asset oracle is invalid while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when invalid Native asset oracle added while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with native asset oracle not deployed", async () => {
    const randomAddress = ethers.Wallet.createRandom();
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: NATIVE_ASSET[80001],
      nativeAssetOracle: randomAddress.address,
      tokenAddress: TOKEN_ADDRESS[80001].USDC,
      tokenOracle: ORACLE_ADDRESS[80001].USDC,
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
      deployer: "0x4337000c2828f5260d8921fd25829f606b9e8680",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the Native asset oracle is not deployed."
      );
    } catch (e: any) {
      const actualMessage = "Oracle for MATIC on chainId 80001 is not deployed";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The Native asset oracle is not deployed while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when Native asset oracle not deployed while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with invalid token address", async () => {
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: NATIVE_ASSET[80001],
      nnativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
      tokenAddress: "",
      tokenOracle: ORACLE_ADDRESS[80001].USDC,
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
      deployer: "0x4337000c2828f5260d8921fd25829f606b9e8685",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the token address is invalid."
      );
    } catch (e: any) {
      const actualMessage = "Token USDC not supported on chainId";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The token address is invalid while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when invalid token address added while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with token address not deployed", async () => {
    const randomAddress = ethers.Wallet.createRandom();
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: NATIVE_ASSET[80001],
      nnativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
      tokenAddress: randomAddress.address,
      tokenOracle: ORACLE_ADDRESS[80001].USDC,
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
      deployer: "0x4337000c2828f5260d8921fd25829f606b9e8685",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the token address is not deployed."
      );
    } catch (e: any) {
      const actualMessage = "Token USDC on 80001 is not deployed";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The token address is not deployed while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when token address not deployed while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with invalid token oracle", async () => {
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: NATIVE_ASSET[80001],
      nnativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
      tokenAddress: ORACLE_ADDRESS[80001].USDC,
      tokenOracle: "",
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
      deployer: "0x4337000c2828f5260d8921fd25829f606b9e8685",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the token oracle is invalid."
      );
    } catch (e: any) {
      const actualMessage =
        "Oracle for USDC not found, not supported on chainId";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The token oracle is invalid while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when invalid token oracle added while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with token oracle not deployed", async () => {
    const randomAddress = ethers.Wallet.createRandom();
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: NATIVE_ASSET[80001],
      nnativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
      tokenAddress: ORACLE_ADDRESS[80001].USDC,
      tokenOracle: randomAddress.address,
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
      deployer: "0x4337000c2828f5260d8921fd25829f606b9e8685",
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the token oracle is not deployed."
      );
    } catch (e: any) {
      const actualMessage = "Oracle for USDC on 80001 is not deployed";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The token oracle is not deployed while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when token oracle not deployed while using the getERC20Paymaster function."
        );
      }
    }
  });

  test.skip("REGRESSION: validate the getERC20Paymaster function with ERC20Paymaster not deployed", async () => {
    const randomAddress = ethers.Wallet.createRandom();
    const erc20 = "USDC";
    const ERC20PaymasterBuildOptions = {
      entrypoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      nativeAsset: NATIVE_ASSET[80001],
      nnativeAssetOracle: ORACLE_ADDRESS[80001].MATIC,
      tokenAddress: ORACLE_ADDRESS[80001].USDC,
      tokenOracle: ORACLE_ADDRESS[80001].USDC,
      owner: "0x4337000c2828f5260d8921fd25829f606b9e8680",
      deployer: randomAddress,
    };
    try {
      await getERC20Paymaster(
        provider,
        erc20,
        entryPointAddress,
        ERC20PaymasterBuildOptions
      );
      fail(
        "The getERC20Paymaster function is worked, however the ERC20Paymaster not deployed."
      );
    } catch (e: any) {
      const actualMessage = "ERC20Paymaster not deployed at";
      const expectedMessage = e.message;
      if (expectedMessage.includes(actualMessage)) {
        console.log(
          "The ERC20Paymaster not deployed while using the getERC20Paymaster function."
        );
      } else {
        fail(
          "The respective validation is not displayed when ERC20Paymaster not deployed while using the getERC20Paymaster function."
        );
      }
    }
  });
});
