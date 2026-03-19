/**
 * services/api/src/modules/developer/developer-services.routes.ts
 */

import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { z } from 'zod';
import { prismaAny } from '../../utils/prisma-helper';
import { config } from '../../config';
import { emailService } from '../email/email.service';
import { authenticateUser } from '../../middleware/auth.middleware';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';

const stripe = new Stripe(config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PRICE_MAP: Record<string, string | undefined> = {
  FEASIBILITY_STUDY: process.env.STRIPE_PRICE_DEV_FEASIBILITY,
  PRO_FORMA:         process.env.STRIPE_PRICE_DEV_PROFORMA,
  CAPITAL_STACK:     process.env.STRIPE_PRICE_DEV_CAPITAL,
  ENTITLEMENTS:      process.env.STRIPE_PRICE_DEV_ENTITLEMENTS,
};

const requestSchema = z.object({
  serviceType:     z.enum(['FEASIBILITY_STUDY', 'PRO_FORMA', 'CAPITAL_STACK', 'ENTITLEMENTS']),
  propertyAddress: z.string().optional(),
  projectDetails:  z.record(z.unknown()).optional(),
  timeline:        z.enum(['ASAP', '30_DAYS', '60_DAYS', 'FLEXIBLE']).optional(),
  successUrl:      z.string().url(),
  cancelUrl:       z.string().url(),
});

const deliverSchema = z.object({
  deliverableUrl: z.string().url(),
});

export async function developerServicesRoutes(fastify: FastifyInstance) {

  // POST /developer/services/request
  fastify.post(
    '/request',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const body   = requestSchema.parse(request.body);
        const userId = (request as any).user?.id;

        const priceId = PRICE_MAP[body.serviceType];
        if (!priceId) {
          return reply.code(500).send({ error: `Price not configured for ${body.serviceType}` });
        }

        // Create request record
        const serviceRequest = await prismaAny.developerServiceRequest.create({
          data: {
            userId,
            serviceType:     body.serviceType,
            propertyAddress: body.propertyAddress,
            projectDetails:  { ...body.projectDetails, timeline: body.timeline } as any,
            status:          'PENDING',
          },
        });

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode:                'payment',
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: body.successUrl,
          cancel_url:  body.cancelUrl,
          customer_email: (request as any).user?.email,
          metadata: {
            productType:      'DEVELOPER_SERVICE',
            serviceType:      body.serviceType,
            serviceRequestId: serviceRequest.id,
            userId,
          },
        });

        return { requestId: serviceRequest.id, checkoutUrl: session.url };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to create service request') });
      }
    },
  );

  // GET /developer/services
  fastify.get(
    '/',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const userId = (request as any).user?.id;
        const requests = await prismaAny.developerServiceRequest.findMany({
          where:   { userId },
          orderBy: { requestedAt: 'desc' },
        });
        return requests;
      } catch (error: any) {
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch requests') });
      }
    },
  );

  // GET /developer/services/:id
  fastify.get(
    '/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = (request as any).user?.id;
        const rec    = await prismaAny.developerServiceRequest.findFirst({
          where: { id, userId },
        });
        if (!rec) return reply.code(404).send({ error: 'Not found' });
        return rec;
      } catch (error: any) {
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch request') });
      }
    },
  );

  // POST /developer/services/:id/deliver — admin only
  fastify.post(
    '/:id/deliver',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const { id }           = request.params as { id: string };
        const { deliverableUrl } = deliverSchema.parse(request.body);
        const user             = (request as any).user;

        if (!['ADMIN', 'STAFF'].includes(user?.role)) {
          return reply.code(403).send({ error: 'Admin access required' });
        }

        const updated = await prismaAny.developerServiceRequest.update({
          where: { id },
          data:  { deliverableUrl, status: 'DELIVERED', deliveredAt: new Date() },
        });

        // Notify user
        const owner = await prismaAny.user.findUnique({ where: { id: updated.userId } });
        if (owner?.email) {
          await emailService.sendEmail({
            to:       owner.email,
            subject:  `Your ${updated.serviceType.replace(/_/g, ' ')} is ready`,
            template: 'developer-service-delivered',
            data:     { name: owner.name, serviceType: updated.serviceType, deliverableUrl },
          }).catch(() => {});
        }

        return updated;
      } catch (error: any) {
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to deliver service') });
      }
    },
  );
}
