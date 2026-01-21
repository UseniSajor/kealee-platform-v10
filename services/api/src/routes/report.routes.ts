/**
 * Report Routes for PM Workspace
 * Handles report generation (weekly, monthly, custom)
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, requirePM } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import { prisma } from '@kealee/database';

const generateReportSchema = z.object({
  type: z.enum(['weekly', 'monthly', 'custom']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function reportRoutes(fastify: FastifyInstance) {
  // Require PM or Admin role
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requirePM(request, reply);
  });

  // GET /api/reports - List all reports for PM
  fastify.get(
    '/',
    {
      preHandler: [
        validateQuery(
          z.object({
            type: z.enum(['weekly', 'monthly', 'custom']).optional(),
            page: z.string().optional(),
            limit: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const query = request.query as any;

        const where: any = {
          userId: user.id,
        };

        if (query.type) {
          where.type = query.type;
        }

        const pageNum = query.page ? parseInt(query.page) : 1;
        const limitNum = query.limit ? parseInt(query.limit) : 20;
        const skip = (pageNum - 1) * limitNum;

        const [reports, total] = await Promise.all([
          prisma.report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
          }),
          prisma.report.count({ where }),
        ]);

        return {
          reports,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to fetch reports',
        });
      }
    }
  );

  // POST /api/reports/generate - Generate new report
  fastify.post(
    '/generate',
    {
      preHandler: [validateBody(generateReportSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { type, startDate, endDate } = generateReportSchema.parse(request.body);

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Get data for report
        const [tasks, clients] = await Promise.all([
          prisma.task.findMany({
            where: {
              assignedTo: user.id,
              createdAt: {
                gte: start,
                lte: end,
              },
            },
            include: {
              client: true,
            },
          }),
          prisma.client.findMany({
            where: {
              assignedPM: user.id,
            },
          }),
        ]);

        const stats = {
          tasksCompleted: tasks.filter(t => t.status === 'completed').length,
          tasksTotal: tasks.length,
          hoursLogged: tasks.reduce((sum, t) => sum + (t.hoursLogged || 0), 0),
          clientsServed: new Set(tasks.map(t => t.clientId).filter(Boolean)).size,
          averageTaskCompletionTime: calculateAverageCompletionTime(tasks),
        };

        // Generate report
        const report = await prisma.report.create({
          data: {
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            type,
            period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
            userId: user.id,
            stats,
            data: {
              tasks,
              clients,
            },
          },
        });

        // TODO: Generate PDF using puppeteer or similar

        return {
          report: {
            id: report.id,
            title: report.title,
            type: report.type,
            period: report.period,
            stats,
            createdAt: report.createdAt,
          },
        };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to generate report',
        });
      }
    }
  );

  // GET /api/reports/:id - Get report by ID
  fastify.get(
    '/:id',
    {
      preHandler: [validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const report = await prisma.report.findFirst({
          where: {
            id,
            userId: user.id,
          },
        });

        if (!report) {
          return reply.code(404).send({
            error: 'Report not found',
          });
        }

        return { report };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to fetch report',
        });
      }
    }
  );

  // GET /api/reports/:id/download - Get report download URL
  fastify.get(
    '/:id/download',
    {
      preHandler: [validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const report = await prisma.report.findFirst({
          where: {
            id,
            userId: user.id,
          },
        });

        if (!report) {
          return reply.code(404).send({
            error: 'Report not found',
          });
        }

        // TODO: Generate PDF if not exists
        // TODO: Get download URL from S3

        return {
          downloadUrl: null, // Placeholder
          reportId: report.id,
        };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to get download URL',
        });
      }
    }
  );
}

function calculateAverageCompletionTime(tasks: any[]): number {
  const completedTasks = tasks.filter(
    t => t.status === 'completed' && t.completedAt && t.createdAt
  );

  if (completedTasks.length === 0) return 0;

  const totalTime = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.completedAt).getTime();
    return sum + (completed - created);
  }, 0);

  // Return average in hours
  return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60));
}

