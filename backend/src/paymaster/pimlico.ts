import { UserOperationStruct } from "../types/entrypoint"
import abi from "../abi/PimlicoAbi.js";
import { NATIVE_ASSET, ORACLE_ADDRESS, TOKEN_ADDRESS, bytecode } from "../constants/Pimlico.js";
import { encodeDeployData, getContract, getContractAddress, Hex, keccak256, pad, parseUnits, PublicClient, toHex, WalletClient, concat } from "viem";

export interface ERC20PaymasterBuildOptions {
    entrypoint?: Hex
    nativeAsset?: string
    nativeAssetOracle?: Hex
    tokenAddress?: Hex
    tokenOracle?: Hex
    owner?: Hex
    deployer?: WalletClient
}

export class PimlicoPaymaster {
    private contract;
    tokenAddress: Promise<Hex>;
    paymasterAddress: Hex;

    constructor(address: Hex, client: PublicClient) {
        this.paymasterAddress = address;
        this.contract = getContract({
            abi: abi,
            address: address,
            client
        });
        this.tokenAddress = this.contract.read.token() as Promise<Hex>;
    }

    /**
     * NOTE: This calculations only supports erc20 tokens with 6 or 18 decimals.
     * @dev Calculates the token amount required for the UserOperation, setting a reasonable max price for the token
     *
     * @param userOp the user operation to calculate the token amount for (with gas limits already set)
     * @returns the recommend token price to set during paymaster execution
     */
    async calculateTokenAmount(userOp: UserOperationStruct): Promise<bigint> {
        const priceMarkup = await this.contract.read.priceMarkup();
        const cachedPrice = await this.contract.read.previousPrice();
        const tokenDecimals = await this.contract.read.tokenDecimals();
        if (cachedPrice == BigInt(0)) {
            throw new Error("ERC20Paymaster: no previous price set");
        }

        const requiredPreFund = (
            userOp.preVerificationGas +
            (userOp.verificationGasLimit * BigInt(3)) + // 3 is for buffer when using paymaster
            userOp.callGasLimit
        ) * (userOp.maxFeePerGas * BigInt(2));

        let tokenAmount = (
            (
                (
                    requiredPreFund +
                    (userOp.maxFeePerGas * BigInt(40000)) // 40000 is the REFUND_POSTOP_COST constant
                ) * BigInt(priceMarkup)
            ) * BigInt(cachedPrice)
        ) / BigInt(1e6); // 1e6 is the priceDenominator constant

        /**
         * Don't know why but the below calculation is for tokens with 6 decimals such as USDC, USDT
         * Pimlico default paymasters uses only USDC
         * After long testing the below code is neglected for tokens with 18 decimals
         */
        if (parseUnits('1', 6) === tokenDecimals) {
            tokenAmount = tokenAmount / BigInt(10 ** 18)
        }
        return tokenAmount;
    }

    /**
     * @dev Generates the paymaster and data for the UserOperation, setting a reasonable max price for the token
     *
     * @param userOp the UserOperation to generate the paymasterAndData for (with gas limits already set)
     * @returns the paymasterAndData to be filled in
     */
    async generatePaymasterAndData(userOp: UserOperationStruct): Promise<Hex> {
        const tokenAmount = await this.calculateTokenAmount(userOp)
        const paymasterAndData = toHex(
            concat([this.contract.address, pad(toHex(tokenAmount), {size: 32})])
        );
        return paymasterAndData;
    }

    /**
     * @dev Generates the paymaster and data for the UserOperation, given token amount
     *
     * @param userOp the UserOperation to generate the paymasterAndData for (with gas limits already set)
     * @param requiredPreFund the required token amount if already calculated
     * @returns the paymasterAndData to be filled in
     */
    async generatePaymasterAndDataForTokenAmount(userOp: UserOperationStruct, tokenAmount: bigint): Promise<Hex> {
        const paymasterAndData = toHex(
            concat([this.contract.address, pad(toHex(tokenAmount), {size: 32})])
        );
        return paymasterAndData;
    }
}

async function validatePaymasterOptions(
    client: PublicClient,
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
    const chainId = await client.getChainId();
    const nativeAsset = options?.nativeAsset ?? NATIVE_ASSET[chainId]
    if (!nativeAsset) {
        throw new Error(`Native asset not found - chainId ${chainId} not supported`)
    }

    const nativeAssetOracle = options?.nativeAssetOracle ?? ORACLE_ADDRESS[chainId][nativeAsset]
    if (!nativeAssetOracle) {
        throw new Error(`Native asset oracle not found - chainId ${chainId} not supported`)
    }
    await client.getBytecode({address: nativeAssetOracle}).then((code) => {
        if(code === "0x") {
            throw new Error(`Oracle for ${nativeAsset} on chainId ${chainId} is not deployed`)
        }
    })

    const tokenAddress = options?.tokenAddress ?? TOKEN_ADDRESS[chainId][erc20]
    if (!tokenAddress) {
        throw new Error(`Token ${erc20} not supported on chainId ${chainId}`)
    }
    await client.getBytecode({address: tokenAddress}).then((code) => {
        if(code === "0x") {
            throw new Error(`Token ${erc20} on ${chainId} is not deployed`)
        }
    })

    const tokenOracle = options?.tokenOracle ?? ORACLE_ADDRESS[chainId][erc20]
    if (!tokenOracle) {
        throw new Error(`Oracle for ${erc20} not found, not supported on chainId ${chainId}`)
    }
    await client.getBytecode({address: tokenOracle}).then((code) => {
        if(code === "0x") {
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
): Hex {
    const constructorArgs = [
        options.tokenAddress,
        options.entrypoint,
        options.tokenOracle,
        options.nativeAssetOracle,
        options.owner
    ] as const;
    const paymasterConstructor = encodeDeployData({
        abi,
        bytecode,
        args: constructorArgs
    })
    return paymasterConstructor;
}

export async function calculateERC20PaymasterAddress(
    options: Required<Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">>
): Promise<Hex> {
    const address = getContractAddress({
        from: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
        salt: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex,
        bytecodeHash: keccak256(getPaymasterConstructor(options)), 
        opcode: "CREATE2"
    })

    return address;
}

/**
 *
 * @param provider provider to use
 * @param erc20 ERC20 token to use
 * @param options (optional) options to use to calculate the deterministic address
 * @returns the ERC20Paymaster object
 */
export async function getERC20Paymaster(
    client: PublicClient,
    erc20: string,
    entryPoint: Hex,
    options?: Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">
): Promise<PimlicoPaymaster> {
    let parsedOptions: Required<Omit<Omit<ERC20PaymasterBuildOptions, "nativeAsset">, "deployer">>
    const chainId = await client.getChainId();
    if (options === undefined) {
        parsedOptions = {
            entrypoint: entryPoint,
            nativeAssetOracle: ORACLE_ADDRESS[chainId][NATIVE_ASSET[chainId]],
            tokenAddress: TOKEN_ADDRESS[chainId][erc20],
            tokenOracle: ORACLE_ADDRESS[chainId][erc20],
            owner: "0x4337000c2828F5260d8921fD25829F606b9E8680" // pimlico address
        }
    } else {
        parsedOptions = await validatePaymasterOptions(client, erc20, options)
    }
    const address = await calculateERC20PaymasterAddress(parsedOptions);
    await client.getBytecode({address}).then((code) => {
        if(!code || code.length <= 2) {
            throw new Error(`ERC20Paymaster not deployed at ${address}`);
        }
    });
    return new PimlicoPaymaster(address, client);
}
