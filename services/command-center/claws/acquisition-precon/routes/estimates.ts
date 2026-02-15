import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

export function estimateRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // -----------------------------------------------------------------------
    // List estimates (optionally filtered by project)
    // -----------------------------------------------------------------------
    fastify.get('/', async (request) => {
      const { projectId } = request.query as { projectId?: string };

      const estimates = await prisma.estimate.findMany({
        where: projectId ? { projectId } : undefined,
        include: {
          sections: {
            include: { lineItems: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: estimates };
    });

    // -----------------------------------------------------------------------
    // Get single estimate with full breakdown
    // -----------------------------------------------------------------------
    fastify.get('/:id', async (request) => {
      const { id } = request.params as { id: string };

      const estimate = await prisma.estimate.findUnique({
        where: { id },
        include: {
          sections: {
            include: { lineItems: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!estimate) {
        return { error: 'Estimate not found', statusCode: 404 };
      }

      return { data: estimate };
    });

    // -----------------------------------------------------------------------
    // Create estimate
    // -----------------------------------------------------------------------
    fastify.post('/', async (request) => {
      const body = request.body as {
        projectId: string;
        organizationId: string;
        name: string;
        type?: string;
      };

      const estimate = await prisma.estimate.create({
        data: {
          projectId: body.projectId,
          organizationId: body.organizationId,
          name: body.name,
          status: 'DRAFT',
          type: body.type ?? 'CONCEPTUAL',
        },
      });

      return { data: estimate };
    });

    // -----------------------------------------------------------------------
    // Update estimate
    // -----------------------------------------------------------------------
    fastify.put('/:id', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown>;

      const estimate = await prisma.estimate.update({
        where: { id },
        data: body,
      });

      return { data: estimate };
    });

    // -----------------------------------------------------------------------
    // Delete estimate
    // -----------------------------------------------------------------------
    fastify.delete('/:id', async (request) => {
      const { id } = request.params as { id: string };

      await prisma.estimate.delete({ where: { id } });

      return { data: { ok: true } };
    });
  };
}
