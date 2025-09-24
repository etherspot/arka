import fastify from 'Fastify';
import fp from 'fastify-plugin';
import { configPlugin } from '../src/plugins/config';
import routes from '../src/routes/index'


// Automatically build and tear down our instance
function build () {
  const app = fastify();

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  

  beforeAll(async () => {
    void app.register(fp(configPlugin));
    app.register(routes)
    await app.ready();
  });

  afterAll(() => app.close())

  return app
}

export {
  build
}