import { FastifyBaseLogger, FastifyRequest } from "fastify";
import { ethers } from "ethers";
import { Database } from "sqlite3";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { EtherscanResponse, getEtherscanFeeResponse } from "./interface.js";

export function printRequest(methodName: string, request: FastifyRequest, log: FastifyBaseLogger) {
  log.info(methodName, "called: ");
  log.info(request.query, "query passed: ");
  log.info(request.body, "body passed: ");
}

export function getNetworkConfig(key: any, supportedNetworks: any) {
  if (supportedNetworks !== '') {
    const buffer = Buffer.from(supportedNetworks, 'base64');
    const SUPPORTED_NETWORKS = JSON.parse(buffer.toString())
    return SUPPORTED_NETWORKS.find((chain: any) => { return chain["chainId"] == key });
  } else
    return SupportedNetworks.find((chain) => chain.chainId == key);
}

export async function getSQLdata(apiKey: string, db: Database, log: FastifyBaseLogger) {
  try {
    const result: any[] = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM api_keys WHERE API_KEY = ?", [apiKey], (err: any, rows: any[]) => {
        if (err) reject(err);
        resolve(rows);
      })
    })
    return result;
  } catch (err) {
    log.error(err);
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

        if (response.result && response.result.FastGasPrice) {
          const maxFeePerGas = ethers.utils.parseUnits(response.result.suggestBaseFee, 'gwei')
          const fastGasPrice = ethers.utils.parseUnits(response.result.FastGasPrice, 'gwei')
          return {
            maxPriorityFeePerGas: fastGasPrice.sub(maxFeePerGas),
            maxFeePerGas,
            gasPrice: maxFeePerGas,
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

