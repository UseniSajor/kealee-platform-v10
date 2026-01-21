/**
 * Task Routes for PM Workspace
 * Handles task management, assignment, and tracking
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, requirePM } from '../modules/auth/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  assignedTo: z.string().uuid().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const addCommentSchema = z.object({
  message: z.string().min(1),
});

export async function taskRoutes(fastify: FastifyInstance) {
  // Require PM or Admin role
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requirePM(request, reply);
  });

  // GET /api/tasks - Get all tasks (with filters)
  fastify.get(
    '/',
    {
      preHandler: [
        validateQuery(
          z.object({
            status: z.string().optional(),
            priority: z.string().optional(),
            search: z.string().optional(),
            sortBy: z.enum(['dueDate', 'priority', 'createdAt']).optional(),
            clientId: z.string().uuid().optional(),
            projectId: z.string().uuid().optional(),
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
          assignedTo: user.id,
        };

        if (query.status && query.status !== 'all') {
          where.status = query.status;
        }

        if (query.priority && query.priority !== 'all') {
          where.priority = query.priority;
        }

        if (query.clientId) {
          where.clientId = query.clientId;
        }

        if (query.projectId) {
          where.projectId = query.projectId;
        }

        if (query.search) {
          where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        const orderBy: any = {};
        if (query.sortBy === 'dueDate') {
          orderBy.dueDate = 'asc';
        } else if (query.sortBy === 'priority') {
          orderBy.priority = 'desc';
        } else {
          orderBy.createdAt = 'desc';
        }

        const pageNum = query.page ? parseInt(query.page) : 1;
        const limitNum = query.limit ? parseInt(query.limit) : 20;
        const skip = (pageNum - 1) * limitNum;

        const [tasks, total] = await Promise.all([
          prisma.task.findMany({
            where,
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy,
            skip,
            take: limitNum,
          }),
          prisma.task.count({ where }),
        ]);

        return {
          tasks,
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
          error: error.message || 'Failed to fetch tasks',
        });
      }
    }
  );

  // GET /api/tasks/:id - Get single task
  fastify.get(
    '/:id',
    {
      preHandler: [validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const task = await prisma.task.findFirst({
          where: {
            id,
            assignedTo: user.id,
          },
          include: {
            project: true,
            client: true,
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!task) {
          return reply.code(404).send({
            error: 'Task not found',
          });
        }

        return { task };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to fetch task',
        });
      }
    }
  );

  // POST /api/tasks - Create task
  fastify.post(
    '/',
    {
      preHandler: [validateBody(createTaskSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const data = createTaskSchema.parse(request.body);

        const task = await prisma.task.create({
          data: {
            ...data,
            assignedTo: data.assignedTo || user.id,
            createdBy: user.id,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          },
          include: {
            client: true,
          },
        });

        return reply.code(201).send({ task });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to create task',
        });
      }
    }
  );

  // PATCH /api/tasks/:id - Update task
  fastify.patch(
    '/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateTaskSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const data = updateTaskSchema.parse(request.body);

        // Verify access
        const existing = await prisma.task.findFirst({
          where: {
            id,
            OR: [
              { assignedTo: user.id },
              { createdBy: user.id },
            ],
          },
        });

        if (!existing) {
          return reply.code(404).send({
            error: 'Task not found',
          });
        }

        const updateData: any = { ...data };
        if (data.dueDate) {
          updateData.dueDate = new Date(data.dueDate);
        }

        const task = await prisma.task.update({
          where: { id },
          data: updateData,
          include: {
            client: true,
          },
        });

        return { task };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to update task',
        });
      }
    }
  );

  // DELETE /api/tasks/:id - Delete task
  fastify.delete(
    '/:id',
    {
      preHandler: [validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const existing = await prisma.task.findFirst({
          where: {
            id,
            createdBy: user.id,
          },
        });

        if (!existing) {
          return reply.code(404).send({
            error: 'Task not found',
          });
        }

        await prisma.task.delete({ where: { id } });

        return reply.code(204).send();
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to delete task',
        });
      }
    }
  );

  // POST /api/tasks/:id/comments - Add comment to task
  fastify.post(
    '/:id/comments',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addCommentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const { message } = addCommentSchema.parse(request.body);

        // Verify task access
        const task = await prisma.task.findFirst({
          where: {
            id,
            OR: [
              { assignedTo: user.id },
              { createdBy: user.id },
            ],
          },
        });

        if (!task) {
          return reply.code(404).send({
            error: 'Task not found',
          });
        }

        const comment = await prisma.taskComment.create({
          data: {
            taskId: id,
            userId: user.id,
            message,
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        });

        return reply.code(201).send({ comment });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to add comment',
        });
      }
    }
  );
}

