import { FastifyBaseLogger, FastifyRequest } from "fastify";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { Database } from "sqlite3";

export function printRequest(request: FastifyRequest, log: FastifyBaseLogger) {
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

