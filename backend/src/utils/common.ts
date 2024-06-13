import { FastifyBaseLogger, FastifyRequest } from "fastify";
import { BigNumber, ethers } from "ethers";
import { Database } from "sqlite3";
import SupportedNetworks from "../../config.json";
import { EtherscanResponse, getEtherscanFeeResponse } from "./interface.js";

export function printRequest(
  methodName: string,
  request: FastifyRequest,
  log: FastifyBaseLogger
) {
  log.info(methodName, "called: ");
  log.info(request.query, "query passed: ");
  log.info(request.body, "body passed: ");
}

export function getNetworkConfig(
  key: any,
  supportedNetworks: any,
  entryPoint: string
) {
  if (supportedNetworks !== "") {
    const buffer = Buffer.from(supportedNetworks, "base64");
    const SUPPORTED_NETWORKS = JSON.parse(buffer.toString());
    return SUPPORTED_NETWORKS.find((chain: any) => {
      return chain["chainId"] == key && chain["entryPoint"] == entryPoint;
    });
  } else
    return SupportedNetworks.find(
      (chain) => chain.chainId == key && chain.entryPoint == entryPoint
    );
}

export async function getSQLdata(
  apiKey: string,
  db: Database,
  log: FastifyBaseLogger
) {
  try {
    const result: any[] = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM api_keys WHERE API_KEY = ?",
        [apiKey],
        (err: any, rows: any[]) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    return result;
  } catch (err) {
    log.error(err);
    return null;
  }
}

export async function getEtherscanFee(
  chainId: number,
  log?: FastifyBaseLogger
): Promise<getEtherscanFeeResponse | null> {
  try {
    const etherscanUrlsBase64 = process.env.ETHERSCAN_GAS_ORACLES;
    if (etherscanUrlsBase64) {
      const buffer = Buffer.from(etherscanUrlsBase64, "base64");
      const etherscanUrls = JSON.parse(buffer.toString());
      console.log("etherscanUrl: ", etherscanUrls[chainId]);

      if (etherscanUrls[chainId]) {
        const data = await fetch(etherscanUrls[chainId]);
        const response: EtherscanResponse = await data.json();
        console.log("Etherscan Response: ", response);
        if (
          response.result &&
          typeof response.result === "object" &&
          response.status === "1"
        ) {
          console.log(
            "setting maxFeePerGas and maxPriorityFeePerGas as received"
          );
          const maxFeePerGas = ethers.utils.parseUnits(
            response.result.suggestBaseFee,
            "gwei"
          );
          const fastGasPrice = ethers.utils.parseUnits(
            response.result.FastGasPrice,
            "gwei"
          );
          return {
            maxPriorityFeePerGas: fastGasPrice.sub(maxFeePerGas),
            maxFeePerGas,
            gasPrice: maxFeePerGas,
          };
        }
        if (
          response.result &&
          typeof response.result === "string" &&
          response.jsonrpc
        ) {
          const gasPrice = BigNumber.from(response.result);
          console.log("setting gas price as received");
          return {
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice,
            gasPrice: gasPrice,
          };
        }
        return null;
      }
      return null;
    }
    return null;
  } catch (err) {
    if (log) {
      log.error(err);
      log.info("fetching from provider");
    }
    return null;
  }
}
