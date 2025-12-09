/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyBaseLogger, FastifyRequest } from "fastify";
import { createPublicClient, defineChain, http, parseUnits } from "viem";
import SupportedNetworks from "../../config.json";
import { EtherscanResponse, getEtherscanFeeResponse } from "./interface.js";
import * as chains from 'viem/chains'

export function printRequest(methodName: string, request: FastifyRequest, log: FastifyBaseLogger): void {
  log.info(methodName, "called: ");
  log.info(request.query, "query passed: ");
  log.info(request.body, "body passed: ");
}

export function getViemChainDef(chainId: number, rpcUrl?: string): chains.Chain {
  const chainsDefs = Object.values(chains);
  for (const chain of chainsDefs) {
    if (chain.id == chainId) return chain;
  }
  const customChain = defineChain({
    id: Number(chainId),
    name: "",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl ? rpcUrl : ''],
      },
    },
  });
  return customChain;
}

export function getNetworkConfig(key: any, supportedNetworks: any, entryPoint?: string[]): any {
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

export function getChainIdsFromDefaultSupportedNetworks(): number[] {
  return SupportedNetworks.map((chain) => chain.chainId);
}

export function decodeSupportedNetworks(supportedNetworksForDecode: string): any {
  const buffer = Buffer.from(supportedNetworksForDecode, "base64");
  return JSON.parse(buffer.toString());
}

export function getChainIdsFromSupportedNetworks(supportedNetworksForDecode: string): number[] {
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
    const publicClient = createPublicClient({
      transport: http(rpcUrl), 
    });
    const feeData = await publicClient.request({
      method: 'skandha_getGasPrice',
      params: [],
    } as any);

    if (
      typeof feeData === 'object' &&
      feeData !== null &&
      'maxFeePerGas' in feeData &&
      'maxPriorityFeePerGas' in feeData &&
      feeData.maxFeePerGas &&
      feeData.maxPriorityFeePerGas
    ) {
      return {
        maxFeePerGas: BigInt((feeData as any).maxFeePerGas),
        maxPriorityFeePerGas: BigInt((feeData as any).maxPriorityFeePerGas),
        gasPrice: BigInt((feeData as any).maxFeePerGas)
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
          const maxFeePerGas = parseUnits(response.result.suggestBaseFee, 9)
          const fastGasPrice = parseUnits(response.result.FastGasPrice, 9)
          return { 
            maxPriorityFeePerGas: fastGasPrice - maxFeePerGas,
            maxFeePerGas,
            gasPrice: maxFeePerGas,
          }
        }
        if (response.result && typeof response.result === "string" && response.jsonrpc) {
          const gasPrice = BigInt(response.result)
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
