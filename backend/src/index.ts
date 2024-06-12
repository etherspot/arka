import { server } from './server.js';

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

setTimeout(async () => {
  await server.ready();
  const port = Number(server.config.API_PORT);
  const host = server.config.API_HOST;
  await server.listen({ host, port });
}, 5000);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () =>
    server.close().then((err) => {
      server.sequelize.close();
      console.log(`close application on ${signal}`);
      process.exit(err ? 1 : 0);
    }),
  );
}
