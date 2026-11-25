import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { IncomingHttpHeaders } from 'http';
import ErrorMessage from '../constants/ErrorMessage.js';
import ReturnCode from '../constants/ReturnCode.js';
import { AuthDto } from '../types/auth-dto.js';
import { verifySignature } from './crypto.js';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string;
  }
}

export function captureRawJsonBody(server: FastifyInstance): void {
  const defaultJsonParser = server.getDefaultJsonParser('error', 'error');
  server.removeContentTypeParser('application/json');
  server.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (request, body, done) => {
      const raw = Buffer.isBuffer(body) ? body.toString('utf8') : body;
      request.rawBody = raw;
      defaultJsonParser(request, raw, done);
    },
  );
}

function signedPayload(request: FastifyRequest): string {
  if (typeof request.rawBody === 'string') return request.rawBody;
  if (typeof request.body === 'string') return request.body;
  if (request.body == null) return '';
  return JSON.stringify(request.body);
}

export function authorizeTreasuryRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  unsafeMode: boolean,
  hmacSecret: string,
): boolean {
  if (unsafeMode) return true;

  const headers = request.headers as IncomingHttpHeaders & Partial<AuthDto>;
  const signature = headers['x-signature'];
  const timestamp = headers['x-timestamp'];
  if (
    typeof signature !== 'string' ||
    typeof timestamp !== 'string' ||
    signature.length === 0 ||
    Number.isNaN(Number(timestamp))
  ) {
    reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.INVALID_SIGNATURE_OR_TIMESTAMP });
    return false;
  }

  if (!verifySignature(signature, signedPayload(request), timestamp, hmacSecret)) {
    reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.INVALID_SIGNATURE_OR_TIMESTAMP });
    return false;
  }
  return true;
}
