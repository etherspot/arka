import { FastifyBaseLogger, FastifyRequest } from "fastify";
import { BigNumber, ethers } from "ethers";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { EtherscanResponse, getEtherscanFeeResponse } from "./interface.js";

export function printRequest(methodName: string, request: FastifyRequest, log: FastifyBaseLogger) {
  log.info(methodName, "called: ");
  log.info(request.query, "query passed: ");
  log.info(request.body, "body passed: ");
}

export function getNetworkConfig(key: any, supportedNetworks: any, entryPoint?: string[]) {
  if (supportedNetworks !== '') {
    const buffer = Buffer.from(supportedNetworks, 'base64');
    const SUPPORTED_NETWORKS = JSON.parse(buffer.toString());
    if (entryPoint === undefined || entryPoint === null || entryPoint.length === 0) {
      const result = SUPPORTED_NETWORKS.find((chain: any) => chain["chainId"] == key);
      if (!result) {
        return SupportedNetworks.find((chain) => chain.chainId == key);
      }
      return result;
    }
    const result = SUPPORTED_NETWORKS.find((chain: any) => { return chain["chainId"] == key && entryPoint.includes(chain["entryPoint"]) });
    if (!result) {
      return SupportedNetworks.find((chain) => chain.chainId == key && entryPoint.includes(chain.entryPoint));
    }
    return result
  } else {
    if (entryPoint === undefined || entryPoint === null || entryPoint.length === 0) {
      const result = SupportedNetworks.find((chain) => chain.chainId == key);
      if (!result) {
        return null;
      }
      return result;
    }
    const result = SupportedNetworks.find((chain) => { return chain.chainId == key && entryPoint.includes(chain.entryPoint) });
    return result ? result : null;
  }
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

export async function getGasFee(chainId: number, rpcUrl: string, log?: FastifyBaseLogger): Promise<getEtherscanFeeResponse | null> {
  if(process.env.USE_SKANDHA_FOR_GAS_DATA !== 'false') {
    return getSkandhaGasFee(rpcUrl, log);
  }
  return getEtherscanFee(chainId, log);
}

export async function getSkandhaGasFee(rpcUrl: string, log?: FastifyBaseLogger): Promise<getEtherscanFeeResponse | null> {
  try {
    const body = JSON.stringify({
      method: "skandha_getGasPrice"
    });
    const options = {
      method: "POST",
      body,
    }
    const feeData = await fetch(rpcUrl, options);
    const data = (await feeData.json()).result;
    if(data?.maxFeePerGas && data?.maxPriorityFeePerGas) {
      return {
        maxFeePerGas: BigNumber.from(data.maxFeePerGas),
        maxPriorityFeePerGas: BigNumber.from(data.maxPriorityFeePerGas),
        gasPrice: BigNumber.from(data.maxFeePerGas)
      }
    }
    return null;
  } catch (error) {
    log?.error(`Error occurred while fetching gas fee from Skandha: ${error}`);
    return null;
  }
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
