import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { FastifyPluginAsync } from "fastify";
import { Wallet, providers } from "ethers";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { getNetworkConfig, printRequest, getSQLdata } from "../utils/common.js";
import ReturnCode from "../constants/ReturnCode.js";
import ErrorMessage from "../constants/ErrorMessage.js";
import { decode } from "../utils/crypto.js";
import { PAYMASTER_ADDRESS } from "../constants/Pimlico.js";


const metadataRoutes: FastifyPluginAsync = async (server) => {

  const prefixSecretId = 'arka_';

  let client: SecretsManagerClient;

  const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;

  if (!unsafeMode) {
    client = new SecretsManagerClient();
  }

  server.get('/metadata', async function (request, reply) {
    try {
      printRequest('/metadata', request, server.log);
      const query: any = request.query;
      const chainId = query['chainId'] ?? 1;
      const api_key = query['apiKey'];

      if (!api_key)
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
      if (!chainId)
        return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.INVALID_DATA})
      let customPaymasters = [];
      let privateKey = '';
      let supportedNetworks;
      if (!unsafeMode) {
        const AWSresponse = await client.send(
          new GetSecretValueCommand({
            SecretId: prefixSecretId + api_key,
          })
        );
        const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
        if (!secrets['PRIVATE_KEY']) {
          server.log.info("Invalid Api Key provided")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        }
        if (secrets['ERC20_PAYMASTERS']) {
          const buffer = Buffer.from(secrets['ERC20_PAYMASTERS'], 'base64');
          customPaymasters = JSON.parse(buffer.toString());
        }
        privateKey = secrets['PRIVATE_KEY'];
        supportedNetworks = secrets['SUPPORTED_NETWORKS'];
      } else {
        const record: any = await getSQLdata(api_key, server.sqlite.db, server.log);
        if (!record) {
          server.log.info("Invalid Api Key provided")
          return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
        }
        if (record['ERC20_PAYMASTERS']) {
          const buffer = Buffer.from(record['ERC20_PAYMASTERS'], 'base64');
          customPaymasters = JSON.parse(buffer.toString());
        }
        privateKey = decode(record['PRIVATE_KEY']);
        supportedNetworks = record['SUPPORTED_NETWORKS'];
      }
      if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      }
      const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '');
      if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
      const provider = new providers.JsonRpcProvider(networkConfig.bundler);
      const signer = new Wallet(privateKey, provider)
      const balance = await signer.getBalance();
      const address = await signer.getAddress();
      const chainsSupported: number[] = [];
      if (supportedNetworks) {
        const buffer = Buffer.from(supportedNetworks, 'base64');
        const SUPPORTED_NETWORKS = JSON.parse(buffer.toString())
        SUPPORTED_NETWORKS.map((element: { chainId: number; }) => {
          chainsSupported.push(element.chainId);
        })
      } else {
        SupportedNetworks.map(element => {
          chainsSupported.push(element.chainId);
        })
      }
      const tokenPaymasterAddresses = {
        ...PAYMASTER_ADDRESS,
        ...customPaymasters,
      }
      return reply.code(ReturnCode.SUCCESS).send({
        sponsorAddress: address,
        sponsorWalletBalance: balance,
        chainsSupported: chainsSupported,
        tokenPaymasters: tokenPaymasterAddresses,
      })
    } catch (err: any) {
      request.log.error(err);
      if (err.name == "ResourceNotFoundException")
        return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
      return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
    }
  })
}

export default metadataRoutes;
