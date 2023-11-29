import fastify from 'fastify';
import cors from '@fastify/cors'
import fastifyCron from 'fastify-cron'
import config from './plugins/config.js';
import routes, { cronJob } from './routes/index.js';

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

await server.register(cors, {
  // put your options here
  preflightContinue: true
})


await server.register(config);
await server.register(routes);
await server.register(fastifyCron, {
  jobs: [
    {
      // Only these two properties are required,
      // the rest is from the node-cron API:
      // https://github.com/kelektiv/node-cron#api
      cronTime: '0 0 * * *', // Everyday at midnight UTC

      // Note: the callbacks (onTick & onComplete) take the server
      // as an argument, as opposed to nothing in the node-cron API:
      onTick: async () => {
        cronJob();
      }
    }
  ]
})

await server.ready();

server.cron.startAllJobs()

export default server;
