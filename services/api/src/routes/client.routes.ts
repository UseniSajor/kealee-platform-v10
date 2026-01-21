/**
 * Client Routes for PM Workspace
 * Handles client management, assignment, and workload tracking
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, requirePM } from '../modules/auth/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';

const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  organizationId: z.string().uuid(),
});

const updateClientSchema = createClientSchema.partial();

const requestAssignmentSchema = z.object({
  clientId: z.string().uuid(),
  estimatedWorkload: z.number().optional(),
});

export async function clientRoutes(fastify: FastifyInstance) {
  // Require PM or Admin role for all client routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requirePM(request, reply);
  });

  // GET /api/clients - Get all clients for PM
  fastify.get(
    '/',
    {
      preHandler: [
        validateQuery(
          z.object({
            status: z.enum(['all', 'active', 'inactive']).optional(),
            search: z.string().optional(),
            page: z.string().optional(),
            limit: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { status, search, page, limit } = request.query as {
          status?: string;
          search?: string;
          page?: string;
          limit?: string;
        };

        const where: any = {
          assignedPM: user.id,
        };

        if (status && status !== 'all') {
          where.status = status.toUpperCase();
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }

        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 20;
        const skip = (pageNum - 1) * limitNum;

        const [clients, total] = await Promise.all([
          prisma.client.findMany({
            where,
            include: {
              _count: {
                select: {
                  projects: true,
                },
              },
              projects: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
                take: 5,
              },
            },
            orderBy: { name: 'asc' },
            skip,
            take: limitNum,
          }),
          prisma.client.count({ where }),
        ]);

        // Calculate stats for each client
        const clientsWithStats = await Promise.all(
          clients.map(async (client) => {
            const projects = await prisma.project.findMany({
              where: { clientId: client.id },
              include: {
                payments: true,
              },
            });

            const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
            const totalRevenue = projects.reduce(
              (sum, p) => sum + p.payments.reduce((pSum, payment) => pSum + payment.amount, 0),
              0
            );

            return {
              ...client,
              activeProjects,
              totalRevenue,
            };
          })
        );

        return {
          clients: clientsWithStats,
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
          error: error.message || 'Failed to fetch clients',
        });
      }
    }
  );

  // GET /api/clients/unassigned - Get unassigned clients
  fastify.get(
    '/unassigned',
    async (request, reply) => {
      try {
        const clients = await prisma.client.findMany({
          where: {
            assignedPM: null,
          },
          include: {
            _count: {
              select: {
                projects: true,
              },
            },
            projects: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        });

        // Calculate estimated workload
        const clientsWithWorkload = clients.map((client) => {
          // Rough estimate: 2 hours per project per week
          const projectCount = client._count.projects;
          const activeProjects = client.projects.filter(p => p.status === 'ACTIVE').length;
          const estimatedWorkload = activeProjects * 2; // hours per week

          return {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            projectCount,
            activeProjects,
            estimatedWorkload,
          };
        });

        return { clients: clientsWithWorkload };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to fetch unassigned clients',
        });
      }
    }
  );

  // POST /api/clients/request-assignment - Request client assignment
  fastify.post(
    '/request-assignment',
    {
      preHandler: [validateBody(requestAssignmentSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { clientId, estimatedWorkload } = request.body as {
          clientId: string;
          estimatedWorkload?: number;
        };

        // Check if client exists and is unassigned
        const client = await prisma.client.findFirst({
          where: {
            id: clientId,
            assignedPM: null,
          },
        });

        if (!client) {
          return reply.code(404).send({
            error: 'Client not found or already assigned',
          });
        }

        // Get current PM workload
        const currentTasks = await prisma.task.count({
          where: {
            assignedTo: user.id,
            status: { notIn: ['completed'] },
          },
        });

        const currentClients = await prisma.client.count({
          where: {
            assignedPM: user.id,
            status: 'ACTIVE',
          },
        });

        const currentWorkload = (currentTasks * 2) + (currentClients * 1); // hours per week
        const newWorkload = estimatedWorkload || (client._count?.projects || 0) * 2;

        // Create assignment request
        const assignmentRequest = await prisma.assignmentRequest.create({
          data: {
            clientId,
            pmId: user.id,
            status: 'pending',
            estimatedWorkload: newWorkload,
            currentWorkload,
            metadata: {
              requestType: 'client_assignment',
            },
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // TODO: Notify admin of assignment request

        return reply.code(201).send({
          request: assignmentRequest,
          workloadImpact: {
            current: currentWorkload,
            additional: newWorkload,
            total: currentWorkload + newWorkload,
            maxCapacity: 40, // 40 hours per week
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to request assignment',
        });
      }
    }
  );

  // GET /api/clients/:id - Get single client
  fastify.get(
    '/:id',
    {
      preHandler: [validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const client = await prisma.client.findFirst({
          where: {
            id,
            assignedPM: user.id,
          },
          include: {
            projects: {
              include: {
                milestones: {
                  orderBy: { order: 'asc' },
                },
                payments: true,
              },
              orderBy: { createdAt: 'desc' },
            },
            // Client model doesn't have direct org relation - org is on Project
          },
        });

        if (!client) {
          return reply.code(404).send({
            error: 'Client not found',
          });
        }

        return { client };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to fetch client',
        });
      }
    }
  );

  // POST /api/clients - Create new client
  fastify.post(
    '/',
    {
      preHandler: [validateBody(createClientSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const data = createClientSchema.parse(request.body);

        const client = await prisma.client.create({
          data: {
            ...data,
            assignedPM: user.id,
            status: 'ACTIVE',
          },
        });

        return reply.code(201).send({ client });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to create client',
        });
      }
    }
  );

  // PATCH /api/clients/:id - Update client
  fastify.patch(
    '/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateClientSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const data = updateClientSchema.parse(request.body);

        // Verify ownership
        const existing = await prisma.client.findFirst({
          where: { id, assignedPM: user.id },
        });

        if (!existing) {
          return reply.code(404).send({
            error: 'Client not found',
          });
        }

        const client = await prisma.client.update({
          where: { id },
          data,
        });

        return { client };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to update client',
        });
      }
    }
  );
}

