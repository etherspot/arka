import { FastifyBaseLogger, FastifyRequest } from "fastify";

export function printRequest(methodName: string, request: FastifyRequest, log: FastifyBaseLogger) {
  log.info(methodName, "called: ");
  log.info(request.query, "query passed: ");
  log.info(request.body, "body passed: ");
}
