/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther, 
  parseUnits, 
  formatUnits, 
  getAddress, 
  keccak256, 
  toHex, 
  concat, 
  hexToBytes, 
  bytesToHex,
  encodeAbiParameters,
  Address,
  Hex,
  PublicClient,
  PrivateKeyAccount,
  parseAbiParameters,
  encodeFunctionData,
  getContract,
  type TransactionRequest,
  parseAbi,
  stringToBytes,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { FastifyBaseLogger } from 'fastify';
import { Sequelize } from 'sequelize';
import EtherspotAbiV06 from '../abi/EtherspotAbi.js';
import EtherspotAbiV07 from "../abi/EtherspotVerifyingSignerAbi.js";
import ErrorMessage from '../constants/ErrorMessage.js';
import { getGasFee, getViemChainDef } from '../utils/common.js';
import MultiTokenPaymasterAbi from '../abi/MultiTokenPaymasterAbi.js';
import OrochiOracleAbi from '../abi/OrochiOracleAbi.js';
import ChainlinkOracleAbi from '../abi/ChainlinkOracleAbi.js';
import ERC20PaymasterV07Abi from '../abi/ERC20PaymasterV07Abi.js';
import ERC20Abi from '../abi/ERC20Abi.js';
import EtherspotChainlinkOracleAbi from '../abi/EtherspotChainlinkOracleAbi.js';
import { OracleDecimals, TokenDecimalsAndSymbol, UnaccountedCost } from '../constants/MultitokenPaymaster.js';
import { NativeOracleDecimals } from '../constants/ChainlinkOracles.js';
import { CoingeckoTokensRepository } from '../repository/coingecko-token-repository.js';
import { CoingeckoService } from '../services/coingecko.js';
import { abi as verifyingPaymasterAbi, byteCode as verifyingPaymasterByteCode } from '../abi/VerifyingPaymasterAbi.js';
import { abi as verifyingPaymasterV2Abi, byteCode as verifyingPaymasterV2ByteCode } from '../abi/VerifyingPaymasterAbiV2.js';
import { abi as verifyingPaymasterV3Abi, byteCode as verifyingPaymasterV3ByteCode } from '../abi/VerifyingPaymasterAbiV3.js';
import { EPVersions } from '../types/sponsorship-policy-dto.js';
import MultiTokenPaymasterAbiV2 from '../abi/MultiTokenPaymasterAbiV2.js';

const ttl = parseInt(process.env.CACHE_TTL || "600000");
const nativePriceCacheTtl = parseInt(process.env.NATIVE_PRICE_CACHE_TTL || "60000");

interface TokenPriceAndMetadata {
  decimals: number;
  symbol: string;
  ethPrice: any;
  gasToken: string
}

interface TokenPriceAndMetadataCache {
  data: TokenPriceAndMetadata;
  expiry: number
}

interface NativeCurrencyPricyCache {
  data: any;
  expiry: number;
}

interface CoingeckoPriceCache {
  data: any;
  expiry: number;
}

interface ConstructorParams {
  feeMarkUp: string;
  multiTokenMarkUp: string;
  ep7TokenVGL: string;
  ep7TokenPGL: string;
  sequelize: Sequelize;
  mtpVglMarkup: string;
  ep7Pvgl: string;
  mtpPvgl: string;
  mtpPpgl: string;
  ep8Pvgl: string;
  skipType2Txns: string[];
}

export class Paymaster {
  feeMarkUp: bigint;
  multiTokenMarkUp: number;
  MTP_VGL_MARKUP: string;
  EP7_TOKEN_VGL: string;
  EP7_TOKEN_PGL: string;
  EP7_PVGL: bigint;
  EP8_PVGL: bigint;
  MTP_PVGL: string;
  MTP_PPGL: string;
  priceAndMetadata: Map<string, TokenPriceAndMetadataCache> = new Map();
  nativeCurrencyPrice: Map<string, NativeCurrencyPricyCache> = new Map();
  coingeckoPrice: Map<string, CoingeckoPriceCache> = new Map();
  coingeckoService: CoingeckoService = new CoingeckoService();
  sequelize: Sequelize;
  skipType2Txns: string[];

  constructor(params: ConstructorParams) {
    this.feeMarkUp = parseUnits(params.feeMarkUp, 9); // gwei = 9 decimals
    if (isNaN(Number(params.multiTokenMarkUp))) this.multiTokenMarkUp = 1150000 // 15% more of the actual cost. Can be anything between 1e6 to 2e6
    else this.multiTokenMarkUp = Number(params.multiTokenMarkUp);
    this.EP7_TOKEN_PGL = params.ep7TokenPGL;
    this.EP7_TOKEN_VGL = params.ep7TokenVGL;
    this.sequelize = params.sequelize;
    this.MTP_VGL_MARKUP = params.mtpVglMarkup;
    this.EP7_PVGL = BigInt(params.ep7Pvgl);
    this.EP8_PVGL = BigInt(params.ep8Pvgl);
    this.MTP_PVGL = params.mtpPvgl;
    this.MTP_PPGL = params.mtpPpgl;
    this.skipType2Txns = params.skipType2Txns;
  }

  packUint(high128: bigint, low128: bigint): Hex {
    return toHex((high128 << 128n) + low128, { size: 32 })
  }

  packPaymasterData(paymaster: string, paymasterVerificationGasLimit: bigint, postOpGasLimit: bigint, paymasterData?: Hex): Hex {
    return concat([
      paymaster as Hex,
      this.packUint(paymasterVerificationGasLimit, postOpGasLimit),
      (paymasterData ?? '0x') as Hex
    ])
  }

  async getPaymasterData(userOp: any, validUntil: string, validAfter: string, paymasterContract: any, signer: PrivateKeyAccount) {
    // actual signing...
    const hash = await paymasterContract.read.getHash([
      userOp,
      validUntil,
      validAfter
    ]);

    const sig = await signer.signMessage({ message: { raw: hexToBytes(hash) } });

    const paymasterData = concat([
      encodeAbiParameters(
        parseAbiParameters('uint48, uint48'),
        [Number(validUntil), Number(validAfter)]
      ),
      sig as Hex,
    ]);

    return paymasterData;
  }

  async signV07(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string,
    bundlerRpc: string, signer: PrivateKeyAccount, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const publicClient = createPublicClient({ transport: http(bundlerRpc) });
      const paymasterContract = getContract({ address: paymasterAddress as Address, abi: EtherspotAbiV07, client: publicClient });
      if (!userOp.signature) userOp.signature = '0x';
      if (userOp.factory && userOp.factoryData) userOp.initCode = concat([userOp.factory as Hex, userOp.factoryData ?? '0x'])
      if (!userOp.initCode) userOp.initCode = "0x";
      const paymasterPostOpGasLimit = BigInt(40000n);
      if (estimate) {
        userOp.paymaster = paymasterAddress;
        userOp.paymasterVerificationGasLimit = toHex(this.EP7_PVGL);
        userOp.paymasterPostOpGasLimit = paymasterPostOpGasLimit;
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
          paymasterAndData: this.packPaymasterData(paymasterAddress, this.EP7_PVGL, paymasterPostOpGasLimit),
          signature: userOp.signature
        }
        userOp.paymasterData = await this.getPaymasterData(packedUserOp, validUntil, validAfter, paymasterContract, signer);
        const response = await publicClient.request({ method: 'eth_estimateUserOperationGas', params: [userOp, entryPoint] } as any) as any;
        userOp.verificationGasLimit = (response as any).verificationGasLimit;
        userOp.callGasLimit = (response as any).callGasLimit;
        userOp.preVerificationGas = (response as any).preVerificationGas;
      }
      const accountGasLimits = this.packUint(BigInt(userOp.verificationGasLimit), BigInt(userOp.callGasLimit))
      const gasFees = this.packUint(BigInt(userOp.maxPriorityFeePerGas), BigInt(userOp.maxFeePerGas));
      const packedUserOp = {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode,
        callData: userOp.callData,
        accountGasLimits: accountGasLimits,
        preVerificationGas: userOp.preVerificationGas,
        gasFees: gasFees,
        paymasterAndData: this.packPaymasterData(paymasterAddress, this.EP7_PVGL, paymasterPostOpGasLimit),
        signature: userOp.signature
      }

      const paymasterData = await this.getPaymasterData(packedUserOp, validUntil, validAfter, paymasterContract, signer);
      let returnValue;
      if (estimate) {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: paymasterData,
          preVerificationGas: toHex(BigInt(packedUserOp.preVerificationGas)),
          verificationGasLimit: toHex(BigInt(userOp.verificationGasLimit)),
          callGasLimit: toHex(BigInt(userOp.callGasLimit)),
          paymasterVerificationGasLimit: toHex(this.EP7_PVGL),
          paymasterPostOpGasLimit: toHex(paymasterPostOpGasLimit)
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

  async signV08(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string,
    bundlerRpc: string, signer: PrivateKeyAccount, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const publicClient = createPublicClient({ transport: http(bundlerRpc) });
      const walletClient = createWalletClient({ transport: http(bundlerRpc), account: signer })
      const paymasterContract = getContract({ address: paymasterAddress as Address, abi: verifyingPaymasterV3Abi, client: walletClient });
      const vpAddress = await paymasterContract.read.verifyingSigner();
      if (vpAddress !== signer.address) {
        await paymasterContract.write.updateVerifyingSigner([signer.address]);
      }
      if (!userOp.signature) userOp.signature = '0x';
      if (userOp.factory && userOp.factoryData) userOp.initCode = concat([userOp.factory as Hex, userOp.factoryData ?? '0x'])
      if (!userOp.initCode) userOp.initCode = "0x";
      const paymasterPostOpGasLimit = BigInt(40000n);
      if (estimate) {
        userOp.paymaster = paymasterAddress;
        userOp.paymasterVerificationGasLimit = toHex(this.EP8_PVGL);
        userOp.paymasterPostOpGasLimit = paymasterPostOpGasLimit;
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
          paymasterAndData: this.packPaymasterData(paymasterAddress, this.EP8_PVGL, paymasterPostOpGasLimit),
          signature: userOp.signature
        }
        userOp.paymasterData = await this.getPaymasterData(packedUserOp, validUntil, validAfter, paymasterContract, signer);
        const response = await publicClient.request({ method: 'eth_estimateUserOperationGas', params: [userOp, entryPoint] } as any) as any;
        userOp.verificationGasLimit = (response as any).verificationGasLimit;
        userOp.callGasLimit = (response as any).callGasLimit;
        userOp.preVerificationGas = (response as any).preVerificationGas;
      }
      const accountGasLimits = this.packUint(BigInt(userOp.verificationGasLimit), BigInt(userOp.callGasLimit))
      const gasFees = this.packUint(BigInt(userOp.maxPriorityFeePerGas), BigInt(userOp.maxFeePerGas));
      const packedUserOp = {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode,
        callData: userOp.callData,
        accountGasLimits: accountGasLimits,
        preVerificationGas: userOp.preVerificationGas,
        gasFees: gasFees,
        paymasterAndData: this.packPaymasterData(paymasterAddress, this.EP8_PVGL, paymasterPostOpGasLimit),
        signature: userOp.signature
      }

      const paymasterData = await this.getPaymasterData(packedUserOp, validUntil, validAfter, paymasterContract, signer);
      let returnValue;
      if (estimate) {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: paymasterData,
          preVerificationGas: toHex(BigInt(packedUserOp.preVerificationGas)),
          verificationGasLimit: toHex(BigInt(userOp.verificationGasLimit)),
          callGasLimit: toHex(BigInt(userOp.callGasLimit)),
          paymasterVerificationGasLimit: toHex(this.EP8_PVGL),
          paymasterPostOpGasLimit: toHex(paymasterPostOpGasLimit)
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
      if (log) log.error(err, 'signV08');
      throw new Error(`Failed to process request to bundler. Please contact support team RawErrorMsg: ${err.message}`)
    }
  }

  async getPaymasterAndData(userOp: any, validUntil: string, validAfter: string, paymasterContract: any, signer: PrivateKeyAccount) {
    // actual signing...
    const hash = await paymasterContract.read.getHash([
      userOp,
      validUntil,
      validAfter
    ]);

    const sig = await signer.signMessage({ message: { raw: hexToBytes(hash) } });

    const paymasterAndData = concat([
      paymasterContract.address,
      encodeAbiParameters(
        parseAbiParameters('uint48, uint48'),
        [Number(validUntil), Number(validAfter)]
      ),
      sig,
    ]);

    return paymasterAndData;
  }

  async signV06(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string,
    bundlerRpc: string, signer: PrivateKeyAccount, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const publicClient = createPublicClient({ transport: http(bundlerRpc) });
      const paymasterContract = getContract({ address: paymasterAddress as Address, abi: EtherspotAbiV06, client: publicClient });
      userOp.paymasterAndData = await this.getPaymasterAndData(userOp, validUntil, validAfter, paymasterContract, signer);
      if (!userOp.signature) userOp.signature = '0x';
      if (estimate) {
        const response: any = await publicClient.request({ method: 'eth_estimateUserOperationGas', params: [userOp, entryPoint as Address] } as any);
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

  async getPaymasterAndDataForMultiTokenPaymasterV07(userOp: any, validUntil: string, validAfter: string, feeToken: string,
    ethPrice: string, paymasterContract: any, signer: PrivateKeyAccount) {
    try {
      const priceMarkup = this.multiTokenMarkUp;
      const hash = await paymasterContract.read.getHash([
        userOp,
        0n,
        validUntil,
        validAfter,
        feeToken,
        '0x0000000000000000000000000000000000000000',
        ethPrice,
        priceMarkup
      ]);

      const sig = await signer.signMessage({ message: { raw: hexToBytes(hash) } });

      const paymasterData = concat([
        '0x00',
        encodeAbiParameters(
          parseAbiParameters('uint48, uint48, address, address, uint256, uint32'),
          [Number(validUntil), Number(validAfter), feeToken as Address, '0x0000000000000000000000000000000000000000', BigInt(ethPrice), priceMarkup]
        ),
        sig,
      ]);

      return paymasterData;
    } catch (err: any) {
      throw new Error('Failed ' + err.message)
    }
  }

  async getPaymasterAndDataForMultiTokenPaymaster(userOp: any, validUntil: string, validAfter: string, feeToken: string,
    ethPrice: string, paymasterContract: any, signer: PrivateKeyAccount, chainId: number) {
    const priceMarkup = this.multiTokenMarkUp;

    const hash = keccak256(
      encodeAbiParameters(
        parseAbiParameters(
          "address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, uint256, address, uint8, uint48, uint48, address, address, uint256, uint32"
        ),
        [
          userOp.sender,
          userOp.nonce,
          keccak256(userOp.initCode),
          keccak256(userOp.callData),
          userOp.callGasLimit,
          userOp.verificationGasLimit,
          userOp.preVerificationGas,
          userOp.maxFeePerGas,
          userOp.maxPriorityFeePerGas,
          BigInt(chainId),
          paymasterContract.address,
          0,
          Number(validUntil),
          Number(validAfter),
          feeToken as Address,
          '0x0000000000000000000000000000000000000000',
          BigInt(ethPrice),
          priceMarkup
        ]
      )
    );

    const sig = await signer.signMessage({ message: { raw: hexToBytes(hash) } });

    const paymasterAndData = concat([
      paymasterContract.address,
      '0x00',
      encodeAbiParameters(
        parseAbiParameters('uint48, uint48, address, address, uint256, uint32'),
        [Number(validUntil), Number(validAfter), feeToken as Address, '0x0000000000000000000000000000000000000000', BigInt(ethPrice), priceMarkup]
      ),
      sig,
    ]);

    return paymasterAndData;
  }

  private async getTokenDecimals(token: string, chainId: number, publicClient: PublicClient) {
    if (TokenDecimalsAndSymbol[chainId]?.[token]) {
      return TokenDecimalsAndSymbol[chainId][token]?.decimals;
    }
    const tokenContract = getContract({ address: token as Address, abi: ERC20Abi, client: publicClient });
    return tokenContract.read.decimals();
  }

  private async getTokenSymbol(token: string, chainId: number, publicClient: PublicClient): Promise<string> {
    if (TokenDecimalsAndSymbol[chainId]?.[token]) {
      return TokenDecimalsAndSymbol[chainId][token]?.symbol;
    }
    const tokenContract = getContract({ address: token as Address, abi: parseAbi(['function symbol() view returns (string)']), client: publicClient });
    return tokenContract.read.symbol();
  }

  private async getChainlinkOracleDecimals(oracleAddress: string, chainId: number, oracleContract: any) {
    if (OracleDecimals[chainId]?.[oracleAddress]) {
      return OracleDecimals[chainId][oracleAddress]?.decimals;
    }
    return oracleContract.read.decimals();
  }

  private async getEstimateUserOperationGas(
    publicClient: PublicClient,
    userOp: any,
    entryPoint: string,
  ) {
    return publicClient.request({ method: 'eth_estimateUserOperationGas', params: [userOp, entryPoint] } as any);
  }

  async getLatestAnswerAndDecimals(
    publicClient: PublicClient,
    nativeOracleAddress: string,
    chainId: number,
    useCache = true
  ) {
    const cacheKey = `${chainId}-${nativeOracleAddress}`;
    const cache = this.nativeCurrencyPrice.get(cacheKey);

    if (useCache && cache && cache.expiry > Date.now()) {
      return {
        latestAnswer: cache.data,
        decimals: NativeOracleDecimals
      }
    }
    const nativeOracleContract = getContract({ address: nativeOracleAddress as Address, abi: ChainlinkOracleAbi, client: publicClient });
    return nativeOracleContract.read.latestAnswer().then((data: any) => {
      this.nativeCurrencyPrice.set(cacheKey, { data, expiry: Date.now() + nativePriceCacheTtl });
      return {
        latestAnswer: data,
        decimals: NativeOracleDecimals
      }
    });
  }

  private async getEstimateUserOperationGasAndData(
    publicClient: PublicClient,
    userOp: any,
    entryPoint: string,
    nativeOracleAddress: string,
    chainId: number,
    chainLink = false
  ) {
    const promises = [
      this.getEstimateUserOperationGas(publicClient, userOp, entryPoint),
    ];

    if (chainLink) {
      promises.push(this.getLatestAnswerAndDecimals(publicClient, nativeOracleAddress, chainId) as any);
    }

    return await Promise.allSettled(promises).then((data) => {
      if (data[0].status !== 'fulfilled') {
        throw new Error('Failed to estimate gas for user operation ' + data[0].reason);
      }

      if (chainLink) {
        if (data[1].status !== 'fulfilled') {
          throw new Error('Failed to get latest round data for oracle ' + data[1].reason);
        }
        return {
          response: data[0].value,
          unaccountedCost: UnaccountedCost,
          latestAnswer: (data[1].value as any).latestAnswer,
          decimals: (data[1].value as any).decimals
        }
      }

      return {
        response: data[0].value,
        unaccountedCost: UnaccountedCost
      };
    })
  }

  async getPriceFromOrochi(
    oracleAddress: string,
    publicClient: PublicClient,
    gasToken: string,
    chainId: number,
    useCache = true
  ) {
    const cacheKey = `${chainId}-${oracleAddress}-${gasToken}`;
    const cache = this.priceAndMetadata.get(cacheKey);
    if (useCache && cache && cache.expiry > Date.now()) {
      return cache.data;
    }

    const oracleContract = getContract({ address: oracleAddress as Address, abi: OrochiOracleAbi, client: publicClient });
    const promises = [
      this.getTokenDecimals(gasToken, chainId, publicClient),
      this.getTokenSymbol(gasToken, chainId, publicClient),
      oracleContract.read.getLatestData([1, toHex(stringToBytes('ETH')).padEnd(42, '0') as Hex])
    ];

    return await Promise.allSettled(promises).then((data) => {
      let ethPrice = "";
      if (data[0].status !== 'fulfilled') {
        throw new Error('Failed to get decimals for token ' + data[0].reason);
      }
      if (data[1].status !== 'fulfilled') {
        throw new Error('Failed to get symbol for token ' + data[1].reason);
      }
      if (data[2].status !== 'fulfilled') {
        throw new Error('Failed to get latest data for oracle ' + data[2].reason);
      }
      const decimals = Number(data[0].value);
      const symbol = data[1].value ? data[1].value as string : '';
      const ETHprice = data[2].value;
      // For orochi its one native for one usd so only stable tokens can be used
      if (decimals < 18)
        ethPrice = Number(formatUnits(ETHprice as any, 18 - decimals)).toFixed(0);

      const priceAndMetadata: TokenPriceAndMetadata = {
        decimals,
        symbol,
        ethPrice,
        gasToken
      }
      this.priceAndMetadata.set(cacheKey, { data: priceAndMetadata, expiry: Date.now() + ttl });
      return priceAndMetadata;
    });
  }

  async getPriceFromChainlink(
    oracleAddress: string,
    publicClient: PublicClient,
    gasToken: string,
    ethUsdPrice: any,
    ethUsdPriceDecimal: any,
    chainId: number,
    useCache = true
  ) {
    const cacheKey = `${chainId}-${oracleAddress}-${gasToken}`;
    const cache = this.priceAndMetadata.get(cacheKey);
    if (useCache && cache && cache.expiry > Date.now()) {
      return cache.data;
    }

    const chainlinkContract = getContract({ address: oracleAddress as Address, abi: ChainlinkOracleAbi, client: publicClient });

    const promises = [
      this.getTokenDecimals(gasToken, chainId, publicClient),
      this.getTokenSymbol(gasToken, chainId, publicClient),
      this.getChainlinkOracleDecimals(oracleAddress, chainId, chainlinkContract),
      chainlinkContract.read.latestAnswer()
    ];

    return Promise.allSettled(promises).then((data) => {
      if (data[0].status !== 'fulfilled') {
        throw new Error('Failed to get decimals for token ' + data[0].reason);
      }
      if (data[1].status !== 'fulfilled') {
        throw new Error('Failed to get symbol for token ' + data[1].reason);
      }
      if (data[2].status !== 'fulfilled') {
        throw new Error('Failed to get decimals for chainlink ' + data[2].reason);
      }
      if (data[3].status !== 'fulfilled') {
        throw new Error('Failed to get latest price ' + data[3].reason);
      }

      const decimals = Number(data[0].value);
      const symbol = data[1].value;
      const ethPriceDecimal = data[2].value;
      let ethPrice = data[3].value;
      ethUsdPrice = formatUnits(ethUsdPrice, ethUsdPriceDecimal);
      ethPrice = formatUnits(ethPrice, ethPriceDecimal);
      ethUsdPrice = parseEther(ethUsdPrice);
      ethPrice = parseEther(ethPrice);
      ethPrice = parseUnits((ethUsdPrice / ethPrice).toFixed(decimals), decimals).toString();

      const priceAndMetadata: TokenPriceAndMetadata = {
        decimals,
        symbol,
        ethPrice,
        gasToken
      }
      this.priceAndMetadata.set(cacheKey, { data: priceAndMetadata, expiry: Date.now() + ttl });
      return priceAndMetadata;
    });
  }

  async getPriceFromEtherspotChainlink(
    oracleAddress: string,
    publicClient: PublicClient,
    gasToken: string,
    chainId: number,
    useCache = true
  ) {
    const cacheKey = `${chainId}-${oracleAddress}-${gasToken}`;
    const cache = this.priceAndMetadata.get(cacheKey);
    if (useCache && cache && cache.expiry > Date.now()) {
      return cache.data;
    }
    const ecContract = getContract({ address: oracleAddress as Address, abi: EtherspotChainlinkOracleAbi, client: publicClient });

    const promises = [
      this.getTokenDecimals(gasToken, chainId, publicClient),
      this.getTokenSymbol(gasToken, chainId, publicClient),
      ecContract.read.cachedPrice()
    ];

    return await Promise.allSettled(promises).then((data) => {
      if (data[0].status !== 'fulfilled') {
        throw new Error('Failed to get decimals for token ' + data[0].reason);
      }
      if (data[1].status !== 'fulfilled') {
        throw new Error('Failed to get symbol for token ' + data[1].reason);
      }
      if (data[2].status !== 'fulfilled') {
        throw new Error('Failed to get cached price from Etherspot Chainlink ' + data[2].reason);
      }

      const priceAndMetadata: TokenPriceAndMetadata = {
        decimals: Number(data[0].value),
        symbol: data[1].value as any,
        ethPrice: data[2].value,
        gasToken
      }
      this.priceAndMetadata.set(cacheKey, { data: priceAndMetadata, expiry: Date.now() + ttl });
      return priceAndMetadata;
    });
  }

  async getQuotesMultiToken(
    userOp: any,
    entryPoint: string,
    chainId: number,
    multiTokenPaymasters: any,
    tokens_list: string[],
    oracles: any,
    bundlerRpc: string,
    oracleName: string,
    nativeOracleAddress: string,
    signer: PrivateKeyAccount,
    log?: FastifyBaseLogger
  ) {
    try {
      const publicClient = createPublicClient({ transport: http(bundlerRpc) });
      const quotes: any[] = [], unsupportedTokens: any[] = [];
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
        "quotes": [] as any,
        "unsupportedTokens": [] as any
      }
      let ETHUSDPrice: any, ETHUSDPriceDecimal;
      const paymasterKey = Object.keys(multiTokenPaymasters[chainId])[0];
      let response, unaccountedCost;
      const validUntil = new Date();
      const validAfter = new Date();
      const hex = (Number((validUntil.valueOf() / 1000).toFixed(0)) + 600).toString(16);
      const hex1 = (Number((validAfter.valueOf() / 1000).toFixed(0)) - 60).toString(16);
      let str = '0x'
      let str1 = '0x'
      for (let i = 0; i < 14 - hex.length; i++) {
        str += '0';
      }
      for (let i = 0; i < 14 - hex1.length; i++) {
        str1 += '0';
      }
      str += hex;
      str1 += hex1;
      const paymasterContract = getContract({ address: multiTokenPaymasters[chainId][paymasterKey] as Address, abi: MultiTokenPaymasterAbi, client: publicClient });
      // Assuming the token price is 1 USD since this is just used for the gas estimation and the paymasterAndData generated will not be sent on response
      userOp.paymasterAndData = await this.getPaymasterAndDataForMultiTokenPaymaster(userOp, str, str1, paymasterKey, '100000000', paymasterContract, signer, chainId);
      if (oracleName === "chainlink") {
        const res = await this.getEstimateUserOperationGasAndData(
          publicClient,
          userOp,
          entryPoint,
          nativeOracleAddress,
          chainId,
          true
        );
        response = res.response;
        unaccountedCost = res.unaccountedCost;
        ETHUSDPrice = res.latestAnswer;
        ETHUSDPriceDecimal = res.decimals;
        result.etherUSDExchangeRate = toHex(BigInt((res as any).latestAnswer));
      } else {
        const result = await this.getEstimateUserOperationGasAndData(publicClient, userOp, entryPoint, nativeOracleAddress, chainId);
        response = result.response;
        unaccountedCost = result.unaccountedCost;
      }
      result.gasEstimates.preVerificationGas = (response as any).preVerificationGas;
      result.gasEstimates.callGasLimit = (response as any).callGasLimit;
      result.gasEstimates.verificationGasLimit = (response as any).verificationGasLimit;
      result.feeEstimates.maxFeePerGas = (response as any).maxFeePerGas;
      result.feeEstimates.maxPriorityFeePerGas = (response as any).maxPriorityFeePerGas;
      result.paymasterAddress = multiTokenPaymasters[chainId][paymasterKey];
      result.postOpGas = unaccountedCost;

      const promises = [];
      for (let i = 0; i < tokens_list.length; i++) {
        const gasToken = getAddress(tokens_list[i]);
        const isCoingeckoAvailable = this.coingeckoPrice.get(`${chainId}-${gasToken}`);
        if (
          !(multiTokenPaymasters[chainId] && multiTokenPaymasters[chainId][gasToken]) &&
          !(oracles[chainId] && oracles[chainId][gasToken]) &&
          !isCoingeckoAvailable
        ) unsupportedTokens.push({ token: gasToken });
        else {
          let oracleAddress = null;
          if (oracles[chainId]) oracleAddress = oracles[chainId][gasToken];
          if (isCoingeckoAvailable || !oracleAddress) {
            promises.push(this.getPriceFromCoingecko(chainId, gasToken, ETHUSDPrice, ETHUSDPriceDecimal, log))
          } else if (oracleName === "orochi") {
            promises.push(this.getPriceFromOrochi(oracleAddress, publicClient, gasToken, chainId));
          } else if (oracleName === "chainlink") {
            promises.push(this.getPriceFromChainlink(oracleAddress, publicClient, gasToken, ETHUSDPrice, ETHUSDPriceDecimal, chainId));
          } else {
            promises.push(this.getPriceFromEtherspotChainlink(oracleAddress, publicClient, gasToken, chainId));
          }
        }
      }

      await Promise.allSettled(promises).then((data: any) => {
        for (let i = 0; i < data.length; i++) {
          if (data[i].status !== 'fulfilled') {
            throw new Error('Failed to fetch price and metadata' + data[i].reason);
          }

          const { decimals, symbol, ethPrice, gasToken } = data[i].value;

          if (result.etherUSDExchangeRate === "0x")
            result.etherUSDExchangeRate = toHex(BigInt(ethPrice));

          quotes.push({
            token: gasToken,
            symbol: symbol,
            decimals: decimals,
            etherTokenExchangeRate: toHex(BigInt(ethPrice)),
            serviceFeePercent: (this.multiTokenMarkUp / 10000 - 100)
          })
        }
      })
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
    feeToken: string, oracleAggregator: string, bundlerRpc: string, signer: PrivateKeyAccount, oracleName: string, nativeOracleAddress: string,
    chainId: number, log?: FastifyBaseLogger) {
    try {
      const publicClient = createPublicClient({ transport: http(bundlerRpc) });
      const paymasterContract = getContract({ address: paymasterAddress as Address, abi: MultiTokenPaymasterAbi, client: publicClient });
      let ethPrice = "";

      const isCoingeckoAvailable = this.coingeckoPrice.get(`${chainId}-${feeToken}`);

      if (!oracleAggregator) {
        if (!isCoingeckoAvailable) throw new Error('Unable to fetch token price. Please try again later.')
        const { latestAnswer, decimals } = await this.getLatestAnswerAndDecimals(publicClient, nativeOracleAddress, chainId);
        const data = await this.getPriceFromCoingecko(chainId, feeToken, latestAnswer, decimals, log);

        ethPrice = data.ethPrice;
      } else if (oracleName === "orochi") {
        const data = await this.getPriceFromOrochi(oracleAggregator, publicClient, feeToken, chainId);
        ethPrice = data.ethPrice;
      } else if (oracleName === "chainlink") {
        const { latestAnswer, decimals } = await this.getLatestAnswerAndDecimals(publicClient, nativeOracleAddress, chainId);

        const data = await this.getPriceFromChainlink(
          oracleAggregator,
          publicClient,
          feeToken,
          latestAnswer,
          decimals,
          chainId
        );

        ethPrice = data.ethPrice;
      } else {
        const ecContract = getContract({ address: oracleAggregator as Address, abi: EtherspotChainlinkOracleAbi, client: publicClient });
        const ETHprice = await ecContract.read.cachedPrice();
        ethPrice = ETHprice as string;
      }

      if (!userOp.signature) userOp.signature = '0x';
      let paymasterAndData = await this.getPaymasterAndDataForMultiTokenPaymaster(userOp, validUntil, validAfter, feeToken, ethPrice, paymasterContract, signer, chainId);
      userOp.paymasterAndData = paymasterAndData
      const response = await this.getEstimateUserOperationGas(publicClient, userOp, entryPoint);
      if (BigInt(userOp.verificationGasLimit) < 45000n) userOp.verificationGasLimit = toHex(45000n); // This is to counter the unaccounted cost(45000)
      userOp.verificationGasLimit = toHex(BigInt((response as any).verificationGasLimit) + BigInt(this.MTP_VGL_MARKUP)); // This is added just in case the token is proxy
      userOp.preVerificationGas = (response as any).preVerificationGas;
      userOp.callGasLimit = (response as any).callGasLimit;
      paymasterAndData = await this.getPaymasterAndDataForMultiTokenPaymaster(userOp, validUntil, validAfter, feeToken, ethPrice, paymasterContract, signer, chainId);
      userOp.paymasterAndData = paymasterAndData

      const returnValue = {
        paymasterAndData,
        verificationGasLimit: userOp.verificationGasLimit,
        preVerificationGas: userOp.preVerificationGas,
        callGasLimit: userOp.callGasLimit,
      }
      return returnValue;
    } catch (err: any) {
      if (err.message.includes("Quota exceeded"))
        throw new Error('Failed to process request to bundler since request Quota exceeded for the current apiKey')
      if (log) log.error(err, 'signCombinedPaymaster');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  }

  async signMultiTokenPaymasterV07(userOp: any, validUntil: string, validAfter: string, entryPoint: string, paymasterAddress: string,
    feeToken: string, oracleAggregator: string, bundlerRpc: string, signer: PrivateKeyAccount, oracleName: string, nativeOracleAddress: string,
    chainId: number, log?: FastifyBaseLogger) {
    try {
      const publicClient = createPublicClient({ transport: http(bundlerRpc) });
      const paymasterContract = getContract({ address: paymasterAddress as Address, abi: MultiTokenPaymasterAbiV2, client: publicClient });
      let ethPrice;
      const isCoingeckoAvailable = this.coingeckoPrice.get(`${chainId}-${feeToken}`);

      if (!oracleAggregator) {
        if (!isCoingeckoAvailable) throw new Error('Unable to fetch token price. Please try again later.')
        const { latestAnswer, decimals } = await this.getLatestAnswerAndDecimals(publicClient, nativeOracleAddress, chainId);
        const data = await this.getPriceFromCoingecko(chainId, feeToken, latestAnswer, decimals, log);

        ethPrice = data.ethPrice;
      } else if (oracleName === "orochi") {
        const data = await this.getPriceFromOrochi(oracleAggregator, publicClient, feeToken, chainId);
        ethPrice = data.ethPrice;
      } else if (oracleName === "chainlink") {
        const { latestAnswer, decimals } = await this.getLatestAnswerAndDecimals(publicClient, nativeOracleAddress, chainId);

        const data = await this.getPriceFromChainlink(
          oracleAggregator,
          publicClient,
          feeToken,
          latestAnswer,
          decimals,
          chainId
        );

        ethPrice = data.ethPrice;
      } else {
        const ecContract = getContract({ address: oracleAggregator as Address, abi: EtherspotChainlinkOracleAbi, client: publicClient });
        const ETHprice = await ecContract.read.cachedPrice();
        ethPrice = ETHprice
      }
      if (userOp.factory && userOp.factoryData) userOp.initCode = concat([userOp.factory as Hex, userOp.factoryData ?? '0x'])
      if (!userOp.signature) userOp.signature = '0x';
      userOp.paymaster = paymasterAddress;
      userOp.paymasterVerificationGasLimit = toHex(BigInt(this.MTP_PVGL)); // Paymaster specific gas limit
      userOp.paymasterPostOpGasLimit = toHex(BigInt(this.MTP_PPGL)); // Paymaster specific gas limit for token transfer
      let accountGasLimits = this.packUint(userOp.verificationGasLimit, userOp.callGasLimit)
      const gasFees = this.packUint(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas);
      let packedUserOp = {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode ?? "0x",
        callData: userOp.callData,
        accountGasLimits: accountGasLimits,
        preVerificationGas: userOp.preVerificationGas,
        gasFees: gasFees,
        paymasterAndData: this.packPaymasterData(paymasterAddress, userOp.paymasterVerificationGasLimit, userOp.paymasterPostOpGasLimit, "0x"),
        signature: userOp.signature
      }
      userOp.paymaster = paymasterAddress;
      let paymasterData = await this.getPaymasterAndDataForMultiTokenPaymasterV07(packedUserOp, validUntil, validAfter, feeToken, ethPrice, paymasterContract, signer);
      userOp.paymasterData = paymasterData
      userOp.paymasterAndData = this.packPaymasterData(paymasterAddress, userOp.paymasterVerificationGasLimit, userOp.paymasterPostOpGasLimit, paymasterData);
      const response = await this.getEstimateUserOperationGas(publicClient, userOp, entryPoint);
      if (BigInt(userOp.verificationGasLimit) < 45000n) userOp.verificationGasLimit = toHex(45000n); // This is to counter the unaccounted cost(45000)
      userOp.verificationGasLimit = (response as any).verificationGasLimit;
      userOp.preVerificationGas = (response as any).preVerificationGas;
      userOp.callGasLimit = (response as any).callGasLimit;
      accountGasLimits = this.packUint(userOp.verificationGasLimit, userOp.callGasLimit);
      packedUserOp = {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: userOp.initCode ?? "0x",
        callData: userOp.callData,
        accountGasLimits: accountGasLimits,
        preVerificationGas: userOp.preVerificationGas,
        gasFees: gasFees,
        paymasterAndData: this.packPaymasterData(paymasterAddress, userOp.paymasterVerificationGasLimit, userOp.paymasterPostOpGasLimit, paymasterData),
        signature: userOp.signature
      }
      paymasterData = await this.getPaymasterAndDataForMultiTokenPaymasterV07(packedUserOp, validUntil, validAfter, feeToken, ethPrice, paymasterContract, signer);
      userOp.paymasterData = paymasterData

      const returnValue = {
        paymaster: paymasterAddress,
        paymasterData: paymasterData,
        preVerificationGas: toHex(BigInt(packedUserOp.preVerificationGas)),
        verificationGasLimit: toHex(BigInt(userOp.verificationGasLimit)),
        callGasLimit: toHex(BigInt(userOp.callGasLimit)),
        paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit,
        paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit,
      }
      return returnValue;
    } catch (err: any) {
      if (err.message.includes("Quota exceeded"))
        throw new Error('Failed to process request to bundler since request Quota exceeded for the current apiKey')
      if (log) log.error(err, 'signMultiTokenPaymasterV07');
      throw new Error('Failed to process request to bundler. Please contact support team RawErrorMsg:' + err.message)
    }
  }

  async ERC20PaymasterV07(userOp: any, bundlerRpc: string, entryPoint: string, paymasterAddress: string, estimate: boolean, log?: FastifyBaseLogger) {
    try {
      const publicClient = createPublicClient({ transport: http(bundlerRpc) });
      if (!userOp.signature) userOp.signature = '0x';
      if (userOp.factory && userOp.factoryData) userOp.initCode = concat([userOp.factory as Hex, userOp.factoryData ?? '0x'])
      if (!userOp.initCode) userOp.initCode = "0x";
      const erc20Paymaster = getContract({ address: paymasterAddress as Address, abi: ERC20PaymasterV07Abi, client: publicClient })
      const tokenAddress = await erc20Paymaster.read.token();
      const tokenPrice = await erc20Paymaster.read.getPrice();
      const priceMarkup = await erc20Paymaster.read.priceMarkup();
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
      const maxCost = BigInt(userOp.preVerificationGas ?? 0) + BigInt(userOp.callGasLimit ?? 0) + BigInt(userOp.verificationGasLimit ?? 0);
      if (!userOp.maxFeePerGas) userOp.maxFeePerGas = "0x1";
      let tokenAmountRequired = (maxCost + 30000n) * BigInt(userOp.maxFeePerGas)
      tokenAmountRequired = (tokenAmountRequired * BigInt(priceMarkup as string) / 1000000n) * BigInt(tokenPrice as string) / parseEther('1')
      const tokenContract = getContract({ address: tokenAddress as Address, abi: minABI, client: publicClient })
      const tokenBalance = await tokenContract.read.balanceOf([userOp.sender]) as bigint;

      if (tokenAmountRequired >= tokenBalance)
        throw new Error(`The required token amount ${tokenAmountRequired.toString()} is more than what the sender has ${tokenBalance}`)
      if (estimate) {
        userOp.paymaster = paymasterAddress;
        userOp.paymasterVerificationGasLimit = toHex(BigInt(this.EP7_TOKEN_VGL));
        userOp.paymasterPostOpGasLimit = toHex(BigInt(this.EP7_TOKEN_PGL));
        const response = await this.getEstimateUserOperationGas(publicClient, userOp, entryPoint);
        userOp.verificationGasLimit = (response as any).verificationGasLimit;
        userOp.callGasLimit = (response as any).callGasLimit;
        userOp.preVerificationGas = (response as any).preVerificationGas;
      }
      let returnValue;
      if (estimate) {
        returnValue = {
          paymaster: paymasterAddress,
          paymasterData: "0x", // since the default mode is 0
          preVerificationGas: toHex(BigInt(userOp.preVerificationGas)),
          verificationGasLimit: toHex(BigInt(userOp.verificationGasLimit)),
          callGasLimit: toHex(BigInt(userOp.callGasLimit)),
          paymasterVerificationGasLimit: toHex(BigInt(this.EP7_TOKEN_VGL)),
          paymasterPostOpGasLimit: toHex(BigInt(this.EP7_TOKEN_PGL))
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

  async whitelistAddresses(address: string[], paymasterAddress: string, bundlerRpc: string, relayerKey: string, chainId: number, log?: FastifyBaseLogger) {
    try {
      const viemChain = getViemChainDef(chainId);
      const publicClient = createPublicClient({ chain: viemChain, transport: http(bundlerRpc) });
      const walletClient = createWalletClient({ chain: viemChain, transport: http(bundlerRpc), account: privateKeyToAccount(relayerKey as Hex) });
      const paymasterContract = getContract({ address: paymasterAddress as Address, abi: EtherspotAbiV06, client: publicClient });
      const signer = privateKeyToAccount(relayerKey as Hex);
      for (let i = 0; i < address.length; i++) {
        const isAdded = await paymasterContract.read.check([signer.address, address[i] as Address]);
        if (isAdded) {
          throw new Error(`${address[i]} already whitelisted`)
        }
      }
      const encodedData = encodeFunctionData({
        abi: EtherspotAbiV06,
        functionName: 'addBatchToWhitelist',
        args: [address as Address[]]
      });

      const etherscanFeeData = await getGasFee(chainId, bundlerRpc, log);
      const feeData = { gasPrice: BigInt(0), maxFeePerGas: BigInt(0), maxPriorityFeePerGas: BigInt(0) };
      if (etherscanFeeData) {
        const response = etherscanFeeData;
        feeData.gasPrice = response.gasPrice ? response.gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = response.maxFeePerGas ? response.maxFeePerGas + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = response.maxPriorityFeePerGas ? response.maxPriorityFeePerGas + this.feeMarkUp : BigInt(0);
      } else {
        const gasPrice = await publicClient.getGasPrice();
        feeData.gasPrice = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
      }

      let tx;
      if (!feeData.maxFeePerGas || this.skipType2Txns.includes(chainId.toString()) || feeData.maxFeePerGas === BigInt(0)) {
        tx = await walletClient.sendTransaction({
          to: paymasterAddress as Address,
          data: encodedData,
          gasPrice: feeData.gasPrice ?? undefined,
          type: "legacy",
          chain: viemChain
        });
      } else {
        tx = await walletClient.sendTransaction({
          to: paymasterAddress as Address,
          data: encodedData,
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: "eip1559",
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait();

      return {
        message: `Successfully whitelisted with transaction Hash ${tx}`
      };
    } catch (err: any) {
      if (err.message.includes('already whitelisted')) throw new Error(err.message);
      if (log) log.error(err, 'whitelistAddresses')
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN + ` RawErrorMsg: ${err.message}`);
    }
  }

  async removeWhitelistAddress(address: string[], paymasterAddress: string, bundlerRpc: string, relayerKey: string, chainId: number, log?: FastifyBaseLogger) {
    try {
      const viemChain = getViemChainDef(chainId);
      const publicClient = createPublicClient({ chain: viemChain, transport: http(bundlerRpc) });
      const walletClient = createWalletClient({ chain: viemChain, transport: http(bundlerRpc), account: privateKeyToAccount(relayerKey as Hex) });
      const paymasterContract = getContract({ address: paymasterAddress as Address, abi: EtherspotAbiV06, client: publicClient });
      const signer = privateKeyToAccount(relayerKey as Hex);
      for (let i = 0; i < address.length; i++) {
        const isAdded = await paymasterContract.read.check([signer.address, address[i] as Address]);
        if (!isAdded) {
          throw new Error(`${address[i]} is not whitelisted`)
        }
      }

      const encodedData = encodeFunctionData({
        abi: EtherspotAbiV06,
        functionName: 'removeBatchFromWhitelist',
        args: [address as Address[]]
      });
      const etherscanFeeData = await getGasFee(chainId, bundlerRpc, log);
      const feeData = { gasPrice: BigInt(0), maxFeePerGas: BigInt(0), maxPriorityFeePerGas: BigInt(0) };
      if (etherscanFeeData) {
        const response = etherscanFeeData;
        feeData.gasPrice = response.gasPrice ? response.gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = response.maxFeePerGas ? response.maxFeePerGas + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = response.maxPriorityFeePerGas ? response.maxPriorityFeePerGas + this.feeMarkUp : BigInt(0);
      } else {
        const gasPrice = await publicClient.getGasPrice();
        feeData.gasPrice = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
      }

      let tx;
      if (!feeData.maxFeePerGas || this.skipType2Txns.includes(chainId.toString()) || feeData.maxFeePerGas === BigInt(0)) {
        tx = await walletClient.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          gasPrice: feeData.gasPrice ?? undefined,
          type: "legacy"
        } as TransactionRequest);
      } else {
        tx = await walletClient.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: "eip1559",
        } as TransactionRequest);
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait();

      return {
        message: `Successfully removed whitelisted addresses with transaction Hash ${tx}`
      };
    } catch (err: any) {
      if (err.message.includes('is not whitelisted')) throw new Error(err.message);
      if (log) log.error(err, 'removeWhitelistAddress');
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN);
    }
  }

  async checkWhitelistAddress(accountAddress: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string, log?: FastifyBaseLogger) {
    try {
      const publicClient = createPublicClient({ transport: http(bundlerRpc) });
      const signer = privateKeyToAccount(relayerKey as Hex);
      const paymasterContract = getContract({ address: paymasterAddress as Address, abi: EtherspotAbiV06, client: publicClient });
      return paymasterContract.read.check([signer.address, accountAddress as Address]);
    } catch (err) {
      if (log) log.error(err, 'checkWhitelistAddress');
      throw new Error(ErrorMessage.RPC_ERROR);
    }
  }

  async deposit(amount: string, paymasterAddress: string, bundlerRpc: string, relayerKey: string, chainId: number, isEpv06: boolean, log?: FastifyBaseLogger) {
    try {
      const viemChain = getViemChainDef(chainId);
      const publicClient = createPublicClient({ chain: viemChain, transport: http(bundlerRpc) });
      const walletClient = createWalletClient({ chain: viemChain, transport: http(bundlerRpc), account: privateKeyToAccount(relayerKey as Hex) });
      const signer = privateKeyToAccount(relayerKey as Hex);
      const balance = await publicClient.getBalance({ address: signer.address });
      const amountInWei = parseEther(amount.toString());
      if (amountInWei >= balance)
        throw new Error(`${signer.address} Balance is less than the amount to be deposited`)

      const encodedData = encodeFunctionData({
        abi: isEpv06 ? EtherspotAbiV06 : EtherspotAbiV07,
        functionName: isEpv06 ? 'depositFunds' : 'deposit',
        args: []
      });

      const etherscanFeeData = await getGasFee(chainId, bundlerRpc, log);
      const feeData = { gasPrice: BigInt(0), maxFeePerGas: BigInt(0), maxPriorityFeePerGas: BigInt(0) };
      if (etherscanFeeData) {
        const response = etherscanFeeData;
        feeData.gasPrice = response.gasPrice ? response.gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = response.maxFeePerGas ? response.maxFeePerGas + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = response.maxPriorityFeePerGas ? response.maxPriorityFeePerGas + this.feeMarkUp : BigInt(0);
      } else {
        const gasPrice = await publicClient.getGasPrice();
        feeData.gasPrice = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
      }

      let tx;
      if (!feeData.maxFeePerGas || this.skipType2Txns.includes(chainId.toString()) || feeData.maxFeePerGas === BigInt(0)) {
        tx = await walletClient.sendTransaction({
          to: paymasterAddress,
          data: encodedData,
          value: amountInWei,
          gasPrice: feeData.gasPrice ?? undefined,
          type: "legacy",
        } as TransactionRequest);
      } else {
        tx = await walletClient.sendTransaction({
          to: paymasterAddress as Address,
          data: encodedData,
          value: amountInWei,
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: "eip1559",
        });
      }
      // commented the below line to avoid timeouts for long delays in transaction confirmation.
      // await tx.wait(); 

      return {
        message: `Successfully deposited with transaction Hash ${tx}`
      };
    } catch (err: any) {
      if (log) log.error(err, 'deposit');
      if (err.message.includes('Balance is less than the amount to be deposited')) throw new Error(err.message);
      throw new Error(ErrorMessage.ERROR_ON_SUBMITTING_TXN);
    }
  }

  async deployVp(
    privateKey: string,
    bundlerRpcUrl: string,
    epAddr: string,
    epVersion: EPVersions,
    chainId: number,
    log?: FastifyBaseLogger
  ) {
    try {
      const chain = getViemChainDef(chainId, bundlerRpcUrl);
      const account = privateKeyToAccount(privateKey as Hex);
      const publicClient = createPublicClient({ chain: chain, transport: http(bundlerRpcUrl) });
      const walletClient = createWalletClient({ chain: chain, transport: http(bundlerRpcUrl), account: privateKeyToAccount(privateKey as Hex) });
      let bytecode;
      let verifyingPaymasterAbiCode;
      if (epVersion === EPVersions.EPV_06) {
        bytecode = verifyingPaymasterByteCode;
        verifyingPaymasterAbiCode = verifyingPaymasterAbi;
      } else if (epVersion === EPVersions.EPV_07) {
        bytecode = verifyingPaymasterV2ByteCode;
        verifyingPaymasterAbiCode = verifyingPaymasterV2Abi;
      } else {
        bytecode = verifyingPaymasterV3ByteCode;
        verifyingPaymasterAbiCode = verifyingPaymasterV3Abi;
      }

      const etherscanFeeData = await getGasFee(chainId, bundlerRpcUrl, log);
      const feeData = { gasPrice: BigInt(0), maxFeePerGas: BigInt(0), maxPriorityFeePerGas: BigInt(0) };
      if (etherscanFeeData) {
        const response = etherscanFeeData;
        feeData.gasPrice = response.gasPrice ? response.gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = response.maxFeePerGas ? response.maxFeePerGas + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = response.maxPriorityFeePerGas ? response.maxPriorityFeePerGas + this.feeMarkUp : BigInt(0);
      } else {
        const gasPrice = await publicClient.getGasPrice();
        feeData.gasPrice = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
      }

      let tx;
      if (!feeData.maxFeePerGas || this.skipType2Txns.includes(chainId.toString()) || feeData.maxFeePerGas === BigInt(0)) {
        tx = await walletClient.deployContract({
          abi: verifyingPaymasterAbiCode,
          bytecode: bytecode as `0x${string}`,
          args: [epAddr, account.address],
          gasPrice: feeData.gasPrice ?? undefined,
          type: "legacy",
        });
      } else {
        tx = await walletClient.deployContract({
          abi: verifyingPaymasterAbiCode,
          bytecode: bytecode as `0x${string}`,
          args: [epAddr, privateKeyToAccount(privateKey as Hex).address],
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: "eip1559",
          
        });
      }
      console.log('hash: ', tx);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== 'success') {
        log?.error(`Transaction failed: ${tx}`);
        throw new Error(ErrorMessage.FAILED_TO_DEPLOY_VP);
      }
      return { address: receipt.contractAddress, hash: receipt.transactionHash };
    } catch (error) {
      log?.error(`error while deploying verifying paymaster ${error}`);
      throw new Error(ErrorMessage.FAILED_TO_DEPLOY_VP);
    }
  }

  async addStake(
    privateKey: string,
    bundlerRpcUrl: string,
    amount: string,
    paymasterAddress: string,
    chainId: number,
    log?: FastifyBaseLogger
  ) {
    try {
      const viemChain = getViemChainDef(chainId)
      const publicClient = createPublicClient({ chain: viemChain, transport: http(bundlerRpcUrl) });
      const walletClient = createWalletClient({ chain: viemChain, transport: http(bundlerRpcUrl), account: privateKeyToAccount(privateKey as Hex) });

      const etherscanFeeData = await getGasFee(chainId, bundlerRpcUrl, log);
      const feeData = { gasPrice: BigInt(0), maxFeePerGas: BigInt(0), maxPriorityFeePerGas: BigInt(0) };
      if (etherscanFeeData) {
        const response = etherscanFeeData;
        feeData.gasPrice = response.gasPrice ? response.gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = response.maxFeePerGas ? response.maxFeePerGas + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = response.maxPriorityFeePerGas ? response.maxPriorityFeePerGas + this.feeMarkUp : BigInt(0);
      } else {
        const gasPrice = await publicClient.getGasPrice();
        feeData.gasPrice = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
        feeData.maxPriorityFeePerGas = gasPrice ? gasPrice + this.feeMarkUp : BigInt(0);
      }

      let tx;
      if (!feeData.maxFeePerGas || this.skipType2Txns.includes(chainId.toString())) {
        tx = await walletClient.writeContract({
          address: paymasterAddress as Address,
          abi: verifyingPaymasterAbi,
          functionName: 'addStake',
          args: ["10"],
          value: parseEther(amount),
          type: "legacy",
          gasPrice: feeData.gasPrice ?? undefined,
        });
      } else {
        tx = await walletClient.writeContract({
          address: paymasterAddress as Address,
          abi: verifyingPaymasterAbi,
          functionName: 'addStake',
          args: ["10"],
          value: parseEther(amount),
          maxFeePerGas: feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
          type: "eip1559"
        });
      }
      return {
        message: `Successfully staked with transaction Hash ${tx}`
      };
    } catch (error) {
      log?.error(`error while adding stake to verifying paymaster ${error}`);
      throw new Error(ErrorMessage.FAILED_TO_ADD_STAKE);
    }
  }

  async getPriceFromCoingecko(chainId: number, tokenAddress: string, ETHUSDPrice: any, ETHUSDPriceDecimal: any, log?: FastifyBaseLogger): Promise<any> {
    const cacheKey = `${chainId}-${tokenAddress}`;
    const cache = this.coingeckoPrice.get(cacheKey);

    const nativePrice = formatUnits(ETHUSDPrice, ETHUSDPriceDecimal);
    let ethPrice;

    if (cache && cache.expiry > Date.now()) {
      const data = cache.data;
      ethPrice = parseUnits((Number(nativePrice) / data.price).toFixed(data.decimals), data.decimals)
      return {
        ethPrice,
        ...data
      }
    }
    try {
      const coingeckoRepo = new CoingeckoTokensRepository(this.sequelize);
      const records = await coingeckoRepo.findAll();
      const tokenIds = records.map((record: { coinId: any; }) => record.coinId);

      const data = await this.coingeckoService.fetchPriceByCoinID(tokenIds, log);
      const tokenPrices: any = [];
      if (Object.keys(data).length > 0) {
        records.map(record => {
          const address = getAddress(record.address);
          if (data[record.coinId])
            tokenPrices[address] = { price: Number(data[record.coinId].usd).toFixed(5), decimals: record.decimals, chainId: record.chainId, gasToken: address, symbol: record.token }
        })
      }
      let tokenData = tokenPrices[tokenAddress];
      if (!tokenData) {
        log?.error('Reverting to previously cached price ', 'CoingeckoError')
        tokenData = this.coingeckoPrice.get(cacheKey)?.data;
      }
      if (!tokenData) {
        log?.error('Price fetch error on tokenAddress: ' + tokenAddress, 'CoingeckoError')
        throw new Error(ErrorMessage.COINGECKO_PRICE_NOT_FETCHED);
      }
      ethPrice = parseUnits((Number(nativePrice) / tokenData.price).toFixed(tokenData.decimals), tokenData.decimals)
      this.setPricesFromCoingecko(tokenPrices);
      return {
        ethPrice,
        ...tokenData
      }
    } catch (err) {
      log?.error(err + ' Reverting to previously cached price' + tokenAddress, 'CoingeckoError')
      const tokenData = this.coingeckoPrice.get(cacheKey)?.data;
      if (!tokenData) {
        log?.error('Price fetch error on tokenAddress: ' + tokenAddress, 'CoingeckoError')
        throw new Error(`${tokenAddress} ${ErrorMessage.COINGECKO_PRICE_NOT_FETCHED}`);
      }
    }
  }

  async setPricesFromCoingecko(coingeckoPrices: any[]) {
    for (const tokenAddress in coingeckoPrices) {
      const chainId = coingeckoPrices[tokenAddress].chainId;
      const cacheKey = `${chainId}-${getAddress(tokenAddress)}`;
      this.coingeckoPrice.set(cacheKey, { data: coingeckoPrices[tokenAddress], expiry: Date.now() + ttl });
    }
  }
}
