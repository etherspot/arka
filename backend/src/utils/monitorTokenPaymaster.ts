import { FastifyBaseLogger } from "fastify";
import fetch from 'node-fetch';
import EtherspotAbi from "../abi/EtherspotAbi.js";
import { createPublicClient, formatEther, getContract, Hex, http, parseEther } from "viem";

export async function checkDeposit(paymasterAddress: Hex, bundlerUrl: string, webhookUrl: string, thresholdValue: string, chainId: number, log: FastifyBaseLogger) {
  try {
    const client = createPublicClient({
      transport: http(bundlerUrl)
    })
    const contract = getContract({
      abi: EtherspotAbi,
      address: paymasterAddress,
      client
    })
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