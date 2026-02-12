/**
 * App Health Routes
 * Handles AppHealthMetric, Alert, and DeadLetterLog models
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const idParamSchema = z.object({
  id: z.string().uuid(),
});

// AppHealthMetric
const healthMetricsListSchema = z.object({
  appId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// Alert
const alertListSchema = z.object({
  level: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
  source: z.string().optional(),
  acknowledged: z.string().transform((v) => v === 'true').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

const alertUpdateSchema = z.object({
  acknowledged: z.boolean().optional(),
  acknowledgedBy: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
});

// DeadLetterLog
const deadLetterListSchema = z.object({
  appId: z.string().optional(),
  status: z.enum(['pending', 'retried', 'discarded']).optional(),
  originalQueue: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function appHealthRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // --------------------------------------------------------------------------
  // APP HEALTH METRICS
  // --------------------------------------------------------------------------

  // GET /health-metrics - List app health metrics
  fastify.get(
    '/health-metrics',
    { preHandler: [validateQuery(healthMetricsListSchema)] },
    async (request, reply) => {
      try {
        const query = healthMetricsListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.appId) where.appId = query.appId;
        if (query.startDate || query.endDate) {
          where.timestamp = {};
          if (query.startDate) where.timestamp.gte = new Date(query.startDate);
          if (query.endDate) where.timestamp.lte = new Date(query.endDate);
        }

        const [metrics, total] = await Promise.all([
          p.appHealthMetric.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
          }),
          p.appHealthMetric.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: metrics,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to list health metrics',
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // ALERTS
  // --------------------------------------------------------------------------

  // GET /alerts - List system alerts
  fastify.get(
    '/alerts',
    { preHandler: [validateQuery(alertListSchema)] },
    async (request, reply) => {
      try {
        const query = alertListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.level) where.level = query.level;
        if (query.source) where.source = query.source;
        if (query.acknowledged !== undefined) where.acknowledged = query.acknowledged;

        const [alerts, total] = await Promise.all([
          p.alert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          p.alert.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: alerts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to list alerts',
        });
      }
    }
  );

  // PATCH /alerts/:id - Update alert (acknowledge, resolve)
  fastify.patch(
    '/alerts/:id',
    {
      preHandler: [
        validateParams(idParamSchema),
        validateBody(alertUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);
        const data = alertUpdateSchema.parse(request.body);

        const existing = await p.alert.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Alert not found',
          });
        }

        const updateData: any = {};
        if (data.acknowledged !== undefined) {
          updateData.acknowledged = data.acknowledged;
          if (data.acknowledged) {
            updateData.acknowledgedAt = new Date();
            updateData.acknowledgedBy = data.acknowledgedBy;
          }
        }
        if (data.resolvedAt !== undefined) {
          updateData.resolvedAt = new Date(data.resolvedAt);
        }

        const alert = await p.alert.update({
          where: { id },
          data: updateData,
        });

        return reply.send({
          success: true,
          data: alert,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to update alert',
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // DEAD LETTER LOG
  // --------------------------------------------------------------------------

  // GET /dead-letters - List dead letter log entries
  fastify.get(
    '/dead-letters',
    { preHandler: [validateQuery(deadLetterListSchema)] },
    async (request, reply) => {
      try {
        const query = deadLetterListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.appId) where.appId = query.appId;
        if (query.status) where.status = query.status;
        if (query.originalQueue) where.originalQueue = query.originalQueue;

        const [entries, total] = await Promise.all([
          p.deadLetterLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          p.deadLetterLog.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: entries,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to list dead letter entries',
        });
      }
    }
  );

  // POST /dead-letters/:id/retry - Retry a dead letter entry
  fastify.post(
    '/dead-letters/:id/retry',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const entry = await p.deadLetterLog.findUnique({ where: { id } });
        if (!entry) {
          return reply.code(404).send({
            success: false,
            error: 'Dead letter entry not found',
          });
        }

        if (entry.status !== 'pending') {
          return reply.code(400).send({
            success: false,
            error: `Cannot retry entry with status "${entry.status}". Only pending entries can be retried.`,
          });
        }

        const updated = await p.deadLetterLog.update({
          where: { id },
          data: {
            status: 'retried',
            retriedAt: new Date(),
          },
        });

        return reply.send({
          success: true,
          data: updated,
          message: 'Dead letter entry queued for retry',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to retry dead letter entry',
        });
      }
    }
  );

  // DELETE /dead-letters/:id - Dismiss (discard) a dead letter entry
  fastify.delete(
    '/dead-letters/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const entry = await p.deadLetterLog.findUnique({ where: { id } });
        if (!entry) {
          return reply.code(404).send({
            success: false,
            error: 'Dead letter entry not found',
          });
        }

        if (entry.status === 'discarded') {
          return reply.code(400).send({
            success: false,
            error: 'Entry is already discarded',
          });
        }

        const updated = await p.deadLetterLog.update({
          where: { id },
          data: {
            status: 'discarded',
            discardedAt: new Date(),
            discardReason: 'Manually dismissed',
          },
        });

        return reply.send({
          success: true,
          data: updated,
          message: 'Dead letter entry dismissed',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to dismiss dead letter entry',
        });
      }
    }
  );
}
