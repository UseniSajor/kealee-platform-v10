/**
 * Permit Routes
 * Handles permit applications, AI review, and status tracking
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { prisma } from '@kealee/database';
import { reviewPermitWithAI } from '../services/ai.service';

const createPermitSchema = z.object({
  address: z.string().min(1),
  jurisdiction: z.string().min(1),
  permitTypes: z.array(z.enum(['building', 'electrical', 'plumbing', 'mechanical'])),
  projectDetails: z.record(z.any()),
  applicantInfo: z.object({
    name: z.string(),
    licenseNumber: z.string().optional(),
    contactInfo: z.record(z.string()),
  }),
});

export async function permitRoutes(fastify: FastifyInstance) {
  // GET /api/permits - Get all permits for user
  fastify.get(
    '/',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user;

        const permits = await prisma.permit.findMany({
          where: { applicantId: user.id },
          include: {
            aiReviews: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return { permits };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to fetch permits',
        });
      }
    }
  );

  // POST /api/permits - Create permit application
  fastify.post(
    '/',
    {
      preHandler: [authenticateUser, validateBody(createPermitSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const data = createPermitSchema.parse(request.body);

        const permit = await prisma.permit.create({
          data: {
            jurisdictionId: data.jurisdiction,
            applicantId: user.id,
            applicantInfo: data.applicantInfo,
            status: 'draft',
            permitTypes: data.permitTypes,
          },
        });

        return reply.code(201).send({ permit });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to create permit',
        });
      }
    }
  );

  // GET /api/permits/:id - Get single permit
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const permit = await prisma.permit.findFirst({
          where: {
            id,
            applicantId: user.id,
          },
          include: {
            aiReviews: {
              orderBy: { createdAt: 'desc' },
            },
            jurisdiction: true,
          },
        });

        if (!permit) {
          return reply.code(404).send({
            error: 'Permit not found',
          });
        }

        return { permit };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to fetch permit',
        });
      }
    }
  );

  // POST /api/permits/:id/ai-review - AI review permit documents
  fastify.post(
    '/:id/ai-review',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const { documentIds } = (request.body as any) || {};

        const permit = await prisma.permit.findFirst({
          where: {
            id,
            applicantId: user.id,
          },
          include: {
            documents: documentIds
              ? {
                  where: {
                    id: { in: documentIds },
                  },
                }
              : true,
            jurisdiction: true,
          },
        });

        if (!permit) {
          return reply.code(404).send({
            error: 'Permit not found',
          });
        }

        // Run AI review
        const review = await reviewPermitWithAI(permit);

        // Save review results
        const aiReview = await (prisma as any).permitReview.create({
          data: {
            applicationId: id,
            reviewerType: 'AI',
            status: 'completed',
            score: review.score,
            issues: review.issues,
            suggestions: review.suggestions,
            metadata: {
              reviewType: 'ai_automated',
              model: 'anthropic-claude',
            },
          },
        });

        return { aiReview, review };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to review permit',
        });
      }
    }
  );

  // POST /api/permits/:id/submit - Submit permit
  fastify.post(
    '/:id/submit',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };

        const permit = await prisma.permit.findFirst({
          where: {
            id,
            applicantId: user.id,
          },
        });

        if (!permit) {
          return reply.code(404).send({
            error: 'Permit not found',
          });
        }

        if ((permit as any).status !== 'draft') {
          return reply.code(400).send({
            error: 'Permit already submitted',
          });
        }

        const updated = await prisma.permit.update({
          where: { id },
          data: {
            submittedAt: new Date(),
          },
        });

        // TODO: Send to jurisdiction API
        // TODO: Send confirmation email

        return { permit: updated };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: error.message || 'Failed to submit permit',
        });
      }
    }
  );
}

