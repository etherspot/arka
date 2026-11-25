import crypto from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { authorizeTreasuryRequest } from './treasury-auth.js';

const secret = 'test-hmac-secret';

function sign(data: string, timestamp: string): string {
  return crypto.createHmac('sha256', secret).update(data + timestamp).digest('hex');
}

function mockReply() {
  const sent: { status?: number; body?: unknown } = {};
  const reply = {
    code(status: number) {
      sent.status = status;
      return reply;
    },
    send(body: unknown) {
      sent.body = body;
      return reply;
    },
  };
  return { reply: reply as unknown as FastifyReply, sent };
}

function requestWith(rawBody: string, headers: Record<string, string> = {}): FastifyRequest {
  return {
    headers,
    body: JSON.parse(rawBody),
    rawBody,
  } as unknown as FastifyRequest;
}

describe('authorizeTreasuryRequest', () => {
  test('safe mode rejects a request that only carries apiKey', () => {
    const rawBody = JSON.stringify({ params: ['4.99'] });
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(requestWith(rawBody), reply, false, secret);
    expect(allowed).toBe(false);
    expect(sent.status).toBe(403);
  });

  test('safe mode accepts the server HMAC over the raw body', () => {
    const rawBody = JSON.stringify({
      withdrawAddress: '0x672237325238c45fd9e354fBa69FfAc717d919E6',
      withdrawAmount: '4.99',
    });
    const timestamp = Date.now().toString();
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(
      requestWith(rawBody, {
        'x-signature': sign(rawBody, timestamp),
        'x-timestamp': timestamp,
      }),
      reply,
      false,
      secret,
    );
    expect(allowed).toBe(true);
    expect(sent.status).toBeUndefined();
  });

  test('safe mode rejects a signature over a different body', () => {
    const rawBody = JSON.stringify({ params: ['1'] });
    const timestamp = Date.now().toString();
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(
      requestWith(rawBody, {
        'x-signature': sign(JSON.stringify({ params: ['2'] }), timestamp),
        'x-timestamp': timestamp,
      }),
      reply,
      false,
      secret,
    );
    expect(allowed).toBe(false);
    expect(sent.status).toBe(403);
  });

  test('unsafe mode keeps local treasury calls open', () => {
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(requestWith('{}'), reply, true, secret);
    expect(allowed).toBe(true);
    expect(sent.status).toBeUndefined();
  });
});
