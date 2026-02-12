/**
 * Analytics Snapshot Routes
 * Handles AnalyticsSnapshot, KPI, AnalyticsAlert, and CustomReport models
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const paginationSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

const snapshotListSchema = z.object({
  projectId: z.string().uuid().optional(),
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

const snapshotCreateSchema = z.object({
  snapshotType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']),
  metrics: z.record(z.any()),
  trends: z.record(z.any()).optional(),
  forecasts: z.record(z.any()).optional(),
  calculationTime: z.number().int().optional(),
  dataPoints: z.number().int().optional(),
  snapshotDate: z.string().datetime().optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const kpiListSchema = z.object({
  category: z.string().optional(),
  type: z.enum(['FINANCIAL', 'OPERATIONAL', 'CUSTOMER', 'COMPLIANCE']).optional(),
  isHealthy: z.string().transform((v) => v === 'true').optional(),
});

const kpiCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FINANCIAL', 'OPERATIONAL', 'CUSTOMER', 'COMPLIANCE']),
  displayName: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
  currentValue: z.number(),
  targetValue: z.number().optional(),
  threshold: z.number().optional(),
  trendDirection: z.enum(['UP', 'DOWN', 'FLAT']),
  changePercent: z.number().optional(),
  previousValue: z.number().optional(),
  isHealthy: z.boolean().optional(),
  calculationFrequency: z.enum(['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  alertEnabled: z.boolean().optional(),
  alertThreshold: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

const kpiUpdateSchema = kpiCreateSchema.partial();

const customReportListSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  isScheduled: z.string().transform((v) => v === 'true').optional(),
});

const customReportCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  metrics: z.array(z.string()),
  filters: z.record(z.any()),
  groupBy: z.array(z.string()).optional(),
  visualization: z.enum(['table', 'line', 'bar', 'pie']).optional(),
  isScheduled: z.boolean().optional(),
  scheduleFrequency: z.string().optional(),
  scheduleDayOfWeek: z.number().int().min(0).max(6).optional(),
  scheduleDayOfMonth: z.number().int().min(1).max(31).optional(),
  isPublic: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function analyticsSnapshotRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // --------------------------------------------------------------------------
  // ANALYTICS SNAPSHOTS
  // --------------------------------------------------------------------------

  // GET /snapshots - List snapshots with filtering and pagination
  fastify.get(
    '/snapshots',
    { preHandler: [validateQuery(snapshotListSchema)] },
    async (request, reply) => {
      try {
        const query = snapshotListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.type) where.snapshotType = query.type;
        if (query.startDate || query.endDate) {
          where.snapshotDate = {};
          if (query.startDate) where.snapshotDate.gte = new Date(query.startDate);
          if (query.endDate) where.snapshotDate.lte = new Date(query.endDate);
        }

        const [snapshots, total] = await Promise.all([
          p.analyticsSnapshot.findMany({
            where,
            orderBy: { snapshotDate: 'desc' },
            skip,
            take: limit,
          }),
          p.analyticsSnapshot.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: snapshots,
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
          error: error.message || 'Failed to list analytics snapshots',
        });
      }
    }
  );

  // GET /snapshots/:id - Single snapshot
  fastify.get(
    '/snapshots/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const snapshot = await p.analyticsSnapshot.findUnique({
          where: { id },
        });

        if (!snapshot) {
          return reply.code(404).send({
            success: false,
            error: 'Snapshot not found',
          });
        }

        return reply.send({
          success: true,
          data: snapshot,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to get snapshot',
        });
      }
    }
  );

  // POST /snapshots - Create snapshot
  fastify.post(
    '/snapshots',
    { preHandler: [validateBody(snapshotCreateSchema)] },
    async (request, reply) => {
      try {
        const data = snapshotCreateSchema.parse(request.body);

        const snapshot = await p.analyticsSnapshot.create({
          data: {
            snapshotType: data.snapshotType,
            snapshotDate: data.snapshotDate ? new Date(data.snapshotDate) : new Date(),
            metrics: data.metrics,
            trends: data.trends || undefined,
            forecasts: data.forecasts || undefined,
            calculationTime: data.calculationTime,
            dataPoints: data.dataPoints,
          },
        });

        return reply.code(201).send({
          success: true,
          data: snapshot,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to create snapshot',
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // KPIs
  // --------------------------------------------------------------------------

  // GET /kpis - List KPIs with optional category filter
  fastify.get(
    '/kpis',
    { preHandler: [validateQuery(kpiListSchema)] },
    async (request, reply) => {
      try {
        const query = kpiListSchema.parse(request.query);

        const where: any = {};
        if (query.category) where.category = query.category;
        if (query.type) where.type = query.type;
        if (query.isHealthy !== undefined) where.isHealthy = query.isHealthy;

        const kpis = await p.kPI.findMany({
          where,
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });

        return reply.send({
          success: true,
          data: kpis,
          count: kpis.length,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to list KPIs',
        });
      }
    }
  );

  // POST /kpis - Create KPI
  fastify.post(
    '/kpis',
    { preHandler: [validateBody(kpiCreateSchema)] },
    async (request, reply) => {
      try {
        const data = kpiCreateSchema.parse(request.body);

        const kpi = await p.kPI.create({
          data: {
            name: data.name,
            type: data.type,
            displayName: data.displayName,
            description: data.description,
            unit: data.unit,
            category: data.category,
            currentValue: data.currentValue,
            targetValue: data.targetValue,
            threshold: data.threshold,
            trendDirection: data.trendDirection,
            changePercent: data.changePercent,
            previousValue: data.previousValue,
            isHealthy: data.isHealthy ?? true,
            calculationFrequency: data.calculationFrequency || 'DAILY',
            alertEnabled: data.alertEnabled ?? false,
            alertThreshold: data.alertThreshold,
            metadata: data.metadata || undefined,
          },
        });

        return reply.code(201).send({
          success: true,
          data: kpi,
        });
      } catch (error: any) {
        fastify.log.error(error);
        if (error.code === 'P2002') {
          return reply.code(409).send({
            success: false,
            error: 'A KPI with this name already exists',
          });
        }
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to create KPI',
        });
      }
    }
  );

  // PATCH /kpis/:id - Update KPI
  fastify.patch(
    '/kpis/:id',
    {
      preHandler: [
        validateParams(idParamSchema),
        validateBody(kpiUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);
        const data = kpiUpdateSchema.parse(request.body);

        const existing = await p.kPI.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'KPI not found',
          });
        }

        const updateData: any = {};
        if (data.displayName !== undefined) updateData.displayName = data.displayName;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.currentValue !== undefined) updateData.currentValue = data.currentValue;
        if (data.targetValue !== undefined) updateData.targetValue = data.targetValue;
        if (data.threshold !== undefined) updateData.threshold = data.threshold;
        if (data.trendDirection !== undefined) updateData.trendDirection = data.trendDirection;
        if (data.changePercent !== undefined) updateData.changePercent = data.changePercent;
        if (data.previousValue !== undefined) updateData.previousValue = data.previousValue;
        if (data.isHealthy !== undefined) updateData.isHealthy = data.isHealthy;
        if (data.calculationFrequency !== undefined) updateData.calculationFrequency = data.calculationFrequency;
        if (data.alertEnabled !== undefined) updateData.alertEnabled = data.alertEnabled;
        if (data.alertThreshold !== undefined) updateData.alertThreshold = data.alertThreshold;
        if (data.metadata !== undefined) updateData.metadata = data.metadata;

        const kpi = await p.kPI.update({
          where: { id },
          data: updateData,
        });

        return reply.send({
          success: true,
          data: kpi,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to update KPI',
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // CUSTOM REPORTS
  // --------------------------------------------------------------------------

  // GET /custom-reports - List custom reports
  fastify.get(
    '/custom-reports',
    { preHandler: [validateQuery(customReportListSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const query = customReportListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {
          OR: [
            { createdBy: user.id },
            { isPublic: true },
            { sharedWith: { has: user.id } },
          ],
        };
        if (query.isScheduled !== undefined) where.isScheduled = query.isScheduled;

        const [reports, total] = await Promise.all([
          p.customReport.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit,
          }),
          p.customReport.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: reports,
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
          error: error.message || 'Failed to list custom reports',
        });
      }
    }
  );

  // POST /custom-reports - Create custom report
  fastify.post(
    '/custom-reports',
    { preHandler: [validateBody(customReportCreateSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const data = customReportCreateSchema.parse(request.body);

        const report = await p.customReport.create({
          data: {
            name: data.name,
            description: data.description,
            createdBy: user.id,
            metrics: data.metrics,
            filters: data.filters,
            groupBy: data.groupBy || [],
            visualization: data.visualization || 'table',
            isScheduled: data.isScheduled ?? false,
            scheduleFrequency: data.scheduleFrequency,
            scheduleDayOfWeek: data.scheduleDayOfWeek,
            scheduleDayOfMonth: data.scheduleDayOfMonth,
            isPublic: data.isPublic ?? false,
            sharedWith: data.sharedWith || [],
            metadata: data.metadata || undefined,
          },
        });

        return reply.code(201).send({
          success: true,
          data: report,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to create custom report',
        });
      }
    }
  );

  // GET /custom-reports/:id - Single custom report
  fastify.get(
    '/custom-reports/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const report = await p.customReport.findUnique({
          where: { id },
        });

        if (!report) {
          return reply.code(404).send({
            success: false,
            error: 'Custom report not found',
          });
        }

        // Check access: owner, public, or shared with user
        if (
          report.createdBy !== user.id &&
          !report.isPublic &&
          !(report.sharedWith || []).includes(user.id)
        ) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        return reply.send({
          success: true,
          data: report,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to get custom report',
        });
      }
    }
  );

  // DELETE /custom-reports/:id - Delete custom report
  fastify.delete(
    '/custom-reports/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const report = await p.customReport.findUnique({
          where: { id },
          select: { id: true, createdBy: true },
        });

        if (!report) {
          return reply.code(404).send({
            success: false,
            error: 'Custom report not found',
          });
        }

        if (report.createdBy !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Only the report creator can delete it',
          });
        }

        await p.customReport.delete({ where: { id } });

        return reply.send({
          success: true,
          message: 'Custom report deleted',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to delete custom report',
        });
      }
    }
  );
}
