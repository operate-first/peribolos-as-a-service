import { Server, Probot } from 'probot';
import app from './app';
import { register } from 'prom-client';

async function startServer() {
  const probotDefault = Probot.defaults({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    secret: process.env.WEBHOOK_SECRET,
  });

  const server =
    process.env.NODE_ENV === 'production'
      ? new Server({
          Probot: probotDefault,
        })
      : new Server({
          webhookProxy: process.env.WEBHOOK_PROXY_URL,
          Probot: probotDefault,
        });

  await server.load(app);

  server.expressApp.get('/', (_, response) => {
    response.redirect('https://github.com/apps/peribolos');
  });

  server.expressApp.get('/metrics', async (_, response) => {
    response.setHeader('Content-type', register.contentType);
    response.end(await register.metrics());
  });

  server.expressApp.get('/healthz', (_, response) =>
    response.status(200).send('OK')
  );

  server.start();
}

startServer();
