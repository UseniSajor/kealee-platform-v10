/**
 * services/api/src/modules/integrations/zoho/zoho.webhook.routes.ts
 *
 * Receives Zoho CRM webhook notifications and translates them
 * into Kealee platform events.
 *
 * Zoho webhook setup:
 *   Admin → Setup → Automation → Webhooks → New Webhook
 *   URL: https://your-api.kealee.com/zoho/webhook
 *   Auth: Set ZOHO_WEBHOOK_TOKEN in Zoho; same value in env.
 *
 * Stage change → Kealee event mapping:
 *   Registration Started   → contractor.acquisition.registration_started
 *   Documents Uploaded     → contractor.acquisition.documents_uploaded
 *   Verification Pending   → contractor.acquisition.verification_pending
 *   Verified Contractor    → contractor_verified (platform event)
 *   Active Contractor      → contractor.acquisition.activated
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { updateLeadStage, addLeadNote } from './zoho.crm.js';
import {
  CONTRACTOR_PIPELINE_STAGES,
  type ContractorPipelineStage,
  type ZohoWebhookPayload,
} from './zoho.types.js';

// ─── Stage → Kealee event mapping ────────────────────────────────────────────

const STAGE_TO_KEALEE_EVENT: Record<ContractorPipelineStage, string | null> = {
  [CONTRACTOR_PIPELINE_STAGES.CONTACTED]:            null,
  [CONTRACTOR_PIPELINE_STAGES.INTERESTED]:           null,
  [CONTRACTOR_PIPELINE_STAGES.REGISTRATION_STARTED]: 'contractor.acquisition.registration_started',
  [CONTRACTOR_PIPELINE_STAGES.DOCUMENTS_UPLOADED]:   'contractor.acquisition.documents_uploaded',
  [CONTRACTOR_PIPELINE_STAGES.VERIFICATION_PENDING]: 'contractor.acquisition.verification_pending',
  [CONTRACTOR_PIPELINE_STAGES.VERIFIED_CONTRACTOR]:  'marketplace.contractor.verified',
  [CONTRACTOR_PIPELINE_STAGES.ACTIVE_CONTRACTOR]:    'contractor.acquisition.activated',
};

// ─── Idempotency (24-hour dedup) ──────────────────────────────────────────────

const processedWebhooks = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function isProcessed(id: string): boolean {
  const ts = processedWebhooks.get(id);
  if (!ts) return false;
  if (Date.now() - ts > IDEMPOTENCY_TTL_MS) {
    processedWebhooks.delete(id);
    return false;
  }
  return true;
}

function markProcessed(id: string): void {
  processedWebhooks.set(id, Date.now());
  // Prune old entries occasionally
  if (processedWebhooks.size > 10_000) {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    for (const [k, ts] of processedWebhooks) {
      if (ts < cutoff) processedWebhooks.delete(k);
    }
  }
}

// ─── Token verification ───────────────────────────────────────────────────────

function verifyZohoToken(request: FastifyRequest): boolean {
  const token = process.env.ZOHO_WEBHOOK_TOKEN;
  if (!token) return true; // webhook token not configured — allow all (dev only)

  const provided =
    (request.headers['x-zoho-webhook-token'] as string) ||
    (request.query as Record<string, string>)['webhook_token'];

  return provided === token;
}

// ─── Event emitter helper ─────────────────────────────────────────────────────

async function emitKealeeEvent(
  fastify: FastifyInstance,
  eventType: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    // Emit to Redis pub/sub event bus if available
    const redis = (fastify as any).redis;
    if (redis) {
      const event = {
        id:        `zoho-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type:      eventType,
        source:    'zoho-webhook',
        timestamp: new Date().toISOString(),
        data,
      };
      await redis.publish('kealee:events', JSON.stringify(event));
    }

    fastify.log.info({ eventType, data }, 'Zoho webhook → Kealee event emitted');
  } catch (err) {
    fastify.log.error({ err, eventType }, 'Failed to emit Kealee event from Zoho webhook');
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function zohoWebhookRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /zoho/webhook
   * Main webhook receiver for all Zoho CRM notifications.
   */
  fastify.post(
    '/webhook',
    {
      config: { rawBody: true },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Verify token
      if (!verifyZohoToken(request)) {
        fastify.log.warn({ ip: request.ip }, 'Zoho webhook: invalid token');
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const payload = request.body as ZohoWebhookPayload;

      if (!payload?.module || !payload?.operation) {
        return reply.status(400).send({ error: 'Invalid payload' });
      }

      fastify.log.info({ module: payload.module, operation: payload.operation }, 'Zoho webhook received');

      // Process each record in the payload
      for (const record of (payload.data ?? [])) {
        const recordId = record.id as string | undefined;
        if (!recordId) continue;

        const dedupKey = `${payload.module}:${payload.operation}:${recordId}:${record.Modified_Time ?? Date.now()}`;
        if (isProcessed(dedupKey)) continue;
        markProcessed(dedupKey);

        // Handle stage changes on Leads module
        if (payload.module === 'Leads' && payload.operation === 'update') {
          const stage = record.Contractor_Stage as ContractorPipelineStage | undefined;
          if (stage) {
            const kealeeEvent = STAGE_TO_KEALEE_EVENT[stage];
            if (kealeeEvent) {
              await emitKealeeEvent(fastify, kealeeEvent, {
                zohoLeadId:      recordId,
                stage,
                email:           record.Email,
                kealeeProfileId: record.Kealee_Profile_Id,
                kealeeUserId:    record.Kealee_User_Id,
                trade:           record.Target_Trade,
                geo:             record.Target_Geo,
              });
            }
          }
        }

        // Handle new lead creation (someone filled out form in Zoho)
        if (payload.module === 'Leads' && payload.operation === 'create') {
          await emitKealeeEvent(fastify, 'contractor.acquisition.lead_captured', {
            zohoLeadId: recordId,
            email:      record.Email,
            firstName:  record.First_Name,
            lastName:   record.Last_Name,
            phone:      record.Phone,
            trade:      record.Target_Trade,
            geo:        record.Target_Geo,
            source:     record.Lead_Source ?? 'zoho-form',
          });
        }

        // Handle contact verification (Contacts module update)
        if (payload.module === 'Contacts' && payload.operation === 'update') {
          const stage = record.Contractor_Stage as ContractorPipelineStage | undefined;
          if (stage === CONTRACTOR_PIPELINE_STAGES.ACTIVE_CONTRACTOR) {
            await emitKealeeEvent(fastify, 'marketplace.contractor.registered', {
              zohoContactId:   recordId,
              kealeeProfileId: record.Kealee_Profile_Id,
              kealeeUserId:    record.Kealee_User_Id,
              email:           record.Email,
            });
          }
        }
      }

      return reply.status(200).send({ received: true });
    },
  );

  /**
   * GET /zoho/webhook/health
   * Simple health check for webhook endpoint.
   */
  fastify.get('/webhook/health', async (_req, reply) => {
    return reply.send({ status: 'ok', service: 'zoho-webhook' });
  });
}
