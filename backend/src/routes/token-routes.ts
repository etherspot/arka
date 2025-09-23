/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify";
import ErrorMessage from "../constants/ErrorMessage.js";
import ReturnCode from "../constants/ReturnCode.js";
import { printRequest } from "../utils/common.js";
import { getAddress } from "viem";

const tokenRoutes: FastifyPluginAsync = async (server) => {

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

    server.post("/getAllCommonERC20PaymasterAddress",
        ResponseSchema,
        async function (request, reply) {
            try {
                printRequest("/getAllCommonERC20PaymasterAddress", request, server.log);
                const body: any = request.body;
                const multiTokenRec = await server.multiTokenPaymasterRepository.findAll();
                const result = multiTokenRec.map((record) => {
                    return {
                        paymasterAddress: record.paymasterAddress,
                        gasToken: getAddress(record.tokenAddress),
                        chainId: record.chainId,
                        decimals: record.decimals,
                        epVersion: record.epVersion,
                    }
                });
                server.log.info(result, 'getAllCommonERC20PaymasterAddress Response sent: ');
                if (body.jsonrpc)
                    return reply.code(ReturnCode.SUCCESS).send({ jsonrpc: body.jsonrpc, id: body.id, message: JSON.stringify(result), error: null })
                return reply.code(ReturnCode.SUCCESS).send({message: JSON.stringify(result)});
            } catch (err: any) {
                request.log.error(err);
                if (err.name == "ResourceNotFoundException")
                    return reply.code(ReturnCode.FAILURE).send({ error: ErrorMessage.INVALID_API_KEY });
                return reply.code(ReturnCode.FAILURE).send({ error: err.message ?? ErrorMessage.FAILED_TO_PROCESS });
            }
        }
    )

};

export default tokenRoutes;
