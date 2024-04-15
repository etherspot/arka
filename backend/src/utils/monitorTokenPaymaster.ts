import { FastifyBaseLogger } from "fastify";
import { ethers, providers } from "ethers";
import fetch from 'node-fetch';
import EtherspotAbi from "../abi/EtherspotAbi.js";

export async function checkDeposit(paymasterAddress: string, bundlerUrl: string, webhookUrl: string, thresholdValue: string, chainId: number, log: FastifyBaseLogger) {
  try {
    const provider = new providers.JsonRpcProvider(bundlerUrl);
    const contract = new ethers.Contract(paymasterAddress, EtherspotAbi, provider);
    const currentDeposit = await contract.getDeposit();
    if (ethers.utils.parseEther(thresholdValue).gte(currentDeposit)) {
      const body = { message: `Balance below threshold. Please deposit on tokenPaymasterAddress: ${paymasterAddress} chainId: ${chainId}`, currentDeposit: ethers.utils.formatEther(currentDeposit) }
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