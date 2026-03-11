import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authPlugin, authenticate } from '@kealee/core-auth';
import { marketplaceRoutes } from './marketplace.routes';

const SERVICE_NAME = 'marketplace';
const PORT = parseInt(process.env.PORT || '3016', 10);

async function bootstrap() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(authPlugin);

  app.get('/health', async () => ({ status: 'ok', service: SERVICE_NAME }));

  app.addHook('onRequest', async (request, reply) => {
    if (request.url === '/health') return;
    await authenticate(request, reply);
  });

  // Register marketplace routes
  await app.register(marketplaceRoutes, { prefix: '/api/v1/marketplace' });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
}

bootstrap().catch((err) => {
  console.error(`[${SERVICE_NAME}] Failed to start:`, err);
  process.exit(1);
});
