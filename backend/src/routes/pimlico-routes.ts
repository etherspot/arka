/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import { PAYMASTER_ADDRESS } from "../constants/Pimlico.js";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { decode } from "../utils/crypto.js";
import { printRequest, getNetworkConfig } from "../utils/common.js";
import { APIKey } from "../models/api-key.js";

const pimlicoRoutes: FastifyPluginAsync = async (server) => {

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

    server.post("/tokenPaymasterAddress",
        ResponseSchema,
        async function (request, reply) {
            try {
                printRequest("/tokenPaymasterAddress", request, server.log);
                const query: any = request.query;
                const body: any = request.body;
                if (!body) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY });
                const entryPoint = body.params?.[0];
                const context = body.params?.[1];
                const gasToken = context ? context.token : null;
                const chainId = query['chainId'] ?? body.params?.[2];
                const api_key = query['apiKey'] ?? body.params?.[3];
                if (!api_key || typeof(api_key) !== "string")
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                const apiKeyData = await server.apiKeyRepository.findOneByApiKey(api_key);
                if (!apiKeyData) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                const apiKeyEntity: APIKey = apiKeyData as APIKey;
                let customPaymasters = [];
                let privateKey = '';
                if (!unsafeMode) {
                    const AWSresponse = await client.send(
                        new GetSecretValueCommand({
                            SecretId: prefixSecretId + api_key,
                        })
                    );
                    const secrets = JSON.parse(AWSresponse.SecretString ?? '{}');
                    if (!secrets['PRIVATE_KEY']) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                    privateKey = secrets['PRIVATE_KEY'];
                } else {
                    privateKey = decode(apiKeyEntity.privateKey, server.config.HMAC_SECRET);
                }
                if (apiKeyEntity.erc20Paymasters) {
                    const buffer = Buffer.from(apiKeyEntity.erc20Paymasters, 'base64');
                    customPaymasters = JSON.parse(buffer.toString());
                }
                const supportedNetworks = apiKeyEntity.supportedNetworks;
                if (!privateKey) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
                if (
                    !entryPoint ||
                    !gasToken ||
                    !chainId ||
                    isNaN(chainId)
                ) {
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_DATA });
                }
                if (server.config.SUPPORTED_NETWORKS == '' && !SupportedNetworks) {
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
                }
                const networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', entryPoint);
                if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
                let result;
                if (customPaymasters[chainId] && customPaymasters[chainId][gasToken]) result = { message: customPaymasters[chainId][gasToken] }
                else {
                    if (!(PAYMASTER_ADDRESS[chainId] && PAYMASTER_ADDRESS[chainId][gasToken])) return reply.code(ReturnCode.FAILURE).send({ error: "Invalid network/token" })
                    result = { message: PAYMASTER_ADDRESS[chainId][gasToken] }
                }
                server.log.info(result, 'tokenPaymasterAddress Response sent: ');
                if (body.jsonrpc)
                    return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, message: result.message, error: null })
                return reply.code(ReturnCode.SUCCESS).send(result);
            } catch (err: any) {
                request.log.error(err);
                if (err.name == "ResourceNotFoundException")
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
                return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
            }
        }
    )

};

export default pimlicoRoutes;
