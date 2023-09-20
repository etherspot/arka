import fastify from 'fastify';
import cors from '@fastify/cors'
import config from './plugins/config.js';
import routes from './routes/index.js';

const server = fastify({
  ajv: {
    customOptions: {
      removeAdditional: "all",
      coerceTypes: true,
      useDefaults: true,
    }
  },
  logger: {
    level: process.env.LOG_LEVEL,
  },
});

await server.register(cors, () => {
  return (req: { headers: { origin: string; }; }, callback: (arg0: null, arg1: {
      // This is NOT recommended for production as it enables reflection exploits
      origin: boolean;
    }) => void) => {
    const corsOptions = {
      // This is NOT recommended for production as it enables reflection exploits
      origin: true
    };

    // do not include CORS headers for requests from localhost
    if (/^localhost$/m.test(req.headers.origin) || /^127.0.0.1$/m.test(req.headers.origin) || /^0.0.0.0$/m.test(req.headers.origin)) {
      corsOptions.origin = false
      return
    }

    // callback expects two parameters: error and options
    callback(null, corsOptions)
  }
})


await server.register(config);
await server.register(routes);
await server.ready();

export default server;
