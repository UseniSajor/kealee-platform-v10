/**
 * KEALEE COMMAND CENTER - API GATEWAY
 * Unified API gateway for all 14 mini-apps
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

// Import routes from all apps
import { bidEngineRoutes } from '../../apps/APP-01-bid-engine/src/index.js';
import { visitSchedulerRoutes } from '../../apps/APP-02-visit-scheduler/src/index.js';
import { changeOrderRoutes } from '../../apps/APP-03-change-order/src/index.js';
import { reportGeneratorRoutes } from '../../apps/APP-04-report-generator/src/index.js';
import { permitTrackerRoutes } from '../../apps/APP-05-permit-tracker/src/index.js';
import { inspectionRoutes } from '../../apps/APP-06-inspection/src/index.js';
import { budgetTrackerRoutes } from '../../apps/APP-07-budget-tracker/src/index.js';
import { communicationRoutes } from '../../apps/APP-08-communication/src/index.js';
import { taskQueueRoutes } from '../../apps/APP-09-task-queue/src/index.js';
import { documentGenRoutes } from '../../apps/APP-10-document-gen/src/index.js';
import { predictiveRoutes } from '../../apps/APP-11-predictive/src/index.js';
import { smartSchedulerRoutes } from '../../apps/APP-12-smart-scheduler/src/index.js';
import { qaInspectorRoutes } from '../../apps/APP-13-qa-inspector/src/index.js';
import { decisionSupportRoutes } from '../../apps/APP-14-decision-support/src/index.js';

// Import queue metrics
import { getAllQueueMetrics, shutdownQueues } from '../../shared/queue.js';
import { closeAllEventBuses } from '../../shared/events.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: { colorize: true },
      } : undefined,
    },
    trustProxy: true,
  });

  // Security middleware
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.headers['x-user-id'] as string || request.ip;
    },
  });

  // Health check endpoints
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'command-center',
    version: process.env.npm_package_version || '1.0.0',
  }));

  fastify.get('/health/ready', async () => {
    // Check Redis connection
    try {
      const metrics = await getAllQueueMetrics();
      return {
        status: 'ready',
        queues: Object.keys(metrics).length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        error: String(error),
      };
    }
  });

  // Queue metrics endpoint
  fastify.get('/metrics/queues', async () => {
    const metrics = await getAllQueueMetrics();
    return {
      timestamp: new Date().toISOString(),
      queues: metrics,
    };
  });

  // Register all app routes under /api/v1
  await fastify.register(async (app) => {
    // APP-01: Bid Engine
    await app.register(bidEngineRoutes, { prefix: '/bids' });

    // APP-02: Visit Scheduler
    await app.register(visitSchedulerRoutes, { prefix: '/visits' });

    // APP-03: Change Order
    await app.register(changeOrderRoutes, { prefix: '/change-orders' });

    // APP-04: Report Generator
    await app.register(reportGeneratorRoutes, { prefix: '/reports' });

    // APP-05: Permit Tracker
    await app.register(permitTrackerRoutes, { prefix: '/permits' });

    // APP-06: Inspection Coordinator
    await app.register(inspectionRoutes, { prefix: '/inspections' });

    // APP-07: Budget Tracker
    await app.register(budgetTrackerRoutes, { prefix: '/budget' });

    // APP-08: Communication Hub
    await app.register(communicationRoutes, { prefix: '/communications' });

    // APP-09: Task Queue
    await app.register(taskQueueRoutes, { prefix: '/tasks' });

    // APP-10: Document Generator
    await app.register(documentGenRoutes, { prefix: '/documents' });

    // APP-11: Predictive Engine
    await app.register(predictiveRoutes, { prefix: '/ai/predictions' });

    // APP-12: Smart Scheduler
    await app.register(smartSchedulerRoutes, { prefix: '/scheduler' });

    // APP-13: QA Inspector
    await app.register(qaInspectorRoutes, { prefix: '/qa' });

    // APP-14: Decision Support
    await app.register(decisionSupportRoutes, { prefix: '/decisions' });

  }, { prefix: '/api/v1' });

  // Dashboard summary endpoint
  fastify.get('/api/v1/dashboard', async () => {
    const [queueMetrics] = await Promise.all([
      getAllQueueMetrics(),
    ]);

    // Calculate totals
    const totalWaiting = Object.values(queueMetrics).reduce((sum, m) => sum + m.waiting, 0);
    const totalActive = Object.values(queueMetrics).reduce((sum, m) => sum + m.active, 0);
    const totalCompleted = Object.values(queueMetrics).reduce((sum, m) => sum + m.completed, 0);
    const totalFailed = Object.values(queueMetrics).reduce((sum, m) => sum + m.failed, 0);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalJobs: {
          waiting: totalWaiting,
          active: totalActive,
          completed: totalCompleted,
          failed: totalFailed,
        },
        activeApps: Object.keys(queueMetrics).filter(
          k => queueMetrics[k].active > 0 || queueMetrics[k].waiting > 0
        ).length,
      },
      queues: queueMetrics,
    };
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode || 500;
    const message = statusCode === 500
      ? 'Internal Server Error'
      : error.message;

    reply.status(statusCode).send({
      error: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  });

  // Not found handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: true,
      message: `Route ${request.method} ${request.url} not found`,
      statusCode: 404,
    });
  });

  return fastify;
}

async function start() {
  const server = await buildServer();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);

    try {
      await server.close();
      await shutdownQueues();
      await closeAllEventBuses();
      console.log('Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║            KEALEE COMMAND CENTER - API GATEWAY                    ║
╠═══════════════════════════════════════════════════════════════════╣
║  Status:    Running                                               ║
║  Port:      ${String(PORT).padEnd(55)}║
║  Host:      ${HOST.padEnd(55)}║
║  Env:       ${(process.env.NODE_ENV || 'development').padEnd(55)}║
╠═══════════════════════════════════════════════════════════════════╣
║  System Endpoints:                                                ║
║  • GET  /health              - Health check                       ║
║  • GET  /health/ready        - Readiness check                    ║
║  • GET  /metrics/queues      - Queue metrics                      ║
║  • GET  /api/v1/dashboard    - Dashboard summary                  ║
╠═══════════════════════════════════════════════════════════════════╣
║  14 Mini-Apps Active:                                             ║
║  • /api/v1/bids              - APP-01: Contractor Bid Engine      ║
║  • /api/v1/visits            - APP-02: Site Visit Scheduler       ║
║  • /api/v1/change-orders     - APP-03: Change Order Processor     ║
║  • /api/v1/reports           - APP-04: Report Generator           ║
║  • /api/v1/permits           - APP-05: Permit Tracker             ║
║  • /api/v1/inspections       - APP-06: Inspection Coordinator     ║
║  • /api/v1/budget            - APP-07: Budget Tracker             ║
║  • /api/v1/communications    - APP-08: Communication Hub          ║
║  • /api/v1/tasks             - APP-09: Task Queue Manager         ║
║  • /api/v1/documents         - APP-10: Document Generator         ║
║  • /api/v1/ai/predictions    - APP-11: Predictive Engine (AI)     ║
║  • /api/v1/scheduler         - APP-12: Smart Scheduler (AI)       ║
║  • /api/v1/qa                - APP-13: QA Inspector (AI)          ║
║  • /api/v1/decisions         - APP-14: Decision Support (AI)      ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
export { buildServer };

// Start server if running directly
start();
