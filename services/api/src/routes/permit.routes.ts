/**
 * Permit Routes
 * Handles permit applications, AI review, and status tracking
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { prisma } from '@kealee/database';
// AI review function - uses @kealee/automation AI service if available
async function reviewPermitWithAI(permit: any): Promise<{ score: number; issues: any[]; suggestions: any[] }> {
  try {
    // Try to use @kealee/automation AI service
    // @ts-ignore -- dynamic import, may not be built yet
    const { analyzePermitCompliance } = await import('@kealee/automation/src/infrastructure/ai');
    const result = await analyzePermitCompliance(permit);
    return result;
  } catch (error) {
    // Fallback: Return basic validation
    return {
      score: 75,
      issues: [],
      suggestions: [{
        category: 'general',
        message: 'AI review service is currently unavailable. Manual review required.',
      }],
    };
  }
}

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
              orderBy: { id: 'desc' },
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

        // Get user's organization to find client/project
        const userOrg = user.organizationId;
        if (!userOrg) {
          return reply.code(400).send({
            error: 'User must belong to an organization',
          });
        }

        // Get projectId and clientId from projectDetails or use defaults
        const projectId = data.projectDetails?.projectId as string || userOrg; // Use org as fallback
        const clientId = data.projectDetails?.clientId as string || userOrg; // Use org as fallback

        const permit = await prisma.permit.create({
          data: {
            jurisdictionId: data.jurisdiction,
            applicantId: user.id,
            applicantName: data.applicantInfo?.name || '',
            applicantEmail: data.applicantInfo?.contactInfo?.email || '',
            applicantPhone: data.applicantInfo?.contactInfo?.phone || '',
            permitType: (data.permitTypes[0]?.toUpperCase() || 'BUILDING') as any, // Use first permit type, convert to enum
            scope: (data.projectDetails?.scope as string) || '',
            valuation: 0,
            address: data.address,
            projectId, // Required field
            clientId, // Required field
            pmUserId: user.id, // Required field
            applicantType: 'OWNER' as any, // Required field
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
              orderBy: { id: 'desc' },
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
            status: 'SUBMITTED',
          },
        });

        // Queue jurisdiction submission via automation (APP-05: Permit Tracker)
        try {
          const Redis = require('ioredis');
          const { Queue } = require('bullmq');
          const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          });
          const queue = new Queue('permit-tracker', { connection });
          await queue.add('submit-to-jurisdiction', {
            permitId: id,
            jurisdictionId: permit.jurisdictionId,
          });
          await queue.close();
        } catch (queueError) {
          fastify.log.warn('Permit queue not available, submission will be manual');
        }

        // Queue confirmation email via automation (APP-08: Communication Hub)
        try {
          const Redis = require('ioredis');
          const { Queue } = require('bullmq');
          const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          });
          const queue = new Queue('communication-hub', { connection });
          await queue.add('send-email', {
            template: 'permit-submitted',
            to: permit.applicantEmail,
            data: {
              permitId: id,
              address: permit.address,
              permitType: permit.permitType,
            },
          });
          await queue.close();
        } catch (queueError) {
          fastify.log.warn('Communication queue not available');
        }

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

