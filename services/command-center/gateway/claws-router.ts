/**
 * KEALEE CLAWS GATEWAY — Routes for the 8-Claw system.
 * Mounts all claw route files under prefixed paths.
 * See: _docs/kealee-architecture.md §7 (Phase 7: Gateway)
 *
 * This runs alongside the existing gateway/src/server.ts (mini-app routes).
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { PrismaClient } from '@prisma/client';

// Import claw route factories
import { bidRoutes } from '../claws/acquisition-precon/routes/bids';
import { estimateRoutes } from '../claws/acquisition-precon/routes/estimates';
import { contractRoutes } from '../claws/contract-commercials/routes/contracts';
import { scheduleRoutes } from '../claws/schedule-field-ops/routes/schedule';
import { budgetRoutes } from '../claws/budget-cost/routes/budget';
import { permitRoutes } from '../claws/permits-compliance/routes/permits';
import { documentRoutes } from '../claws/docs-communication/routes/documents';
import { messengerRoutes } from '../claws/docs-communication/routes/messenger';
import { predictionRoutes } from '../claws/risk-prediction/routes/predictions';
import { taskRoutes } from '../claws/command-automation/routes/tasks';

export async function buildClawsGateway(prisma: PrismaClient): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
    trustProxy: true,
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'kealee-claws-gateway',
    timestamp: new Date().toISOString(),
  }));

  // Mount all claw routes under /api/claws
  await fastify.register(async (app) => {
    // Claw A: Acquisition & PreCon
    await app.register(bidRoutes(prisma), { prefix: '/acquisition/bids' });
    await app.register(estimateRoutes(prisma), { prefix: '/acquisition/estimates' });

    // Claw B: Contract & Commercials
    await app.register(contractRoutes(prisma), { prefix: '/contracts' });

    // Claw C: Schedule & Field Ops
    await app.register(scheduleRoutes(prisma), { prefix: '/schedule' });

    // Claw D: Budget & Cost Control
    await app.register(budgetRoutes(prisma), { prefix: '/budget' });

    // Claw E: Permits & Compliance
    await app.register(permitRoutes(prisma), { prefix: '/permits' });

    // Claw F: Documents & Communication
    await app.register(documentRoutes(prisma), { prefix: '/docs' });

    // Claw G: Risk, Prediction & Decisions
    await app.register(predictionRoutes(prisma), { prefix: '/risk' });

    // Claw H: Command Center & Automation
    await app.register(taskRoutes(prisma), { prefix: '/command' });
  }, { prefix: '/api/claws' });

  // Kealee Messenger routes (Claw F)
  await fastify.register(messengerRoutes(prisma), { prefix: '/api/messenger' });

  // Error handler
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode || 500).send({
      error: true,
      message: error.statusCode === 500 ? 'Internal Server Error' : error.message,
      statusCode: error.statusCode || 500,
    });
  });

  return fastify;
}
