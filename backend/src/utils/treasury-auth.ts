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

const TREASURY_QUERY_KEYS = ['apiKey', 'chainId', 'useVp'] as const;

function signedBody(request: FastifyRequest): string {
  if (typeof request.rawBody === 'string') return request.rawBody;
  if (typeof request.body === 'string') return request.body;
  if (request.body == null) return '';
  return JSON.stringify(request.body);
}

function routePath(request: FastifyRequest): string {
  const routeUrl = request.routeOptions?.url;
  if (typeof routeUrl === 'string' && routeUrl.length > 0) return routeUrl;
  const url = request.url ?? '';
  const queryIndex = url.indexOf('?');
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

function queryField(query: FastifyRequest['query'], key: string): string | undefined {
  if (query == null || typeof query !== 'object') return '';
  const record = query as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(record, key)) return '';
  const value = record[key];
  if (typeof value !== 'string') return undefined;
  return value;
}

export function treasurySignatureMaterial(request: FastifyRequest): string | undefined {
  const fields = TREASURY_QUERY_KEYS.map((key) => queryField(request.query, key));
  if (fields.some((field) => field === undefined)) return undefined;
  return [request.method, routePath(request), ...fields, signedBody(request)].join('\n');
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
  const material = treasurySignatureMaterial(request);
  if (
    typeof signature !== 'string' ||
    typeof timestamp !== 'string' ||
    signature.length === 0 ||
    !/^\d{1,15}$/.test(timestamp) ||
    material === undefined
  ) {
    reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.INVALID_SIGNATURE_OR_TIMESTAMP });
    return false;
  }

  if (!verifySignature(signature, material, timestamp, hmacSecret)) {
    reply.code(ReturnCode.NOT_AUTHORIZED).send({ error: ErrorMessage.INVALID_SIGNATURE_OR_TIMESTAMP });
    return false;
  }
  return true;
}
