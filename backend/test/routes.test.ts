import { FastifyInstance } from 'fastify';
import server from '../src/server.js';

const app = server as FastifyInstance;

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await app.close();
  jest.clearAllMocks();
});

describe('HealthCheck Routes', () => {
  test('should respond with success status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/healthCheck',
    });

    expect(response.statusCode).toBe(200);
  });
});
