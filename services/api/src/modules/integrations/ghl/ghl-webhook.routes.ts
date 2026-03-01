/**
 * GHL Webhook Routes
 *
 * Receives and processes GoHighLevel webhook events.
 * - Verifies webhook signature
 * - Implements idempotency (24-hour event dedup)
 * - Logs all events for debugging
 * - Routes events to appropriate handlers
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createHmac } from 'crypto';
import { prisma } from '@kealee/database';
import { sanitizeErrorMessage } from '../../../utils/sanitize-error';

const p = prisma as any;
const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET || '';

// ---------------------------------------------------------------------------
// Idempotency tracking (in-memory, 24h TTL)
// ---------------------------------------------------------------------------

const processedEvents = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function cleanupProcessedEvents() {
  const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
  for (const [key, ts] of processedEvents) {
    if (ts < cutoff) processedEvents.delete(key);
  }
}
// Periodic cleanup every hour
setInterval(cleanupProcessedEvents, 60 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

function verifySignature(rawBody: string, signature: string): boolean {
  if (!GHL_WEBHOOK_SECRET) return true; // Skip if no secret configured
  const expected = createHmac('sha256', GHL_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return expected === signature;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

type GhlEventHandler = (payload: any, fastify: FastifyInstance) => Promise<void>;

const eventHandlers: Record<string, GhlEventHandler> = {
  ContactCreate: handleContactCreate,
  ContactUpdate: handleContactUpdate,
  OpportunityStageUpdate: handleOpportunityStageUpdate,
  AppointmentCreate: handleAppointmentCreate,
  FormSubmission: handleFormSubmission,
};

async function handleContactCreate(payload: any, fastify: FastifyInstance) {
  // Log new lead from GHL
  fastify.log.info({ ghlContactId: payload.id, email: payload.email }, 'GHL ContactCreate received');
  // Sync can be implemented to create/link Kealee user records
}

async function handleContactUpdate(payload: any, fastify: FastifyInstance) {
  fastify.log.info({ ghlContactId: payload.id }, 'GHL ContactUpdate received');
  // Sync updated info back to Kealee if ghlContactId is linked to a User
}

async function handleOpportunityStageUpdate(payload: any, fastify: FastifyInstance) {
  fastify.log.info(
    { opportunityId: payload.id, stage: payload.pipelineStageId },
    'GHL OpportunityStageUpdate received',
  );
  // Could update Project.currentPhase based on GHL stage mapping
}

async function handleAppointmentCreate(payload: any, fastify: FastifyInstance) {
  fastify.log.info({ appointmentId: payload.id, contactId: payload.contactId }, 'GHL AppointmentCreate received');
}

async function handleFormSubmission(payload: any, fastify: FastifyInstance) {
  fastify.log.info({ formId: payload.formId, contactId: payload.contactId }, 'GHL FormSubmission received');
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function ghlWebhookRoutes(fastify: FastifyInstance) {
  /** POST /ghl - Main webhook receiver */
  fastify.post('/ghl', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify signature
      const signature = (request.headers['x-ghl-signature'] as string) || '';
      const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);

      if (GHL_WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
        fastify.log.warn('GHL webhook signature verification failed');
        return reply.code(401).send({ error: 'Invalid signature' });
      }

      const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
      const eventType: string = (payload as any)?.type || (payload as any)?.eventType || 'unknown';
      const eventId: string = (payload as any)?.id || `${eventType}-${Date.now()}`;

      // Idempotency check
      if (processedEvents.has(eventId)) {
        return reply.code(200).send({ success: true, message: 'Already processed' });
      }
      processedEvents.set(eventId, Date.now());

      // Log webhook event to database
      try {
        await p.ghlWebhookLog.create({
          data: {
            eventType,
            payload: payload as any,
            processed: false,
          },
        });
      } catch {
        // Don't fail the webhook if logging fails
        fastify.log.warn('Failed to log GHL webhook event to database');
      }

      // Route to handler
      const handler = eventHandlers[eventType];
      if (handler) {
        // Process asynchronously - return 200 quickly
        handler(payload, fastify)
          .then(async () => {
            try {
              await p.ghlWebhookLog.updateMany({
                where: { eventType, processed: false },
                data: { processed: true },
              });
            } catch {
              // Ignore log update failures
            }
          })
          .catch((err: any) => {
            fastify.log.error({ err, eventType }, 'GHL webhook handler failed');
          });
      } else {
        fastify.log.info({ eventType }, 'Unhandled GHL webhook event type');
      }

      return reply.code(200).send({ success: true });
    } catch (error: any) {
      fastify.log.error(error, 'GHL webhook processing error');
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Webhook processing failed'),
      });
    }
  });
}
