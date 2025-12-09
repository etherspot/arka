import { FastifyBaseLogger } from "fastify";
import { createPublicClient, http, getContract, parseEther, formatEther } from "viem";
import fetch from 'node-fetch';
import EtherspotAbi from "../abi/EtherspotAbi.js";

export async function checkDeposit(paymasterAddress: string, bundlerUrl: string, webhookUrl: string, thresholdValue: string, chainId: number, log: FastifyBaseLogger) {
  try {
    if (bundlerUrl.includes('testnet')) {
      return;
    }
    const publicClient = createPublicClient({ transport: http(bundlerUrl) });
    const contract = getContract({ address: paymasterAddress as `0x${string}`, abi: EtherspotAbi, client: publicClient });
    const currentDeposit = await contract.read.getDeposit();
    if (parseEther(thresholdValue) >= currentDeposit) {
      const body = { message: `Balance below threshold. Please deposit on tokenPaymasterAddress: ${paymasterAddress} chainId: ${chainId}`, currentDeposit: formatEther(currentDeposit) }
      await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }
  } catch (err) {
    log.error(`Error on chainId ${chainId} address: ${paymasterAddress} webhookUrl: ${webhookUrl} bunderUrl: ${bundlerUrl}`)
    log.error(err);
  }
}