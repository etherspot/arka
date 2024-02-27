import { FastifyBaseLogger, FastifyRequest } from "fastify";

export function printRequest(request: FastifyRequest, log: FastifyBaseLogger) {
  log.info(request.query, "query passed: ");
  log.info(request.body, "body passed: ");
}
