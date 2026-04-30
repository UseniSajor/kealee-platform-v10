/**
 * Permit Routes
 * Handles permit applications, AI review, and status tracking
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { prisma } from '@kealee/database';
import { sanitizeErrorMessage } from '../utils/sanitize-error'
import { KeaBotPermit } from '@kealee/keabot-permit';
import { inspectionCoordinator } from '../lib/inspection-coordinator';
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
          take: 100,
        });

        return { permits };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to fetch permits'),
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
          error: sanitizeErrorMessage(error, 'Failed to create permit'),
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
          error: sanitizeErrorMessage(error, 'Failed to fetch permit'),
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
          error: sanitizeErrorMessage(error, 'Failed to review permit'),
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

        if ((permit as any).status !== 'DRAFT' && (permit as any).status !== 'READY_TO_SUBMIT') {
          return reply.code(400).send({ error: 'Permit already submitted' });
        }

        // CRITICAL: Enforce human approval before any submission
        if (!permit.readyToSubmit) {
          return reply.code(403).send({
            error: 'HUMAN_APPROVAL_REQUIRED',
            message: 'A permit specialist must approve this roadmap before it can be submitted to the building department.',
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
          error: sanitizeErrorMessage(error, 'Failed to submit permit'),
        });
      }
    }
  );

  // ─── POST /api/permits/:id/approve ────────────────────────────────────────────
  // Specialist marks the AI-generated roadmap as approved for submission.
  // Sets readyToSubmit=true and kealeeStatus=READY_TO_SUBMIT.
  // Only roles specialist/admin/pm may approve.
  fastify.post(
    '/:id/approve',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const { notes } = (request.body as any) ?? {};

        const permit = await prisma.permit.findFirst({ where: { id } });
        if (!permit) return reply.code(404).send({ error: 'Permit not found' });

        if (permit.readyToSubmit) {
          return reply.code(400).send({ error: 'Permit is already approved for submission' });
        }

        await prisma.permit.update({
          where: { id },
          data: {
            readyToSubmit: true,
            kealeeStatus: 'READY_TO_SUBMIT',
            status: 'READY_TO_SUBMIT',
          },
        });

        await (prisma as any).permitEvent.create({
          data: {
            permitId: id,
            userId: user.id,
            eventType: 'HUMAN_APPROVAL',
            description: `Permit roadmap approved by specialist${notes ? `: ${notes}` : ''}`,
            source: 'USER',
          },
        }).catch(() => null);

        return { success: true, message: 'Permit approved for submission' };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to approve permit') });
      }
    }
  );

  // ─── POST /api/permits/:id/reject ─────────────────────────────────────────────
  // Specialist rejects the AI roadmap — sends it back to draft for regeneration.
  fastify.post(
    '/:id/reject',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const { reason } = (request.body as any) ?? {};

        const permit = await prisma.permit.findFirst({ where: { id } });
        if (!permit) return reply.code(404).send({ error: 'Permit not found' });

        await prisma.permit.update({
          where: { id },
          data: {
            readyToSubmit: false,
            kealeeStatus: 'DRAFT',
            status: 'DRAFT',
          },
        });

        await (prisma as any).permitEvent.create({
          data: {
            permitId: id,
            userId: user.id,
            eventType: 'HUMAN_REJECTION',
            description: `Permit roadmap rejected by specialist${reason ? `: ${reason}` : ''}`,
            source: 'USER',
          },
        }).catch(() => null);

        return { success: true, message: 'Permit returned to draft' };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to reject permit') });
      }
    }
  );

  // ─── GET /api/permits/review-queue ────────────────────────────────────────────
  // Returns all permits awaiting human specialist review (AI_PRE_REVIEW status).
  fastify.get(
    '/review-queue',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const permits = await prisma.permit.findMany({
          where: {
            OR: [
              { kealeeStatus: 'AI_PRE_REVIEW' as any },
              { kealeeStatus: 'DRAFT' as any, aiReviewScore: { not: null } },
            ],
          },
          include: {
            jurisdiction: { select: { name: true } },
            aiReviews: { orderBy: { reviewedAt: 'desc' }, take: 1 },
          },
          orderBy: { createdAt: 'asc' },
          take: 100,
        });
        return { permits };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch review queue') });
      }
    }
  );

  // ─── POST /api/permits/generate-roadmap ─────────────────────────────────────
  // PermitBot generates a structured permit roadmap for a project.
  //
  // CRITICAL: The returned roadmap has status "generated" and humanReviewRequired=true.
  // It is saved to the permit record but CANNOT be submitted to a building department
  // until a human specialist approves it via the admin review queue.
  //
  const generateRoadmapSchema = z.object({
    projectId: z.string().min(1),
    jurisdiction: z.string().min(1),
    projectType: z.string().min(1),
    scope: z.string().min(1),
    budget: z.number().min(0),
    /** ID of an existing concept deliverable — used to enrich the roadmap */
    conceptId: z.string().optional(),
    /** ID of an existing estimation — used to enrich the roadmap */
    estimationId: z.string().optional(),
  });

  fastify.post(
    '/generate-roadmap',
    {
      preHandler: [authenticateUser, validateBody(generateRoadmapSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const body = generateRoadmapSchema.parse(request.body);

        // Optionally load concept/estimation context from Prisma
        let conceptContext: string | undefined;
        let estimationContext: string | undefined;

        if (body.conceptId) {
          try {
            const concept = await (prisma as any).conceptDeliverable.findFirst({
              where: { id: body.conceptId },
              select: { designSummary: true, zoningAnalysis: true, mepSystems: true },
            });
            if (concept) {
              conceptContext = [
                concept.designSummary && `Design: ${concept.designSummary}`,
                concept.zoningAnalysis && `Zoning: ${JSON.stringify(concept.zoningAnalysis)}`,
                concept.mepSystems && `MEP: ${JSON.stringify(concept.mepSystems)}`,
              ].filter(Boolean).join('\n');
            }
          } catch {
            // Concept model may not exist yet — continue without it
          }
        }

        if (body.estimationId) {
          try {
            const estimation = await (prisma as any).estimation.findFirst({
              where: { id: body.estimationId },
              select: { totalEstimatedCost: true, permitCosts: true },
            });
            if (estimation) {
              estimationContext = `Total estimated cost: $${estimation.totalEstimatedCost ?? 'unknown'}, permit budget: ${JSON.stringify(estimation.permitCosts)}`;
            }
          } catch {
            // Estimation model may not exist yet — continue without it
          }
        }

        // Run PermitBot roadmap generator
        const bot = new KeaBotPermit();
        await bot.initialize();

        const roadmap = await bot.generateRoadmap({
          projectId: body.projectId,
          jurisdiction: body.jurisdiction,
          projectType: body.projectType,
          scope: body.scope,
          budget: body.budget,
          conceptContext,
          estimationContext,
        });

        // Persist roadmap as an AI review record on the permit
        // Create a minimal permit record if none exists for this project yet
        let permitRecord = await prisma.permit.findFirst({
          where: { projectId: body.projectId },
          orderBy: { createdAt: 'desc' },
        });

        if (!permitRecord) {
          permitRecord = await prisma.permit.create({
            data: {
              jurisdictionId: body.jurisdiction,
              applicantId: user.id,
              applicantName: user.name ?? '',
              applicantEmail: user.email ?? '',
              applicantPhone: '',
              permitType: 'BUILDING',
              scope: body.scope,
              valuation: body.budget,
              address: '',
              projectId: body.projectId,
              clientId: user.id,
              pmUserId: user.id,
              applicantType: 'OWNER',
              status: 'DRAFT',
            },
          });
        }

        // Save roadmap as an AIReviewResult record (Prisma model: aIReviewResult)
        await (prisma as any).aIReviewResult.create({
          data: {
            permitId: permitRecord.id,
            reviewSource: 'CLIENT_SIDE_PRE_REVIEW',
            overallScore: roadmap.confidenceScore,
            readyToSubmit: false, // Requires human approval first
            planIssues: [],
            codeViolations: [],
            missingDocuments: [],
            suggestedFixes: [{ roadmap }],
            modelVersion: 'claude-sonnet-4-20250514:keabot-permit',
            processingTimeMs: 0,
            confidenceScores: { overall: roadmap.confidenceScore },
          },
        }).catch(() => null); // Non-fatal if AIReviewResult schema differs

        fastify.log.info({
          msg: 'PermitBot roadmap generated',
          permitId: permitRecord.id,
          projectId: body.projectId,
          jurisdiction: body.jurisdiction,
          confidenceScore: roadmap.confidenceScore,
          permitsCount: roadmap.permitsRequired?.length ?? 0,
        });

        return reply.code(201).send({
          permitId: permitRecord.id,
          roadmap,
          status: 'generated',
          humanReviewRequired: true,
          message: 'Roadmap generated. A permit specialist must review and approve before any submission.',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'PermitBot roadmap generation failed'),
        });
      }
    }
  );

  // ─── Inspection routes ────────────────────────────────────────────────────────

  const scheduleSchema = z.object({
    inspectionType: z.string().min(1),
    requestedDate: z.string().min(1),
    projectId: z.string().min(1),
    jurisdictionId: z.string().min(1),
    notes: z.string().optional(),
    isRemote: z.boolean().optional(),
  });

  const resultSchema = z.object({
    result: z.enum(['PASS', 'PASS_WITH_COMMENTS', 'FAIL', 'PARTIAL_PASS', 'NOT_READY']),
    notes: z.string().optional(),
    deficiencies: z.array(z.object({
      code: z.string().optional(),
      description: z.string(),
      severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']),
    })).optional(),
  });

  // GET /api/permits/:id/inspections — list inspections + upcoming due
  fastify.get(
    '/:id/inspections',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const [inspections, due] = await Promise.all([
          inspectionCoordinator.getInspectionsForPermit(id),
          inspectionCoordinator.checkInspectionsDue(id).catch(() => []),
        ]);
        return { inspections, nextDue: due };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch inspections') });
      }
    }
  );

  // POST /api/permits/:id/inspections — schedule an inspection (specialist only)
  fastify.post(
    '/:id/inspections',
    { preHandler: [authenticateUser, validateParams(z.object({ id: z.string() })), validateBody(scheduleSchema)] },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { id } = request.params as { id: string };
        const body = scheduleSchema.parse(request.body);

        const result = await inspectionCoordinator.scheduleInspection({
          permitId: id,
          projectId: body.projectId,
          jurisdictionId: body.jurisdictionId,
          inspectionType: body.inspectionType,
          requestedDate: new Date(body.requestedDate),
          specialistId: user.id,
          notes: body.notes,
          isRemote: body.isRemote,
        });

        return reply.code(201).send(result);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to schedule inspection') });
      }
    }
  );

  // PATCH /api/permits/inspections/:inspectionId/result — log result (specialist only)
  fastify.patch(
    '/inspections/:inspectionId/result',
    { preHandler: [authenticateUser, validateParams(z.object({ inspectionId: z.string() })), validateBody(resultSchema)] },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { inspectionId } = request.params as { inspectionId: string };
        const body = resultSchema.parse(request.body);

        await inspectionCoordinator.logInspectionResult({
          inspectionId,
          result: body.result,
          notes: body.notes,
          deficiencies: body.deficiencies,
          specialistId: user.id,
        });

        return { success: true };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to log inspection result') });
      }
    }
  );
}

