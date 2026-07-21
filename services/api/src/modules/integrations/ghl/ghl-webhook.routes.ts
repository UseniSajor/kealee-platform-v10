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
import { upsertContact } from './ghl-contacts';
import { PIPELINE_STAGES } from './ghl-opportunities';

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

/**
 * GHL → Kealee stage name mapping (reverse of PIPELINE_STAGES).
 * Maps GHL stage names to Kealee project phase strings.
 */
const GHL_STAGE_TO_KEALEE_PHASE: Record<string, string> = {
  'New Lead': 'lead',
  'Qualified': 'qualified',
  'Quote Requested': 'quoting',
  'Quote Sent': 'quoting',
  'Consultation Booked': 'consultation',
  'Proposal Sent': 'proposal',
  'Contract Signed': 'contracted',
  'Permitting': 'permitting',
  'Project Active': 'active',
  'Punch List': 'punch_list',
  'Project Complete': 'complete',
};

async function handleContactCreate(payload: any, fastify: FastifyInstance) {
  const email = payload.email || payload.contact?.email;
  const ghlContactId = payload.id || payload.contact?.id;

  fastify.log.info({ ghlContactId, email }, 'GHL ContactCreate received');

  if (!email || !ghlContactId) return;

  // Link to existing Kealee user if one exists with this email
  try {
    const existingUser = await p.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser && !existingUser.ghlContactId) {
      await p.user.update({
        where: { id: existingUser.id },
        data: { ghlContactId, ghlSyncedAt: new Date() },
      });
      fastify.log.info({ userId: existingUser.id, ghlContactId }, 'Linked GHL contact to existing Kealee user');
    }

    await logGhlSync('user', existingUser?.id || '', ghlContactId, 'ghl_to_kealee', 'success');
  } catch (err: any) {
    fastify.log.error({ err, ghlContactId }, 'Failed to handle GHL ContactCreate');
    await logGhlSync('user', '', ghlContactId, 'ghl_to_kealee', 'failed', err?.message);
  }
}

async function handleContactUpdate(payload: any, fastify: FastifyInstance) {
  const ghlContactId = payload.id || payload.contact?.id;

  fastify.log.info({ ghlContactId }, 'GHL ContactUpdate received');

  if (!ghlContactId) return;

  try {
    // Find linked Kealee user
    const user = await p.user.findFirst({
      where: { ghlContactId },
    });

    if (!user) {
      fastify.log.info({ ghlContactId }, 'No Kealee user linked to GHL contact, skipping');
      return;
    }

    // Sync basic contact fields back to Kealee
    const contact = payload.contact || payload;
    const updates: Record<string, any> = {};

    if (contact.phone && contact.phone !== user.phone) updates.phone = contact.phone;
    if (contact.firstName && contact.firstName !== user.firstName) updates.firstName = contact.firstName;
    if (contact.lastName && contact.lastName !== user.lastName) updates.lastName = contact.lastName;

    if (Object.keys(updates).length > 0) {
      updates.ghlSyncedAt = new Date();
      await p.user.update({ where: { id: user.id }, data: updates });
      fastify.log.info({ userId: user.id, updates: Object.keys(updates) }, 'Synced GHL contact update to Kealee user');
    }

    await logGhlSync('user', user.id, ghlContactId, 'ghl_to_kealee', 'success');
  } catch (err: any) {
    fastify.log.error({ err, ghlContactId }, 'Failed to handle GHL ContactUpdate');
    await logGhlSync('user', '', ghlContactId, 'ghl_to_kealee', 'failed', err?.message);
  }
}

async function handleOpportunityStageUpdate(payload: any, fastify: FastifyInstance) {
  const opportunityId = payload.id || payload.opportunity?.id;
  const newStageId = payload.pipelineStageId || payload.opportunity?.pipelineStageId;
  const stageName = payload.stageName || payload.opportunity?.stageName || '';

  fastify.log.info({ opportunityId, stage: newStageId, stageName }, 'GHL OpportunityStageUpdate received');

  if (!opportunityId) return;

  try {
    // Find linked Kealee project
    const project = await p.project.findFirst({
      where: { ghlOpportunityId: opportunityId },
    });

    if (!project) {
      fastify.log.info({ opportunityId }, 'No Kealee project linked to GHL opportunity, skipping');
      return;
    }

    const updates: Record<string, any> = {};

    // Update GHL stage reference
    if (newStageId) updates.ghlStageId = newStageId;

    // Map GHL stage name to Kealee phase
    const kealeePhase = GHL_STAGE_TO_KEALEE_PHASE[stageName];
    if (kealeePhase) {
      updates.currentPhase = kealeePhase;
    }

    // Mark as complete if moved to Project Complete
    if (stageName === 'Project Complete') {
      updates.status = 'completed';
      updates.completedAt = new Date();
    }

    if (Object.keys(updates).length > 0) {
      await p.project.update({ where: { id: project.id }, data: updates });
      fastify.log.info({ projectId: project.id, updates: Object.keys(updates) }, 'Updated Kealee project from GHL stage change');
    }

    await logGhlSync('project', project.id, opportunityId, 'ghl_to_kealee', 'success');
  } catch (err: any) {
    fastify.log.error({ err, opportunityId }, 'Failed to handle GHL OpportunityStageUpdate');
    await logGhlSync('project', '', opportunityId, 'ghl_to_kealee', 'failed', err?.message);
  }
}

async function handleAppointmentCreate(payload: any, fastify: FastifyInstance) {
  const appointmentId = payload.id || payload.appointment?.id;
  const contactId = payload.contactId || payload.appointment?.contactId;
  const startTime = payload.startTime || payload.appointment?.startTime;
  const title = payload.title || payload.appointment?.title || 'Consultation';

  fastify.log.info({ appointmentId, contactId }, 'GHL AppointmentCreate received');

  if (!contactId) return;

  try {
    // Find linked Kealee user
    const user = await p.user.findFirst({
      where: { ghlContactId: contactId },
    });

    if (!user) {
      fastify.log.info({ contactId }, 'No Kealee user linked to GHL contact for appointment');
      return;
    }

    // Create a consultation record if Consultation model exists
    try {
      await p.consultation?.create?.({
        data: {
          userId: user.id,
          title,
          scheduledAt: startTime ? new Date(startTime) : new Date(),
          status: 'scheduled',
          source: 'ghl',
          externalId: appointmentId,
        },
      });
      fastify.log.info({ userId: user.id, appointmentId }, 'Created Kealee consultation from GHL appointment');
    } catch {
      // Consultation model may not exist — log for visibility
      fastify.log.info({ appointmentId }, 'Consultation model not available, appointment logged only');
    }

    await logGhlSync('appointment', user.id, appointmentId || '', 'ghl_to_kealee', 'success');
  } catch (err: any) {
    fastify.log.error({ err, appointmentId }, 'Failed to handle GHL AppointmentCreate');
    await logGhlSync('appointment', '', appointmentId || '', 'ghl_to_kealee', 'failed', err?.message);
  }
}

async function handleFormSubmission(payload: any, fastify: FastifyInstance) {
  const formId = payload.formId || payload.form?.id;
  const contactId = payload.contactId || payload.contact?.id;
  const formData = payload.data || payload.form?.data || {};

  fastify.log.info({ formId, contactId }, 'GHL FormSubmission received');

  if (!contactId) return;

  try {
    // Find linked Kealee user
    const user = await p.user.findFirst({
      where: { ghlContactId: contactId },
    });

    // Create a quote request / lead record
    try {
      await p.quoteRequest?.create?.({
        data: {
          userId: user?.id,
          source: 'ghl_form',
          formId,
          formData,
          status: 'new',
          email: formData.email || payload.email,
          name: formData.name || payload.name,
        },
      });
      fastify.log.info({ formId, userId: user?.id }, 'Created Kealee quote request from GHL form submission');
    } catch {
      fastify.log.info({ formId }, 'QuoteRequest model not available, form submission logged only');
    }

    await logGhlSync('form', user?.id || '', contactId, 'ghl_to_kealee', 'success');
  } catch (err: any) {
    fastify.log.error({ err, formId }, 'Failed to handle GHL FormSubmission');
    await logGhlSync('form', '', contactId || '', 'ghl_to_kealee', 'failed', err?.message);
  }
}

// ---------------------------------------------------------------------------
// Sync logger (webhook direction)
// ---------------------------------------------------------------------------

async function logGhlSync(
  entityType: string,
  entityId: string,
  ghlId: string,
  direction: string,
  status: string,
  error?: string,
): Promise<void> {
  try {
    await p.ghlSyncStatus.create({
      data: {
        entityType,
        entityId,
        ghlId,
        lastSynced: new Date(),
        syncDirection: direction,
        status,
        error: error?.slice(0, 500),
      },
    });
  } catch {
    // Ignore log failures
  }
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
