import { Hex } from "viem";

export interface UserOperationStruct {
    sender: Hex;
    nonce: bigint;
    initCode: Hex;
    callData: Hex;
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    paymasterAndData: Hex;
    signature: Hex;
}