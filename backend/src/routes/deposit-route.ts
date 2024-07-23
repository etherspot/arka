/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Paymaster } from "../paymaster/index.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { decode } from "../utils/crypto.js";
import { printRequest, getNetworkConfig, getViemChain } from "../utils/common.js";
import { APIKey } from "../models/api-key.js";
import { Hex } from "viem";

const SUPPORTED_ENTRYPOINTS = {
    'EPV_06': "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    'EPV_07': "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
}

const depositRoutes: FastifyPluginAsync = async (server) => {
    const paymaster = new Paymaster(server.config.FEE_MARKUP, server.config.MULTI_TOKEN_MARKUP);

    const prefixSecretId = 'arka_';

    let client: SecretsManagerClient;

    const unsafeMode: boolean = process.env.UNSAFE_MODE == "true" ? true : false;

    if (!unsafeMode) {
        client = new SecretsManagerClient();
    }

    const ResponseSchema = {
        schema: {
            response: {
                200: Type.Object({
                    message: Type.String(),
                }),
                400: Type.Object({
                    error: Type.String(),
                }),
            }
        }
    }

    server.post("/deposit",
        ResponseSchema,
        async function (request, reply) {
            try {
                printRequest("/deposit", request, server.log);
                const body: any = request.body;
                const query: any = request.query;
                const amount = body.params[0];
                const chainId = query['chainId'] ?? body.params[1];
                const chain = getViemChain(Number(chainId));
                const api_key = query['apiKey'] ?? body.params[2];
                if (!api_key)
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                let privateKey: Hex;
                let supportedNetworks;
                if (!unsafeMode) {
                    const AWSresponse = await client.send(
                        new GetSecretValueCommand({
                            SecretId: prefixSecretId + api_key,
                        })
                    );
                    const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
                    if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                    privateKey = secrets['PRIVATE_KEY'];
                    supportedNetworks = secrets['SUPPORTED_NETWORKS'];
                } else {
                    const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
                    if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                    privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
                    supportedNetworks = apiKeyEntity.supportedNetworks;
                }
                if (
                    isNaN(amount) ||
                    !chainId ||
                    isNaN(chainId)
                ) {
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
                }
                if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
                }
                const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_06);
                if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
                return await paymaster.deposit(amount, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey, chainId, true, chain, server.log);
            } catch (err: any) {
                request.log.error(err);
                if (err.name == "ResourceNotFoundException")
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
                return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
            }
        }
    )

    server.post("/deposit/v2",
        ResponseSchema,
        async function (request, reply) {
            try {
                printRequest("/deposit/v2", request, server.log);
                const body: any = request.body;
                const query: any = request.query;
                const amount = body.params[0];
                const chainId = query['chainId'] ?? body.params[1];
                const chain = getViemChain(Number(chainId));
                const api_key = query['apiKey'] ?? body.params[2];
                if (!api_key)
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                let privateKey: Hex;
                let supportedNetworks;
                if (!unsafeMode) {
                    const AWSresponse = await client.send(
                        new GetSecretValueCommand({
                            SecretId: prefixSecretId + api_key,
                        })
                    );
                    const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
                    if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                    privateKey = secrets['PRIVATE_KEY'];
                    supportedNetworks = secrets['SUPPORTED_NETWORKS'];
                } else {
                    const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
                    if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                    privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
                    supportedNetworks = apiKeyEntity.supportedNetworks;
                }
                if (
                    isNaN(amount) ||
                    !chainId ||
                    isNaN(chainId)
                ) {
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
                }
                if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
                }
                const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
                if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
                return await paymaster.deposit(amount, networkConfig.contracts.etherspotPaymasterAddress, networkConfig.bundler, privateKey, chainId, false, chain, server.log);
            } catch (err: any) {
                request.log.error(err);
                if (err.name == "ResourceNotFoundException")
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
                return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
            }
        }
    )
};

export default depositRoutes;
