/**
 * Job Management Routes
 * Handles JobQueue and JobSchedule models
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

// JobQueue
const jobListSchema = z.object({
  status: z.enum(['WAITING', 'ACTIVE', 'COMPLETED', 'FAILED', 'DELAYED', 'PAUSED']).optional(),
  queueName: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// JobSchedule
const scheduleCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  queueName: z.string().min(1),
  cronExpression: z.string().min(1),
  jobData: z.record(z.any()),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const scheduleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  cronExpression: z.string().min(1).optional(),
  jobData: z.record(z.any()).optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const scheduleListSchema = z.object({
  queueName: z.string().optional(),
  isActive: z.string().transform((v) => v === 'true').optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function jobManagementRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // --------------------------------------------------------------------------
  // JOB QUEUE
  // --------------------------------------------------------------------------

  // GET /jobs - List jobs with filtering and pagination
  fastify.get(
    '/jobs',
    { preHandler: [validateQuery(jobListSchema)] },
    async (request, reply) => {
      try {
        const query = jobListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.queueName) where.queueName = query.queueName;

        const [jobs, total] = await Promise.all([
          p.jobQueue.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          p.jobQueue.count({ where }),
        ]);

        return reply.send({
          success: true,
          data: jobs,
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
          error: error.message || 'Failed to list jobs',
        });
      }
    }
  );

  // GET /jobs/:id - Single job
  fastify.get(
    '/jobs/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const job = await p.jobQueue.findUnique({
          where: { id },
        });

        if (!job) {
          return reply.code(404).send({
            success: false,
            error: 'Job not found',
          });
        }

        return reply.send({
          success: true,
          data: job,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to get job',
        });
      }
    }
  );

  // POST /jobs/:id/retry - Retry a failed job
  fastify.post(
    '/jobs/:id/retry',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const job = await p.jobQueue.findUnique({ where: { id } });
        if (!job) {
          return reply.code(404).send({
            success: false,
            error: 'Job not found',
          });
        }

        if (job.status !== 'FAILED') {
          return reply.code(400).send({
            success: false,
            error: 'Only failed jobs can be retried',
          });
        }

        if (job.attempts >= job.maxAttempts) {
          return reply.code(400).send({
            success: false,
            error: `Job has exceeded max attempts (${job.maxAttempts})`,
          });
        }

        const updated = await p.jobQueue.update({
          where: { id },
          data: {
            status: 'WAITING',
            error: null,
            failedAt: null,
            attempts: { increment: 1 },
          },
        });

        return reply.send({
          success: true,
          data: updated,
          message: 'Job queued for retry',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to retry job',
        });
      }
    }
  );

  // DELETE /jobs/:id - Cancel a job
  fastify.delete(
    '/jobs/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const job = await p.jobQueue.findUnique({ where: { id } });
        if (!job) {
          return reply.code(404).send({
            success: false,
            error: 'Job not found',
          });
        }

        if (job.status === 'ACTIVE') {
          return reply.code(400).send({
            success: false,
            error: 'Cannot cancel an active job. Wait for it to complete or fail.',
          });
        }

        if (job.status === 'COMPLETED') {
          return reply.code(400).send({
            success: false,
            error: 'Cannot cancel a completed job',
          });
        }

        await p.jobQueue.delete({ where: { id } });

        return reply.send({
          success: true,
          message: 'Job cancelled and removed',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to cancel job',
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // JOB SCHEDULES
  // --------------------------------------------------------------------------

  // GET /schedules - List job schedules
  fastify.get(
    '/schedules',
    { preHandler: [validateQuery(scheduleListSchema)] },
    async (request, reply) => {
      try {
        const query = scheduleListSchema.parse(request.query);

        const where: any = {};
        if (query.queueName) where.queueName = query.queueName;
        if (query.isActive !== undefined) where.isActive = query.isActive;

        const schedules = await p.jobSchedule.findMany({
          where,
          orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        });

        return reply.send({
          success: true,
          data: schedules,
          count: schedules.length,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to list schedules',
        });
      }
    }
  );

  // POST /schedules - Create schedule
  fastify.post(
    '/schedules',
    { preHandler: [validateBody(scheduleCreateSchema)] },
    async (request, reply) => {
      try {
        const data = scheduleCreateSchema.parse(request.body);

        const schedule = await p.jobSchedule.create({
          data: {
            name: data.name,
            description: data.description,
            queueName: data.queueName,
            cronExpression: data.cronExpression,
            jobData: data.jobData,
            timezone: data.timezone || 'America/New_York',
            isActive: data.isActive ?? true,
          },
        });

        return reply.code(201).send({
          success: true,
          data: schedule,
        });
      } catch (error: any) {
        fastify.log.error(error);
        if (error.code === 'P2002') {
          return reply.code(409).send({
            success: false,
            error: 'A schedule with this name and queue already exists',
          });
        }
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to create schedule',
        });
      }
    }
  );

  // PATCH /schedules/:id - Update schedule
  fastify.patch(
    '/schedules/:id',
    {
      preHandler: [
        validateParams(idParamSchema),
        validateBody(scheduleUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);
        const data = scheduleUpdateSchema.parse(request.body);

        const existing = await p.jobSchedule.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Schedule not found',
          });
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.cronExpression !== undefined) updateData.cronExpression = data.cronExpression;
        if (data.jobData !== undefined) updateData.jobData = data.jobData;
        if (data.timezone !== undefined) updateData.timezone = data.timezone;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const schedule = await p.jobSchedule.update({
          where: { id },
          data: updateData,
        });

        return reply.send({
          success: true,
          data: schedule,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message || 'Failed to update schedule',
        });
      }
    }
  );

  // DELETE /schedules/:id - Delete schedule
  fastify.delete(
    '/schedules/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const existing = await p.jobSchedule.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Schedule not found',
          });
        }

        await p.jobSchedule.delete({ where: { id } });

        return reply.send({
          success: true,
          message: 'Schedule deleted',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to delete schedule',
        });
      }
    }
  );

  // POST /schedules/:id/pause - Pause a schedule
  fastify.post(
    '/schedules/:id/pause',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const existing = await p.jobSchedule.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Schedule not found',
          });
        }

        if (!existing.isActive) {
          return reply.code(400).send({
            success: false,
            error: 'Schedule is already paused',
          });
        }

        const schedule = await p.jobSchedule.update({
          where: { id },
          data: { isActive: false },
        });

        return reply.send({
          success: true,
          data: schedule,
          message: 'Schedule paused',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to pause schedule',
        });
      }
    }
  );

  // POST /schedules/:id/resume - Resume a schedule
  fastify.post(
    '/schedules/:id/resume',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const { id } = idParamSchema.parse(request.params);

        const existing = await p.jobSchedule.findUnique({ where: { id } });
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Schedule not found',
          });
        }

        if (existing.isActive) {
          return reply.code(400).send({
            success: false,
            error: 'Schedule is already active',
          });
        }

        const schedule = await p.jobSchedule.update({
          where: { id },
          data: { isActive: true },
        });

        return reply.send({
          success: true,
          data: schedule,
          message: 'Schedule resumed',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to resume schedule',
        });
      }
    }
  );
}
