import { FastifyBaseLogger, FastifyRequest } from "fastify";
import { BigNumber, ethers } from "ethers";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { EtherscanResponse, getEtherscanFeeResponse } from "./interface.js";

export function printRequest(methodName: string, request: FastifyRequest, log: FastifyBaseLogger) {
  log.info(methodName, "called: ");
  log.info(request.query, "query passed: ");
  log.info(request.body, "body passed: ");
}

export function getNetworkConfig(key: any, supportedNetworks: any, entryPoint: string[]) {
  if (supportedNetworks !== '') {
    const buffer = Buffer.from(supportedNetworks, 'base64');
    const SUPPORTED_NETWORKS = JSON.parse(buffer.toString())
    const result = SUPPORTED_NETWORKS.find((chain: any) => { return chain["chainId"] == key && entryPoint.includes(chain["entryPoint"]) });
    if (!result) {
      return SupportedNetworks.find((chain) => chain.chainId == key && entryPoint.includes(chain.entryPoint));
    }
    return result
  } else
    return SupportedNetworks.find((chain) => chain.chainId == key && entryPoint.includes(chain.entryPoint));
}

export function getChainIdsFromDefaultSupportedNetworks() {
  return SupportedNetworks.map((chain) => chain.chainId);
}

export function decodeSupportedNetworks(supportedNetworksForDecode: string) {
  const buffer = Buffer.from(supportedNetworksForDecode, "base64");
  return JSON.parse(buffer.toString());
}

export function getChainIdsFromSupportedNetworks(supportedNetworksForDecode: string) {
  const decodedSupportedNetworks = decodeSupportedNetworks(supportedNetworksForDecode);
  if(!decodedSupportedNetworks)
    return [];
  return decodedSupportedNetworks.map((chain: any) => chain.chainId);
}

export async function getEtherscanFee(chainId: number, log?: FastifyBaseLogger): Promise<getEtherscanFeeResponse | null> {
  try {
    const etherscanUrlsBase64 = process.env.ETHERSCAN_GAS_ORACLES;
    if (etherscanUrlsBase64) {
      const buffer = Buffer.from(etherscanUrlsBase64, 'base64');
      const etherscanUrls = JSON.parse(buffer.toString());
      if (etherscanUrls[chainId]) {
        const data = await fetch(etherscanUrls[chainId]);
        const response: EtherscanResponse = await data.json();
        if (response.result && typeof response.result === "object" && response.status === "1") {
          if(log) log.info('setting maxFeePerGas and maxPriorityFeePerGas as received')
          const maxFeePerGas = ethers.utils.parseUnits(response.result.suggestBaseFee, 'gwei')
          const fastGasPrice = ethers.utils.parseUnits(response.result.FastGasPrice, 'gwei')
          return { 
            maxPriorityFeePerGas: fastGasPrice.sub(maxFeePerGas),
            maxFeePerGas,
            gasPrice: maxFeePerGas,
          }
        }
        if (response.result && typeof response.result === "string" && response.jsonrpc) {
          const gasPrice = BigNumber.from(response.result)
          if(log) log.info('setting gas price as received')
          return {
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
            gasPrice: gasPrice
          }
        }
        return null;
      }
      return null;
    }
    return null;
  } catch (err) {
    if (log) {
      log.error(err);
      log.info('fetching from provider');
    }
    return null;
  }
}

