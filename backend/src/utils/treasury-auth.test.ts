import crypto from 'crypto';
import fastify from 'fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { authorizeTreasuryRequest, captureRawJsonBody, treasurySignatureMaterial } from './treasury-auth.js';

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

function requestWith(
  rawBody: string,
  headers: Record<string, string> = {},
  query: Record<string, string> = {},
): FastifyRequest {
  return {
    method: 'POST',
    url: '/withdrawDeposit',
    headers,
    query,
    body: JSON.parse(rawBody),
    rawBody,
  } as unknown as FastifyRequest;
}

function signedRequest(rawBody: string, query: Record<string, string> = {}, timestamp = Date.now().toString()): FastifyRequest {
  const request = requestWith(rawBody, {}, query);
  const material = treasurySignatureMaterial(request);
  if (material === undefined) throw new Error('fixture query is not signable');
  request.headers = {
    'x-timestamp': timestamp,
    'x-signature': sign(material, timestamp),
  };
  return request;
}

describe('authorizeTreasuryRequest', () => {
  test('safe mode rejects a request that only carries apiKey', () => {
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(requestWith(JSON.stringify({ params: ['4.99'] })), reply, false, secret);
    expect(allowed).toBe(false);
    expect(sent.status).toBe(403);
  });

  test('safe mode accepts a signature over the method, route, query, and raw body', () => {
    const rawBody = JSON.stringify({
      withdrawAddress: '0x672237325238c45fd9e354fBa69FfAc717d919E6',
      withdrawAmount: '4.99',
    });
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(
      signedRequest(rawBody, { apiKey: 'K', chainId: '8453', useVp: 'true' }),
      reply,
      false,
      secret,
    );
    expect(allowed).toBe(true);
    expect(sent.status).toBeUndefined();
  });

  test('safe mode rejects the same signature sent with another apiKey', () => {
    const rawBody = JSON.stringify({ withdrawAddress: '0x672237325238c45fd9e354fBa69FfAc717d919E6', withdrawAmount: '1' });
    const request = signedRequest(rawBody, { apiKey: 'Victim', chainId: '8453', useVp: 'true' });
    request.query = { apiKey: 'Other', chainId: '8453', useVp: 'true' };
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(request, reply, false, secret);
    expect(allowed).toBe(false);
    expect(sent.status).toBe(403);
  });

  test('safe mode rejects a signature over a different body', () => {
    const rawBody = JSON.stringify({ params: ['1'] });
    const timestamp = Date.now().toString();
    const other = requestWith(JSON.stringify({ params: ['2'] }));
    const otherMaterial = treasurySignatureMaterial(other);
    if (otherMaterial === undefined) throw new Error('fixture query is not signable');
    const request = requestWith(rawBody, {
      'x-timestamp': timestamp,
      'x-signature': sign(otherMaterial, timestamp),
    });
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(request, reply, false, secret);
    expect(allowed).toBe(false);
    expect(sent.status).toBe(403);
  });

  test('safe mode rejects a timestamp that skips the freshness check', () => {
    const rawBody = JSON.stringify({ params: ['1'] });
    const request = requestWith(rawBody);
    const material = treasurySignatureMaterial(request);
    if (material === undefined) throw new Error('fixture query is not signable');
    request.headers = {
      'x-timestamp': 'Infinity',
      'x-signature': sign(material, 'Infinity'),
    };
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(request, reply, false, secret);
    expect(allowed).toBe(false);
    expect(sent.status).toBe(403);
  });

  test('unsafe mode keeps local treasury calls open', () => {
    const { reply, sent } = mockReply();
    const allowed = authorizeTreasuryRequest(requestWith('{}'), reply, true, secret);
    expect(allowed).toBe(true);
    expect(sent.status).toBeUndefined();
  });

  test('the json parser accepts a signature over the exact raw body', async () => {
    const app = fastify();
    captureRawJsonBody(app);
    app.post('/deposit', async (request, reply) => {
      const allowed = authorizeTreasuryRequest(request, reply, false, secret);
      if (!allowed) return;
      return { ok: true };
    });
    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const payload = '{ "params" : ["1"] }\n';
    const timestamp = Date.now().toString();
    const material = ['POST', '/deposit', 'K', '8453', 'true', payload].join('\n');
    const response = await fetch(`http://127.0.0.1:${port}/deposit?apiKey=K&chainId=8453&useVp=true`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-timestamp': timestamp,
        'x-signature': sign(material, timestamp),
      },
      body: payload,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    await app.close();
  });
});
