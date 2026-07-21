/**
 * services/api/src/modules/design/concept-validation.routes.ts
 *
 * Project Concept + Validation — $395 combined product
 * Replaces standalone AI concept ($149) and validation report ($395)
 */

import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { z } from 'zod';
import { prismaAny } from '../../utils/prisma-helper';
import { config } from '../../config';
import { emailService } from '../email/email.service';
import { authenticateUser as authenticate } from '../../middleware/auth.middleware';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';
import { Redis } from 'ioredis';

const stripe = new Stripe(config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const initiateSchema = z.object({
  projectId:  z.string(),
  successUrl: z.string().url(),
  cancelUrl:  z.string().url(),
});

const staffCompleteSchema = z.object({
  feasibilityConfirmed:    z.boolean(),
  zoningConfirmed:         z.boolean(),
  structuralRisk:          z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  costBandLow:             z.number().int(),
  costBandHigh:            z.number().int(),
  permitRisk:              z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  contractorScopeNotes:    z.string().optional(),
  staffReviewedBy:         z.string(),
});

export async function conceptValidationRoutes(fastify: FastifyInstance) {

  // ── POST /design/concept-validation/initiate ──────────────────────────────
  // Authenticated — start the concept+validation flow for a project
  fastify.post(
    '/initiate',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { projectId, successUrl, cancelUrl } = initiateSchema.parse(request.body);
        const userId = (request as any).user?.id;

        // Validate project exists and belongs to this user
        const project = await prismaAny.project.findFirst({
          where: { id: projectId, ownerId: userId },
          include: { _count: { select: { photos: true } } },
        });

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // Require at least 1 photo
        const photoCount = (project as any)._count?.photos ?? 0;
        if (photoCount === 0) {
          return reply.code(400).send({
            code:    'PHOTOS_REQUIRED',
            message: 'Please add at least one photo before generating your concept.',
          });
        }

        // Check for existing record
        const existing = await prismaAny.projectConceptValidation.findUnique({
          where: { projectId },
        });
        if (existing && ['PAID', 'IN_REVIEW', 'DELIVERED'].includes(existing.status)) {
          return reply.code(409).send({
            error:               'Concept validation already initiated',
            conceptValidationId: existing.id,
            status:              existing.status,
          });
        }

        // Get Stripe price ID
        const priceId = process.env.STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION;
        if (!priceId) {
          fastify.log.error('STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION not configured');
          return reply.code(500).send({ error: 'Payment not configured' });
        }

        // Create or update ConceptValidation record (PENDING)
        let conceptValidation: any;
        if (existing) {
          conceptValidation = await prismaAny.projectConceptValidation.update({
            where: { projectId },
            data:  { status: 'PENDING' },
          });
        } else {
          conceptValidation = await prismaAny.projectConceptValidation.create({
            data: { projectId, status: 'PENDING' },
          });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode:                'payment',
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: successUrl,
          cancel_url:  cancelUrl,
          customer_email: (request as any).user?.email,
          metadata: {
            productType:         'CONCEPT_VALIDATION',
            projectId,
            userId,
            conceptValidationId: conceptValidation.id,
          },
        });

        return {
          sessionId:           session.id,
          url:                 session.url,
          conceptValidationId: conceptValidation.id,
        };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to initiate concept validation'),
        });
      }
    },
  );

  // ── POST /design/concept-validation/webhook-activate ─────────────────────
  // Called internally from stripe.routes.ts handleCheckoutCompleted
  // Activates the concept validation after successful payment
  fastify.post(
    '/webhook-activate',
    async (request, reply) => {
      try {
        const { projectId, conceptValidationId } = request.body as any;

        if (!projectId || !conceptValidationId) {
          return reply.code(400).send({ error: 'Missing projectId or conceptValidationId' });
        }

        // Update status to PAID
        await prismaAny.projectConceptValidation.update({
          where: { id: conceptValidationId },
          data:  { status: 'PAID' },
        });

        // Emit design.concept.initiated event on Redis
        try {
          const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
          await redis.publish('kealee:events', JSON.stringify({
            type:      'design.concept.initiated',
            projectId,
            conceptValidationId,
            timestamp: new Date().toISOString(),
          }));
          redis.disconnect();
        } catch (redisErr: any) {
          fastify.log.warn('Redis publish failed (non-fatal):', redisErr.message);
        }

        return { success: true };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Failed to activate concept validation' });
      }
    },
  );

  // ── GET /design/concept-validation/:projectId ─────────────────────────────
  fastify.get(
    '/:projectId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string };
        const userId = (request as any).user?.id;

        // Verify project ownership
        const project = await prismaAny.project.findFirst({
          where: { id: projectId, ownerId: userId },
        });
        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const record = await prismaAny.projectConceptValidation.findUnique({
          where: { projectId },
        });

        if (!record) {
          return { exists: false, projectId };
        }

        return { exists: true, ...record };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch concept validation') });
      }
    },
  );

  // ── GET /design/concept-validation/queue ─────────────────────────────────
  // Admin auth — returns PAID + IN_REVIEW records with project + owner info
  fastify.get(
    '/queue',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        if (!user?.role || !['ADMIN', 'STAFF'].includes(user.role)) {
          return reply.code(403).send({ error: 'Admin access required' });
        }

        const records = await prismaAny.projectConceptValidation.findMany({
          where: { status: { in: ['PAID', 'IN_REVIEW'] } },
          orderBy: { createdAt: 'asc' },
          include: {
            project: {
              select: {
                name: true,
                city: true,
                state: true,
                owner: { select: { name: true, email: true } },
              },
            },
          },
        });

        return records;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch queue') });
      }
    },
  );

  // ── GET /design/concept-validation/admin/:id ──────────────────────────────
  // Admin auth — full record detail for QA workflow
  fastify.get(
    '/admin/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = (request as any).user;
        if (!user?.role || !['ADMIN', 'STAFF'].includes(user.role)) {
          return reply.code(403).send({ error: 'Admin access required' });
        }

        const record = await prismaAny.projectConceptValidation.findUnique({
          where: { id },
          include: {
            project: {
              select: {
                name: true,
                type: true,
                city: true,
                state: true,
                sqft: true,
                budgetEstimated: true,
                description: true,
                owner: { select: { name: true, email: true } },
              },
            },
          },
        });

        if (!record) {
          return reply.code(404).send({ error: 'Concept validation not found' });
        }

        return record;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch record') });
      }
    },
  );

  // ── POST /design/concept-validation/:id/staff-complete ────────────────────
  // Admin auth — staff delivers the QA-reviewed report
  fastify.post(
    '/:id/staff-complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = (request as any).user;

        // Simple admin check — verify user has admin role
        if (!user?.role || !['ADMIN', 'STAFF'].includes(user.role)) {
          return reply.code(403).send({ error: 'Admin access required' });
        }

        const body = staffCompleteSchema.parse(request.body);

        const record = await prismaAny.projectConceptValidation.findUnique({
          where: { id },
        });
        if (!record) {
          return reply.code(404).send({ error: 'Concept validation not found' });
        }

        const updated = await prismaAny.projectConceptValidation.update({
          where: { id },
          data: {
            ...body,
            status:         'DELIVERED',
            staffReviewedAt: new Date(),
            deliveredAt:     new Date(),
          },
        });

        // Get project + owner email for notification
        const project = await prismaAny.project.findUnique({
          where: { id: record.projectId },
          include: { owner: { select: { email: true, name: true } } },
        });

        if ((project as any)?.owner?.email) {
          await emailService.sendEmail({
            to:       (project as any).owner.email,
            subject:  'Your Project Concept + Validation report is ready',
            template: 'concept-validation-delivered',
            data: {
              name:        (project as any).owner.name,
              projectName: (project as any).name,
              costBandLow:  body.costBandLow,
              costBandHigh: body.costBandHigh,
              portalUrl:   `${process.env.FRONTEND_URL}/projects/${record.projectId}/concept`,
            },
          }).catch((err: any) => fastify.log.warn('Email send failed:', err.message));
        }

        return updated;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to complete staff review') });
      }
    },
  );
}
