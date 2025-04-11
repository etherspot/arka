/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Paymaster } from "../paymaster/index.js";
import SupportedNetworks from "../../config.json" assert { type: "json" };
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { decode } from "../utils/crypto.js";
import { printRequest, getNetworkConfig } from "../utils/common.js";
import { APIKey } from "../models/api-key.js";
import { EPVersions } from "../types/sponsorship-policy-dto.js";

const depositRoutes: FastifyPluginAsync = async (server) => {
    const paymaster = new Paymaster(server.config.FEE_MARKUP, server.config.MULTI_TOKEN_MARKUP, server.config.EP7_TOKEN_VGL, server.config.EP7_TOKEN_PGL, server.sequelize, server.config.MTP_VGL_MARKUP, server.config.EP7_PVGL, server.config.EP8_PVGL);

    const SUPPORTED_ENTRYPOINTS = {
        EPV_06: server.config.EPV_06,
        EPV_07: server.config.EPV_07,
        EPV_08: server.config.EPV_08
    }

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

    async function deposit(request: FastifyRequest, reply: FastifyReply, epVersion: EPVersions) {
        try {
            const body: any = request.body;
            if (!body) {
                return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.EMPTY_BODY })
            }
            const query: any = request.query;
            const amount = body.params?.[0];
            const useVp = query['useVp'] ?? false;
            const chainId = query['chainId'] ?? body.params?.[1];
            const api_key = query['apiKey'] ?? body.params?.[2];
            
            if (!api_key || typeof(api_key) !== "string")
                return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
            let privateKey = '';
            let bundlerApiKey = api_key;
            const apiKeyEntity: APIKey | null = await server.apiKeyRepository.findOneByApiKey(api_key);
            if (!apiKeyEntity) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY })
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
            const supportedNetworks = apiKeyEntity.supportedNetworks;
            if (apiKeyEntity.bundlerApiKey) {
                bundlerApiKey = apiKeyEntity.bundlerApiKey;
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
            let networkConfig;
            let vpAddr;
            if (EPVersions.EPV_06 == epVersion) {
                networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_06);
                vpAddr = apiKeyEntity.verifyingPaymasters ? 
                            JSON.parse(apiKeyEntity.verifyingPaymasters)[chainId] :
                            undefined;
            } else if (EPVersions.EPV_07 == epVersion) {
                networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_07);
                vpAddr = apiKeyEntity.verifyingPaymastersV2 ? 
                            JSON.parse(apiKeyEntity.verifyingPaymastersV2)[chainId] :
                            undefined;
            } else if (EPVersions.EPV_08 == epVersion) {
                networkConfig = getNetworkConfig(chainId, supportedNetworks ?? '', SUPPORTED_ENTRYPOINTS.EPV_08);
                vpAddr = apiKeyEntity.verifyingPaymastersV3 ? 
                            JSON.parse(apiKeyEntity.verifyingPaymastersV3)[chainId] :
                            undefined;
            }
            if (!networkConfig) return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.UNSUPPORTED_NETWORK });
            let bundlerUrl = networkConfig.bundler;
            if (networkConfig.bundler.includes('etherspot.io')) bundlerUrl = `${networkConfig.bundler}?api-key=${bundlerApiKey}`;

            if(!useVp) {
                return await paymaster.deposit(amount, networkConfig.contracts.etherspotPaymasterAddress, bundlerUrl, privateKey, chainId, true, server.log);
            }
            if(!vpAddr) {
                return reply.code(ReturnCode.FAILURE).send({error: ErrorMessage.VP_NOT_DEPLOYED})
            }

            return await paymaster.deposit(amount, vpAddr, bundlerUrl, privateKey, chainId, false, server.log);
        } catch (err: any) {
            request.log.error(err);
            if (err.name == "ResourceNotFoundException")
                return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
            return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS })
        }
    }

    server.post("/deposit",
        ResponseSchema,
        async function (request, reply) {
            printRequest("/deposit", request, server.log);
            return await deposit(request, reply, EPVersions.EPV_06);
        }
    )

    server.post("/deposit/v2",
        ResponseSchema,
        async function (request, reply) {
            printRequest("/deposit/v2", request, server.log);
            return await deposit(request, reply, EPVersions.EPV_07);
        }
    )

    server.post("/deposit/v3",
        ResponseSchema,
        async function (request, reply) {
            printRequest("/deposit/v3", request, server.log);
            return await deposit(request, reply, EPVersions.EPV_08);
        }
    )
};

export default depositRoutes;