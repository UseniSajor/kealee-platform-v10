/**
 * Daily Log & Photo Routes
 * CRUD operations for site daily logs and construction photos
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS — Daily Logs
// ============================================================================

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const projectIdParamSchema = z.object({
  projectId: z.string().uuid(),
});

const dailyLogListSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  projectId: z.string().uuid().optional(),
  contractorId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const dailyLogCreateSchema = z.object({
  projectId: z.string().uuid(),
  workPerformed: z.string().min(1),
  date: z.string().datetime().optional(),
  crewCount: z.number().int().min(0).optional(),
  hoursWorked: z.number().min(0).optional(),
  weather: z.string().optional(),
  temperature: z.string().optional(),
  progressNotes: z.string().optional(),
  issues: z.string().optional(),
  safetyIncidents: z.string().optional(),
  materialsDelivered: z.string().optional(),
  equipmentUsed: z.string().optional(),
  subsOnSite: z.array(z.string()).optional(),
  photoIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const dailyLogUpdateSchema = z.object({
  workPerformed: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  crewCount: z.number().int().min(0).optional(),
  hoursWorked: z.number().min(0).optional(),
  weather: z.string().optional(),
  temperature: z.string().optional(),
  progressNotes: z.string().optional(),
  issues: z.string().optional(),
  safetyIncidents: z.string().optional(),
  materialsDelivered: z.string().optional(),
  equipmentUsed: z.string().optional(),
  subsOnSite: z.array(z.string()).optional(),
  photoIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// ZOD SCHEMAS — Photos
// ============================================================================

const photoListSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  projectId: z.string().uuid().optional(),
  category: z.string().optional(),
});

const photoCreateSchema = z.object({
  projectId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().optional(),
  category: z.enum(['PROGRESS', 'INSPECTION', 'ISSUE', 'COMPLETION']).optional(),
  takenAt: z.string().datetime().optional(),
  takenBy: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// DAILY LOG ROUTES
// ============================================================================

export async function dailyLogRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // GET / - List daily logs with filters and pagination
  fastify.get(
    '/',
    { preHandler: [validateQuery(dailyLogListSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const query = dailyLogListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.projectId) {
          where.projectId = query.projectId;
        }
        if (query.contractorId) {
          where.contractorId = query.contractorId;
        }
        if (query.startDate || query.endDate) {
          where.date = {};
          if (query.startDate) {
            where.date.gte = new Date(query.startDate);
          }
          if (query.endDate) {
            where.date.lte = new Date(query.endDate);
          }
        }

        const [logs, total] = await Promise.all([
          p.dailyLog.findMany({
            where,
            include: {
              project: { select: { id: true, name: true } },
              contractor: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { date: 'desc' },
            skip,
            take: limit,
          }),
          p.dailyLog.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: logs,
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
          error: sanitizeErrorMessage(error, 'Failed to list daily logs'),
        });
      }
    }
  );

  // GET /:id - Get single daily log
  fastify.get(
    '/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const log = await p.dailyLog.findUnique({
          where: { id },
          include: {
            project: { select: { id: true, name: true } },
            contractor: { select: { id: true, fullName: true, email: true } },
          },
        });

        if (!log) {
          return reply.code(404).send({
            success: false,
            error: 'Daily log not found',
          });
        }

        return reply.send({
          success: true,
          data: log,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get daily log'),
        });
      }
    }
  );

  // POST / - Create daily log (contractorId from auth user)
  fastify.post(
    '/',
    { preHandler: [validateBody(dailyLogCreateSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const data = dailyLogCreateSchema.parse(request.body);

        const log = await p.dailyLog.create({
          data: {
            projectId: data.projectId,
            contractorId: user.id,
            date: data.date ? new Date(data.date) : new Date(),
            workPerformed: data.workPerformed,
            crewCount: data.crewCount,
            hoursWorked: data.hoursWorked,
            weather: data.weather,
            temperature: data.temperature,
            progressNotes: data.progressNotes,
            issues: data.issues,
            safetyIncidents: data.safetyIncidents,
            materialsDelivered: data.materialsDelivered,
            equipmentUsed: data.equipmentUsed,
            subsOnSite: data.subsOnSite || [],
            photoIds: data.photoIds || [],
            metadata: data.metadata || undefined,
          },
          include: {
            project: { select: { id: true, name: true } },
            contractor: { select: { id: true, fullName: true, email: true } },
          },
        });

        return reply.code(201).send({
          success: true,
          data: log,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create daily log'),
        });
      }
    }
  );

  // PATCH /:id - Update daily log
  fastify.patch(
    '/:id',
    {
      preHandler: [
        validateParams(idParamSchema),
        validateBody(dailyLogUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);
        const data = dailyLogUpdateSchema.parse(request.body);

        const existing = await p.dailyLog.findUnique({
          where: { id },
          select: { id: true, contractorId: true },
        });

        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Daily log not found',
          });
        }

        if (existing.contractorId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied — only the log creator can update this entry',
          });
        }

        const updateData: any = { ...data };
        if (data.date) {
          updateData.date = new Date(data.date);
        }

        const log = await p.dailyLog.update({
          where: { id },
          data: updateData,
          include: {
            project: { select: { id: true, name: true } },
            contractor: { select: { id: true, fullName: true, email: true } },
          },
        });

        return reply.send({
          success: true,
          data: log,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update daily log'),
        });
      }
    }
  );

  // DELETE /:id - Delete daily log (owner only)
  fastify.delete(
    '/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const existing = await p.dailyLog.findUnique({
          where: { id },
          select: { id: true, contractorId: true },
        });

        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Daily log not found',
          });
        }

        if (existing.contractorId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied — only the log creator can delete this entry',
          });
        }

        await p.dailyLog.delete({
          where: { id },
        });

        return reply.send({
          success: true,
          message: 'Daily log deleted',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to delete daily log'),
        });
      }
    }
  );

  // GET /project/:projectId/summary - Summary stats for a project
  fastify.get(
    '/project/:projectId/summary',
    { preHandler: [validateParams(projectIdParamSchema)] },
    async (request, reply) => {
      try {
        const { projectId } = projectIdParamSchema.parse(request.params);

        const [totalLogs, aggregates] = await Promise.all([
          p.dailyLog.count({ where: { projectId } }),
          p.dailyLog.aggregate({
            where: { projectId },
            _avg: { crewCount: true, hoursWorked: true },
            _sum: { hoursWorked: true },
          }),
        ]);

        return reply.send({
          success: true,
          data: {
            totalLogs,
            avgCrewCount: aggregates._avg.crewCount,
            avgHoursWorked: aggregates._avg.hoursWorked,
            totalHoursWorked: aggregates._sum.hoursWorked,
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get project summary'),
        });
      }
    }
  );
}

// ============================================================================
// PHOTO ROUTES
// ============================================================================

export async function photoRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // GET / - List photos with filters and pagination
  fastify.get(
    '/',
    { preHandler: [validateQuery(photoListSchema)] },
    async (request, reply) => {
      try {
        const query = photoListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.projectId) {
          where.projectId = query.projectId;
        }
        if (query.category) {
          where.category = query.category;
        }

        const [photos, total] = await Promise.all([
          p.photo.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          p.photo.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: photos,
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
          error: sanitizeErrorMessage(error, 'Failed to list photos'),
        });
      }
    }
  );

  // GET /:id - Get single photo
  fastify.get(
    '/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const photo = await p.photo.findUnique({
          where: { id },
        });

        if (!photo) {
          return reply.code(404).send({
            success: false,
            error: 'Photo not found',
          });
        }

        return reply.send({
          success: true,
          data: photo,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get photo'),
        });
      }
    }
  );

  // POST / - Create photo record
  fastify.post(
    '/',
    { preHandler: [validateBody(photoCreateSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const data = photoCreateSchema.parse(request.body);

        const photo = await p.photo.create({
          data: {
            projectId: data.projectId,
            visitId: data.visitId,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            caption: data.caption,
            category: data.category,
            takenAt: data.takenAt ? new Date(data.takenAt) : undefined,
            takenBy: data.takenBy || user.id,
            metadata: data.metadata || undefined,
          },
        });

        return reply.code(201).send({
          success: true,
          data: photo,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create photo'),
        });
      }
    }
  );

  // DELETE /:id - Delete photo
  fastify.delete(
    '/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const existing = await p.photo.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Photo not found',
          });
        }

        await p.photo.delete({
          where: { id },
        });

        return reply.send({
          success: true,
          message: 'Photo deleted',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to delete photo'),
        });
      }
    }
  );
}
