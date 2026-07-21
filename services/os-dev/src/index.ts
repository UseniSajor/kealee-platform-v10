import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authPlugin, authenticate } from '@kealee/core-auth';
import { capitalRoutes } from './capital.routes';

const SERVICE_NAME = 'os-dev';
const PORT = parseInt(process.env.PORT || '3012', 10);

async function bootstrap() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(authPlugin);

  app.get('/health', async () => ({ status: 'ok', service: SERVICE_NAME }));

  app.addHook('onRequest', async (request, reply) => {
    if (request.url === '/health') return;
    await authenticate(request, reply);
  });

  // Register OS-Dev routes
  await app.register(capitalRoutes, { prefix: '/api/v1/dev' });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
}

bootstrap().catch((err) => {
  console.error(`[${SERVICE_NAME}] Failed to start:`, err);
  process.exit(1);
});
