import { providers, Wallet, BigNumber, ethers, Contract } from 'ethers';
// import {
//   EtherspotPaymaster,
//   EtherspotPaymaster__factory
// } from "../../typechain";
import { arrayify, defaultAbiCoder, hexConcat } from 'ethers/lib/utils.js';
import { getERC20Paymaster, SupportedERC20 } from '@pimlico/erc20-paymaster';
// import { logger } from 'server';
import { abi } from "../../abi/EtherspotAbi.js";

interface stackupPaymasterResponse {
  jsonrpc: string;
  id: number;
  result: {
    paymasterAndData: string,  
    preVerificationGas: string,  
    verificationGasLimit: string,  
    callGasLimit: string,  
  } | null;
  error: {message: string, code: string} | null;
}

export class Paymaster {
  private provider: providers.JsonRpcProvider;
  private paymasterContract: Contract;
  private signer: Wallet;
  private pimlicoEndpoint: string | null;
  private stackupEndpoint: string | null;
  private verificationGasLimit: BigNumber;
  constructor(
    bundlerUrl: string,
    contract: string,
    relayerKey: string,
    pimlicoApiKey: string,
    stackupApiKey: string,
    pimlicoChainId: string,
    verificationGasLimit: string,
  ) {
    this.provider = new providers.JsonRpcProvider(bundlerUrl);
    this.paymasterContract = new ethers.Contract(contract, abi, this.provider);
    this.signer = new Wallet(relayerKey);
    this.pimlicoEndpoint = pimlicoApiKey && pimlicoChainId ? `https://api.pimlico.io/v1/${pimlicoChainId}/rpc?apikey=${pimlicoApiKey}` : null;
    this.stackupEndpoint = stackupApiKey ? `https://api.stackup.sh/v1/paymaster/${stackupApiKey}` : null;
    this.verificationGasLimit = BigNumber.from(verificationGasLimit);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sign(userOp: any, validUntil: string, validAfter: string) {
    // prefill
    userOp.paymasterAndData = hexConcat([
      this.paymasterContract.address,
      defaultAbiCoder.encode(
        ['uint48', 'uint48'],
        [validUntil, validAfter]
      ),
      '0x' + '00'.repeat(65),
    ]);
    userOp.verificationGasLimit = this.verificationGasLimit;
    // actual signing...
    const hash = await this.paymasterContract.getHash(
      userOp,
      validUntil,
      validAfter
    );

    const sig = await this.signer.signMessage(arrayify(hash));

    const paymasterAndData = hexConcat([
      this.paymasterContract.address,
      defaultAbiCoder.encode(
        ['uint48', 'uint48'],
        [validUntil, validAfter]
      ),
      sig,
    ]);

    return {
      paymasterAndData,
      verificationGasLimit: userOp.verificationGasLimit,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async pimlico(userOp: any, gasToken: SupportedERC20) {
    if (this.pimlicoEndpoint) {
      const erc20Paymaster = await getERC20Paymaster(this.provider, gasToken)

      // logger.info('Pimlico Paymaster Address: ', erc20Paymaster.contract.address)

      await erc20Paymaster.verifyTokenApproval(userOp) // verify if enough USDC is approved to the paymaster

      userOp.verificationGasLimit = this.verificationGasLimit;
      const paymasterAndData = await erc20Paymaster.generatePaymasterAndData(userOp)
      return {
        paymasterAndData,
        verificationGasLimit: userOp.verificationGasLimit,
      };
    } else {
      throw new Error('Invalid Api Key')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async stackup(userOp: any, type: string, gasToken: string, entryPoint: string) {
    if (this.stackupEndpoint) {

      userOp.verificationGasLimit = this.verificationGasLimit;
      const provider = new ethers.providers.JsonRpcProvider(this.stackupEndpoint);
      const pm: stackupPaymasterResponse = (await provider.send("pm_sponsorUserOperation", [
        userOp,
        entryPoint,
        {type, token: gasToken},
      ]));
      // logger.info(pm);
      if (pm.error) throw new Error(pm.error.message);
      return {
        paymasterAndData: pm.result?.paymasterAndData,
        verificationGasLimit: pm.result?.verificationGasLimit,
      }

    } else {
      throw new Error('Invalid Api Key')
    }
  }
}