/* eslint-disable @typescript-eslint/no-explicit-any */
import { providers, Wallet, ethers, Contract, BigNumber, BigNumberish } from 'ethers';
import { arrayify, BytesLike, defaultAbiCoder, hexConcat, hexZeroPad } from 'ethers/lib/utils.js';
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
import ERC20PaymasterV07Abi from '../abi/ERC20PaymasterV07Abi.js';
import ERC20Abi from '../abi/ERC20Abi.js';
import EtherspotChainlinkOracleAbi from '../abi/EtherspotChainlinkOracleAbi.js';

export class Paymaster {
  feeMarkUp: BigNumber;
  multiTokenMarkUp: number;
  EP7_TOKEN_VGL: string;
  EP7_TOKEN_PGL: string;

  constructor(feeMarkUp: string, multiTokenMarkUp: string, ep7TokenVGL: string, ep7TokenPGL: string) {
    this.feeMarkUp = ethers.utils.parseUnits(feeMarkUp, 'gwei');
    if (isNaN(Number(multiTokenMarkUp))) this.multiTokenMarkUp = 1150000 // 15% more of the actual cost. Can be anything between 1e6 to 2e6
    else this.multiTokenMarkUp = Number(multiTokenMarkUp);
    this.EP7_TOKEN_PGL = ep7TokenPGL;
    this.EP7_TOKEN_VGL = ep7TokenVGL;
  }

  packUint(high128: BigNumberish, low128: BigNumberish): string {
    return hexZeroPad(BigNumber.from(high128).shl(128).add(low128).toHexString(), 32)
  }

  packPaymasterData(paymaster: string, paymasterVerificationGasLimit: BigNumberish, postOpGasLimit: BigNumberish, paymasterData?: BytesLike): BytesLike {
    return ethers.utils.hexConcat([
      paymaster,
      this.packUint(paymasterVerificationGasLimit, postOpGasLimit),
      paymasterData ?? '0x'
    ])
  }

  async getPaymasterData(userOp: any, validUntil: string, validAfter: string, paymasterContract: Contract, signer: Wallet) {
    // actual signing...
    const hash = await paymasterContract.getHash(
      userOp,
      validUntil,
      validAfter
    );

    const sig = await signer.signMessage(arrayify(hash));

    const paymasterData = hexConcat([
      defaultAbiCoder.encode(
        ['uint48', 'uint48'],
        [validUntil, validAfter]
      ),
      sig,
    ]);

    return paymasterData;
  }

  async signV07(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string,
    bundlerRpc: string, signer: Wallet, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, EtherspotAbiV07, provider);
      if (!userOp.signature) userOp.signature = '0x';
      if (userOp.factory && userOp.factoryData) userOp.initCode = hexConcat([userOp.factory, userOp.factoryData ?? ''])
      if (!userOp.initCode) userOp.initCode = "0x";
      if (estimate) {
        const response = await provider.send('eth_estimateUserOperationGas', [userOp, entryPoint]);
        userOp.verificationGasLimit = response.verificationGasLimit;
        userOp.callGasLimit = response.callGasLimit;
        userOp.preVerificationGas = response.preVerificationGas;
      }
      const accountGasLimits = this.packUint(userOp.verificationGasLimit, userOp.callGasLimit)
      const gasFees = this.packUint(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas);
      const packedUserOp = {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode,
        callData: userOp.callData,
        accountGasLimits: accountGasLimits,
        preVerificationGas: userOp.preVerificationGas,
        gasFees: gasFees,
        paymasterAndData: this.packPaymasterData(paymasterAddress, BigNumber.from(30000), "0x1"),
        signature: userOp.signature
      }

      const paymasterData = await this.getPaymasterData(packedUserOp, validUntil, validAfter, paymasterContract, signer);
      let returnValue;
      if (estimate) {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: paymasterData,
          preVerificationGas: BigNumber.from(packedUserOp.preVerificationGas).toHexString(),
          verificationGasLimit: BigNumber.from(userOp.verificationGasLimit).toHexString(),
          callGasLimit: BigNumber.from(userOp.callGasLimit).toHexString(),
          paymasterVerificationGasLimit: BigNumber.from(30000).toString(),
          paymasterPostOpGasLimit: "0x1"
        }
      } else {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: paymasterData,
        }
      }

      return returnValue;
    } catch (err: any) {
      if (err.message.includes("Quota exceeded"))
        throw new Error('Failed to process request to bundler since request Quota exceeded for the current apiKey')
      if (log) log.error(err, 'signV07');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
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

  async signV06(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string,
    bundlerRpc: string, signer: Wallet, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, EtherspotAbiV06, provider);
      userOp.paymasterAndData = await this.getPaymasterAndData(userOp, validUntil, validAfter, paymasterContract, signer);
      if (!userOp.signature) userOp.signature = '0x';
      if (estimate) {
        const response = await provider.send('eth_estimateUserOperationGas', [userOp, entryPoint]);
        userOp.verificationGasLimit = response.verificationGasLimit;
        userOp.preVerificationGas = response.preVerificationGas;
        userOp.callGasLimit = response.callGasLimit;
      }
      const paymasterAndData = await this.getPaymasterAndData(userOp, validUntil, validAfter, paymasterContract, signer);
      let returnValue;
      if (estimate) {
        returnValue = {
          paymasterAndData,
          verificationGasLimit: userOp.verificationGasLimit,
          preVerificationGas: userOp.preVerificationGas,
          callGasLimit: userOp.callGasLimit,
        }
      } else {
        returnValue = {
          paymasterAndData
        }
      }

      return returnValue;
    } catch (err: any) {
      if (err.message.includes("Quota exceeded"))
        throw new Error('Failed to process request to bundler since request Quota exceeded for the current apiKey')
      if (log) log.error(err, 'signV06');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  }

  async getPaymasterAndDataForMultiTokenPaymaster(userOp: any, validUntil: string, validAfter: string, feeToken: string,
    ethPrice: string, paymasterContract: Contract, signer: Wallet) {
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
      ethPrice,
      priceMarkup,
    );

    const sig = await signer.signMessage(arrayify(hash));

    const paymasterAndData = hexConcat([
      paymasterContract.address,
      '0x00',
      defaultAbiCoder.encode(
        ['uint48', 'uint48', 'address', 'address', 'uint256', 'uint32'],
        [validUntil, validAfter, feeToken, ethers.constants.AddressZero, ethPrice, priceMarkup]
      ),
      sig,
    ]);

    return paymasterAndData;
  }

  async getQuotesMultiToken(userOp: any, entryPoint: string, chainId: number, multiTokenPaymasters: any, tokens_list: string[], oracles: any, 
    bundlerRpc: string, oracleName: string, nativeOracleAddress: string, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const quotes = [], unsupportedTokens = [];
      const result = {
        "postOpGas": "0x",
        "etherUSDExchangeRate": "0x",
        "paymasterAddress": "0x",
        "gasEstimates": {
          "preVerificationGas": "0x",
          "verificationGasLimit": "0x",
          "callGasLimit": "0x"
        },
        "feeEstimates": {
          "maxFeePerGas": "0x",
          "maxPriorityFeePerGas": "0x"
        },
        "quotes": [{}],
        "unsupportedTokens": [{}]
      }
      const response = await provider.send('eth_estimateUserOperationGas', [userOp, entryPoint]);
      result.gasEstimates.preVerificationGas = response.preVerificationGas;
      result.gasEstimates.callGasLimit = response.callGasLimit;
      result.gasEstimates.verificationGasLimit = response.verificationGasLimit;
      result.feeEstimates.maxFeePerGas = response.maxFeePerGas;
      result.feeEstimates.maxPriorityFeePerGas = response.maxPriorityFeePerGas;
      
      const paymasterKey = Object.keys(multiTokenPaymasters[chainId])[0];
      result.paymasterAddress = multiTokenPaymasters[chainId][paymasterKey];
      const paymasterContract = new ethers.Contract(result.paymasterAddress , MultiTokenPaymasterAbi, provider);
      result.postOpGas = await paymasterContract.UNACCOUNTED_COST;

      let ETHUSDPrice: any, ETHUSDPriceDecimal;
      if (oracleName === "chainlink") {
        const nativeOracleContract = new ethers.Contract(nativeOracleAddress, ChainlinkOracleAbi, provider);
        const ETHprice = await nativeOracleContract.latestRoundData();
        ETHUSDPrice = ETHprice.answer;
        ETHUSDPriceDecimal = await nativeOracleContract.decimals();
        result.etherUSDExchangeRate = ETHprice.answer;
      }
      for (let i = 0; i < tokens_list.length; i++) {
        const gasToken = tokens_list[i];
        if (!(multiTokenPaymasters[chainId] && multiTokenPaymasters[chainId][gasToken]) &&
          !(oracles[chainId] && oracles[chainId][gasToken]))
          unsupportedTokens.push({ token: gasToken })
        else {
          const oracleAddress = oracles[chainId][gasToken];
          let ethPrice = "";
          const tokenContract = new ethers.Contract(gasToken, ERC20Abi, provider)
          const decimals = await tokenContract.decimals();
          if (oracleName === "orochi") {
            const oracleContract = new ethers.Contract(oracleAddress, OrochiOracleAbi, provider);
            const ETHprice = await oracleContract.getLatestData(1, ethers.utils.hexlify(ethers.utils.toUtf8Bytes('ETH')).padEnd(42, '0'))
            // For orochi its one native for one usd so only stable tokens can be used
            if (decimals < 18)
              ethPrice = Number(ethers.utils.formatUnits(ETHprice, 18 - decimals)).toFixed(0);
          } else if (oracleName === "chainlink") {
            const chainlinkContract = new ethers.Contract(oracleAddress, ChainlinkOracleAbi, provider);
            const ETHpriceDecimal = await chainlinkContract.decimals();
            let ETHprice = await chainlinkContract.latestAnswer();
            ETHUSDPrice = ethers.utils.formatUnits(ETHUSDPrice, ETHUSDPriceDecimal);
            ETHprice = ethers.utils.formatUnits(ETHprice, ETHpriceDecimal);
            ETHUSDPrice = ethers.utils.parseEther(ETHUSDPrice);
            ETHprice = ethers.utils.parseEther(ETHprice);
            const tokenContract = new ethers.Contract(gasToken, ERC20Abi, provider);
            const decimals = Number(await tokenContract.decimals());
            ethPrice = ethers.utils.parseUnits((ETHUSDPrice/ETHprice).toFixed(decimals), decimals).toString()
          } else {
            const ecContract = new ethers.Contract(oracleAddress, EtherspotChainlinkOracleAbi, provider);
            const ETHprice = await ecContract.cachedPrice();
            ethPrice = ETHprice
          }
          if (result.etherUSDExchangeRate === "0x")
            result.etherUSDExchangeRate = BigNumber.from(ethPrice).toHexString();
          const symbol = await tokenContract.symbol();
          quotes.push({
            token: gasToken,
            symbol: symbol,
            decimals: decimals,
            etherTokenExchangeRate: BigNumber.from(ethPrice).toHexString(),
            serviceFeePercent: (this.multiTokenMarkUp/10000 - 100)
          })
        }
      }
      result.quotes = quotes;
      result.unsupportedTokens = unsupportedTokens;
      return result;
    } catch (err: any) {
      if (err.message.includes("Quota exceeded"))
        throw new Error('Failed to process request to bundler since request Quota exceeded for the current apiKey')
      if (log) log.error(err, 'getQuotesMultiToken');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  }

  async signMultiTokenPaymaster(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string,
    feeToken: string, oracleAggregator: string, bundlerRpc: string, signer: Wallet, oracleName: string, nativeOracleAddress: string, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, MultiTokenPaymasterAbi, provider);
      let ethPrice = "";

      if (oracleName === "orochi") {
        const oracleContract = new ethers.Contract(oracleAggregator, OrochiOracleAbi, provider);
        const ETHprice = await oracleContract.getLatestData(1, ethers.utils.hexlify(ethers.utils.toUtf8Bytes('ETH')).padEnd(42, '0'))
        // For orochi its one native for one usd so only stable tokens can be used
        const tokenContract = new ethers.Contract(feeToken, ERC20Abi, provider);
        const decimals = Number(await tokenContract.decimals());
        if (decimals < 18)
          ethPrice = Number(ethers.utils.formatUnits(ETHprice, 18 - decimals)).toFixed(0);
      } else if (oracleName === "chainlink") {
        const nativeOracleContract = new ethers.Contract(nativeOracleAddress, ChainlinkOracleAbi, provider);
        let ETHUSDPrice = await nativeOracleContract.latestAnswer();
        const chainlinkContract = new ethers.Contract(oracleAggregator, ChainlinkOracleAbi, provider);
        const ETHUSDPriceDecimal = await nativeOracleContract.decimals();
        const ETHpriceDecimal = await chainlinkContract.decimals();
        let ETHprice = await chainlinkContract.latestAnswer();
        ETHUSDPrice = ethers.utils.formatUnits(ETHUSDPrice, ETHUSDPriceDecimal);
        ETHprice = ethers.utils.formatUnits(ETHprice, ETHpriceDecimal);
        ETHUSDPrice = ethers.utils.parseEther(ETHUSDPrice);
        ETHprice = ethers.utils.parseEther(ETHprice);
        const tokenContract = new ethers.Contract(feeToken, ERC20Abi, provider);
        const decimals = Number(await tokenContract.decimals());
        ethPrice = ethers.utils.parseUnits((ETHUSDPrice/ETHprice).toFixed(decimals), decimals).toString()
      } else {
        const ecContract = new ethers.Contract(oracleAggregator, EtherspotChainlinkOracleAbi, provider);
        const ETHprice = await ecContract.cachedPrice();
        ethPrice = ETHprice
      }
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
      if (err.message.includes("Quota exceeded"))
        throw new Error('Failed to process request to bundler since request Quota exceeded for the current apiKey')
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

      if (tokenAmountRequired.gte(tokenBalance))
        throw new Error(`The required token amount ${tokenAmountRequired.toString()} is more than what the sender has ${tokenBalance}`)

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
      if (err.message.includes("Quota exceeded"))
        throw new Error('Failed to process request to bundler since request Quota exceeded for the current apiKey')
      if (err.message.includes('The required token amount')) throw new Error(err.message);
      if (log) log.error(err, 'pimlico');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg: ' + err.message)
    }
  }

  async ERC20PaymasterV07(userOp: any, bundlerRpc: string, entryPoint: string, paymasterAddress: string, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      if (!userOp.signature) userOp.signature = '0x';
      if (userOp.factory && userOp.factoryData) userOp.initCode = hexConcat([userOp.factory, userOp.factoryData ?? ''])
      if (!userOp.initCode) userOp.initCode = "0x";
      const erc20Paymaster = new Contract(paymasterAddress, ERC20PaymasterV07Abi, provider)
      const tokenAddress = await erc20Paymaster.token();
      const tokenPrice = await erc20Paymaster.getPrice();
      const priceMarkup = await erc20Paymaster.priceMarkup();
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
      const maxCost = BigNumber.from(userOp.preVerificationGas ?? 0).add(userOp.callGasLimit ?? 0).add(userOp.verificationGasLimit ?? 0);
      if (!userOp.maxFeePerGas) userOp.maxFeePerGas = "0x1";
      let tokenAmountRequired = maxCost.add('30000').mul(userOp.maxFeePerGas)
      tokenAmountRequired = tokenAmountRequired.mul(priceMarkup).div(1e6).mul(tokenPrice).div(ethers.utils.parseEther('1'))
      const tokenContract = new Contract(tokenAddress, minABI, provider)
      const tokenBalance = await tokenContract.balanceOf(userOp.sender);

      if (tokenAmountRequired.gte(tokenBalance))
        throw new Error(`The required token amount ${tokenAmountRequired.toString()} is more than what the sender has ${tokenBalance}`)
      if (estimate) {
        userOp.paymaster = paymasterAddress;
        userOp.paymasterVerificationGasLimit = BigNumber.from(this.EP7_TOKEN_VGL).toHexString();
        userOp.paymasterPostOpGasLimit = BigNumber.from(this.EP7_TOKEN_PGL).toHexString();
        const response = await provider.send('eth_estimateUserOperationGas', [userOp, entryPoint]);
        userOp.verificationGasLimit = response.verificationGasLimit;
        userOp.callGasLimit = response.callGasLimit;
        userOp.preVerificationGas = response.preVerificationGas;
      }
      let returnValue;
      if (estimate) {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: "0x", // since the default mode is 0
          preVerificationGas: BigNumber.from(userOp.preVerificationGas).toHexString(),
          verificationGasLimit: BigNumber.from(userOp.verificationGasLimit).toHexString(),
          callGasLimit: BigNumber.from(userOp.callGasLimit).toHexString(),
          paymasterVerificationGasLimit: BigNumber.from(this.EP7_TOKEN_VGL).toHexString(),
          paymasterPostOpGasLimit: BigNumber.from(this.EP7_TOKEN_PGL).toHexString()
        }
      } else {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: "0x",
        }
      }

      return returnValue;
    } catch (err: any) {
      if (err.message.includes("Quota exceeded"))
        throw new Error('Failed to process request to bundler since request Quota exceeded for the current apiKey')
      if (log) log.error(err, 'ERC20Paymaster');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
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
      const paymasterContract = new ethers.Contract(paymasterAddress, EtherspotAbiV06, provider);
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
      const paymasterContract = new ethers.Contract(paymasterAddress, EtherspotAbiV06, provider);
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
      const paymasterContract = new ethers.Contract(paymasterAddress, EtherspotAbiV06, provider);
      return paymasterContract.check(signer.address, accountAddress);
    } catch (err) {
      if (log) log.error(err, 'checkWhitelistAddress');
      throw new Error(ErrorMessage.RPC_ERROR);
    }
  }

  async deposit(amount: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string, chainId: number, isEpv06: boolean, log?: FastifyBaseLogger) {
    try {
      const provider = new providers.JsonRpcProvider(bundlerRpc);
      const paymasterContract = new ethers.Contract(paymasterAddress, isEpv06 ? EtherspotAbiV06 : EtherspotAbiV07, provider);
      const signer = new Wallet(relayerKey, provider)
      const balance = await signer.getBalance();
      const amountInWei = ethers.utils.parseEther(amount.toString());
      if (amountInWei.gte(balance))
        throw new Error(`${signer.address} Balance is less than the amount to be deposited`)

      const encodedData = paymasterContract.interface.encodeFunctionData(isEpv06 ? 'depositFunds' : 'deposit', []);

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
