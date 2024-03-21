import { Contract, BigNumber, providers, utils, Signer, ethers } from "ethers";
import { UserOperationStruct } from "@account-abstraction/contracts"
import { NotPromise } from "@account-abstraction/utils"
import abi from "../abi/PimlicoAbi.js";
import { NATIVE_ASSET, ORACLE_ADDRESS, TOKEN_ADDRESS, bytecode } from "../constants/Pimlico.js";

export interface ERC20PaymasterBuildOptions {
    entrypoint?: string
    nativeAsset?: string
    nativeAssetOracle?: string
    tokenAddress?: string
    tokenOracle?: string
    owner?: string
    deployer?: Signer
}

export class PimlicoPaymaster {
    private contract: Contract;
    tokenAddress: Promise<string>;
    paymasterAddress: string;

    constructor(address: string, provider: providers.Provider) {
        this.paymasterAddress = address;
        this.contract = new Contract(address, abi, provider)
        this.tokenAddress = this.contract.token();
    }

    /**
     * NOTE: This calculations only supports erc20 tokens with 6 or 18 decimals.
     * @dev Calculates the token amount required for the UserOperation, setting a reasonable max price for the token
     *
     * @param userOp the user operation to calculate the token amount for (with gas limits already set)
     * @returns the recommend token price to set during paymaster execution
     */
    async calculateTokenAmount(userOp: NotPromise<UserOperationStruct>): Promise<BigNumber> {
        const priceMarkup = await this.contract.priceMarkup()
        const cachedPrice = await this.contract.previousPrice()
        const tokenDecimals = await this.contract.tokenDecimals();
        if (cachedPrice.eq(0)) {
            throw new Error("ERC20Paymaster: no previous price set")
        }

        const requiredPreFund = BigNumber.from(userOp.preVerificationGas)
            .add(BigNumber.from(userOp.verificationGasLimit).mul(3)) // 3 is for buffer when using paymaster
            .add(BigNumber.from(userOp.callGasLimit))
            .mul(BigNumber.from(userOp.maxFeePerGas).mul(2))
        let tokenAmount = requiredPreFund
            .add(BigNumber.from(userOp.maxFeePerGas).mul(40000)) // 40000 is the REFUND_POSTOP_COST constant
            .mul(priceMarkup)
            .mul(cachedPrice)
            .div(1e6) // 1e6 is the priceDenominator constant

        /**
         * Don't know why but the below calculation is for tokens with 6 decimals such as USDC, USDT
         * Pimlico default paymasters uses only USDC
         * After long testing the below code is neglected for tokens with 18 decimals
         */
        if (ethers.utils.parseUnits('1', 6).eq(tokenDecimals)) {
            tokenAmount = tokenAmount.div(BigNumber.from(10).pow(18));
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
        const paymasterAndData = utils.hexlify(
            utils.concat([this.contract.address, utils.hexZeroPad(utils.hexlify(tokenAmount), 32)])
        )
        return paymasterAndData
    }

    /**
     * @dev Generates the paymaster and data for the UserOperation, given token amount
     *
     * @param userOp the UserOperation to generate the paymasterAndData for (with gas limits already set)
     * @param requiredPreFund the required token amount if already calculated
     * @returns the paymasterAndData to be filled in
     */
    async generatePaymasterAndDataForTokenAmount(userOp: NotPromise<UserOperationStruct>, tokenAmount: BigNumber): Promise<string> {
        const paymasterAndData = utils.hexlify(
            utils.concat([this.contract.address, utils.hexZeroPad(utils.hexlify(tokenAmount), 32)])
        )
        return paymasterAndData
    }
}

async function validatePaymasterOptions(
    provider: providers.Provider,
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

    const chainId = (await provider.getNetwork()).chainId
    const nativeAsset = options?.nativeAsset ?? NATIVE_ASSET[chainId]
    if (!nativeAsset) {
        throw new Error(`Native asset not found - chainId ${chainId} not supported`)
    }

    const nativeAssetOracle = options?.nativeAssetOracle ?? ORACLE_ADDRESS[chainId][nativeAsset]
    if (!nativeAssetOracle) {
        throw new Error(`Native asset oracle not found - chainId ${chainId} not supported`)
    }
    await provider.getCode(nativeAssetOracle).then((code) => {
        if (code === "0x") {
            throw new Error(`Oracle for ${nativeAsset} on chainId ${chainId} is not deployed`)
        }
    })

    const tokenAddress = options?.tokenAddress ?? TOKEN_ADDRESS[chainId][erc20]
    if (!tokenAddress) {
        throw new Error(`Token ${erc20} not supported on chainId ${chainId}`)
    }
    await provider.getCode(tokenAddress).then((code) => {
        if (code === "0x") {
            throw new Error(`Token ${erc20} on ${chainId} is not deployed`)
        }
    })

    const tokenOracle = options?.tokenOracle ?? ORACLE_ADDRESS[chainId][erc20]
    if (!tokenOracle) {
        throw new Error(`Oracle for ${erc20} not found, not supported on chainId ${chainId}`)
    }
    await provider.getCode(tokenOracle).then((code) => {
        if (code === "0x") {
            throw new Error(`Oracle for ${erc20} on ${chainId} is not deployed`)
        }
    })

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
    const paymasterConstructor = new utils.Interface(abi).encodeDeploy(constructorArgs)
    return utils.hexlify(utils.concat([bytecode, paymasterConstructor]))
}

export async function calculateERC20PaymasterAddress(
    options: Required<Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">>
): Promise<string> {
    const address = utils.getCreate2Address(
        "0x4e59b44847b379578588920cA78FbF26c0B4956C",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        utils.keccak256(getPaymasterConstructor(options))
    )

    return address
}

/**
 *
 * @param provider provider to use
 * @param erc20 ERC20 token to use
 * @param options (optional) options to use to calculate the deterministic address
 * @returns the ERC20Paymaster object
 */
export async function getERC20Paymaster(
    provider: providers.Provider,
    erc20: string,
    entryPoint: string,
    options?: Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">
): Promise<PimlicoPaymaster> {
    let parsedOptions: Required<Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">>
    const chainId = (await provider.getNetwork()).chainId
    if (options === undefined) {
        parsedOptions = {
            entrypoint: entryPoint,
            nativeAssetOracle: ORACLE_ADDRESS[chainId][NATIVE_ASSET[chainId]],
            tokenAddress: TOKEN_ADDRESS[chainId][erc20],
            tokenOracle: ORACLE_ADDRESS[chainId][erc20],
            owner: "0x4337000c2828F5260d8921fD25829F606b9E8680" // pimlico address
        }
    } else {
        parsedOptions = await validatePaymasterOptions(provider, erc20, options)
    }
    const address = await calculateERC20PaymasterAddress(parsedOptions)
    if ((await provider.getCode(address)).length <= 2) {
        throw new Error(`ERC20Paymaster not deployed at ${address}`)
    }
    return new PimlicoPaymaster(address, provider)
}
