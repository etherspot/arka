import { 
  createPublicClient, 
  http, 
  parseUnits, 
  toHex, 
  concat, 
  keccak256, 
  getContract, 
  getCreate2Address,
  encodeDeployData,
  Address, 
  Hex, 
  PublicClient,
  PrivateKeyAccount
} from 'viem';
import { UserOperationStruct } from "@account-abstraction/contracts"
import { NotPromise } from "@account-abstraction/utils"
import abi from "../abi/ERC20PaymasterAbi.js";
import { NATIVE_ASSET, ORACLE_ADDRESS, TOKEN_ADDRESS, bytecode } from "../constants/Token.js";

export interface ERC20PaymasterBuildOptions {
    entrypoint?: string
    nativeAsset?: string
    nativeAssetOracle?: string
    tokenAddress?: string
    tokenOracle?: string
    owner?: string
    deployer?: PrivateKeyAccount
}

export class TokenPaymaster {
    private contract: any;
    tokenAddress: Promise<string>;
    paymasterAddress: string;

    constructor(address: string, publicClient: PublicClient) {
        this.paymasterAddress = address;
        this.contract = getContract({ address: address as Address, abi, publicClient });
        this.tokenAddress = this.contract.read.token();
    }

    /**
     * NOTE: This calculations only supports erc20 tokens with 6 or 18 decimals.
     * @dev Calculates the token amount required for the UserOperation, setting a reasonable max price for the token
     *
     * @param userOp the user operation to calculate the token amount for (with gas limits already set)
     * @returns the recommend token price to set during paymaster execution
     */
    async calculateTokenAmount(userOp: NotPromise<UserOperationStruct>): Promise<bigint> {
        const priceMarkup = await this.contract.read.priceMarkup()
        const cachedPrice = await this.contract.read.previousPrice()
        const tokenDecimals = await this.contract.read.tokenDecimals();
        if (cachedPrice === 0n) {
            throw new Error("ERC20Paymaster: no previous price set")
        }

        const requiredPreFund = BigInt(userOp.preVerificationGas)
            + (BigInt(userOp.verificationGasLimit) * 3n) // 3 is for buffer when using paymaster
            + BigInt(userOp.callGasLimit)
            * (BigInt(userOp.maxFeePerGas) * 2n)
        let tokenAmount = requiredPreFund
            + (BigInt(userOp.maxFeePerGas) * 40000n) // 40000 is the REFUND_POSTOP_COST constant
            * BigInt(priceMarkup)
            * BigInt(cachedPrice)
            / 1000000n // 1e6 is the priceDenominator constant

        /**
         * Don't know why but the below calculation is for tokens with 6 decimals such as USDC, USDT
         * After long testing the below code is neglected for tokens with 18 decimals
         */
        if (parseUnits('1', 6) === tokenDecimals) {
            tokenAmount = tokenAmount / (10n ** 18n);
        }
        return tokenAmount;
    }

    /**
     * @dev Generates the paymaster and data for the UserOperation, setting a reasonable max price for the token
     *
     * @param userOp the UserOperation to generate the paymasterAndData for (with gas limits already set)
     * @returns the paymasterAndData to be filled in
     */
    async generatePaymasterAndData(userOp: NotPromise<UserOperationStruct>): Promise<string> {
        const tokenAmount = await this.calculateTokenAmount(userOp)
        const paymasterAndData = concat([
            this.contract.address, 
            toHex(tokenAmount, { size: 32 })
        ])
        return paymasterAndData
    }

    /**
     * @dev Generates the paymaster and data for the UserOperation, given token amount
     *
     * @param userOp the UserOperation to generate the paymasterAndData for (with gas limits already set)
     * @param requiredPreFund the required token amount if already calculated
     * @returns the paymasterAndData to be filled in
     */
    async generatePaymasterAndDataForTokenAmount(userOp: NotPromise<UserOperationStruct>, tokenAmount: bigint): Promise<string> {
        const paymasterAndData = concat([
            this.contract.address, 
            toHex(tokenAmount, { size: 32 })
        ])
        return paymasterAndData
    }
}

async function validatePaymasterOptions(
    publicClient: PublicClient,
    erc20: string,
    options?: ERC20PaymasterBuildOptions
): Promise<Required<Omit<ERC20PaymasterBuildOptions, "deployer">>> {
    const parsedOptions = options ?? {}
    const entrypoint = parsedOptions.entrypoint ?? "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

    if (parsedOptions.owner === undefined) {
        throw new Error("Owner must be provided")
    }

    if (parsedOptions.deployer === undefined) {
        throw new Error("Deployer must be provided")
    }

    const chainId = await publicClient.getChainId()
    const nativeAsset = options?.nativeAsset ?? NATIVE_ASSET[chainId]
    if (!nativeAsset) {
        throw new Error(`Native asset not found - chainId ${chainId} not supported`)
    }

    const nativeAssetOracle = options?.nativeAssetOracle ?? ORACLE_ADDRESS[chainId][nativeAsset]
    if (!nativeAssetOracle) {
        throw new Error(`Native asset oracle not found - chainId ${chainId} not supported`)
    }
    const nativeOracleCode = await publicClient.getBytecode({ address: nativeAssetOracle as Address });
    if (!nativeOracleCode || nativeOracleCode === "0x") {
        throw new Error(`Oracle for ${nativeAsset} on chainId ${chainId} is not deployed`)
    }

    const tokenAddress = options?.tokenAddress ?? TOKEN_ADDRESS[chainId][erc20]
    if (!tokenAddress) {
        throw new Error(`Token ${erc20} not supported on chainId ${chainId}`)
    }
    const tokenCode = await publicClient.getBytecode({ address: tokenAddress as Address });
    if (!tokenCode || tokenCode === "0x") {
        throw new Error(`Token ${erc20} on ${chainId} is not deployed`)
    }

    const tokenOracle = options?.tokenOracle ?? ORACLE_ADDRESS[chainId][erc20]
    if (!tokenOracle) {
        throw new Error(`Oracle for ${erc20} not found, not supported on chainId ${chainId}`)
    }
    const tokenOracleCode = await publicClient.getBytecode({ address: tokenOracle as Address });
    if (!tokenOracleCode || tokenOracleCode === "0x") {
        throw new Error(`Oracle for ${erc20} on ${chainId} is not deployed`)
    }

    return {
        entrypoint,
        nativeAsset,
        nativeAssetOracle,
        tokenAddress,
        tokenOracle,
        owner: parsedOptions.owner
    }
}

export function getPaymasterConstructor(
    options: Required<Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">>
): string {
    const constructorArgs = [
        options.tokenAddress,
        options.entrypoint,
        options.tokenOracle,
        options.nativeAssetOracle,
        options.owner
    ]
    const paymasterConstructor = encodeDeployData({
        abi,
        bytecode: bytecode as Hex,
        args: constructorArgs
    })
    return paymasterConstructor
}

export async function calculateERC20PaymasterAddress(
    options: Required<Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">>
): Promise<string> {
    const address = getCreate2Address({
        from: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
        salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
        bytecodeHash: keccak256(getPaymasterConstructor(options) as Hex)
    })

    return address
}

/**
 *
 * @param publicClient publicClient to use
 * @param erc20 ERC20 token to use
 * @param options (optional) options to use to calculate the deterministic address
 * @returns the ERC20Paymaster object
 */
export async function getERC20Paymaster(
    publicClient: PublicClient,
    erc20: string,
    entryPoint: string,
    options?: Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">
): Promise<TokenPaymaster> {
    let parsedOptions: Required<Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">>
    const chainId = await publicClient.getChainId()
    if (options === undefined) {
        parsedOptions = {
            entrypoint: entryPoint,
            nativeAssetOracle: ORACLE_ADDRESS[chainId][NATIVE_ASSET[chainId]],
            tokenAddress: TOKEN_ADDRESS[chainId][erc20],
            tokenOracle: ORACLE_ADDRESS[chainId][erc20],
            owner: "0x4337000c2828F5260d8921fD25829F606b9E8680"
        }
    } else {
        parsedOptions = await validatePaymasterOptions(publicClient, erc20, options)
    }
    const address = await calculateERC20PaymasterAddress(parsedOptions)
    const code = await publicClient.getBytecode({ address: address as Address });
    if (!code || code.length <= 2) {
        throw new Error(`ERC20Paymaster not deployed at ${address}`)
    }
    return new TokenPaymaster(address, publicClient)
}
