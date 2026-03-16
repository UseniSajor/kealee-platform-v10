/**
 * services/api/src/modules/integrations/zoho/zoho.routes.ts
 *
 * Authenticated admin routes for Zoho CRM operations.
 * All routes require Supabase JWT with admin role.
 *
 * Prefix: /zoho  (registered in api/src/index.ts)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { isZohoConfigured } from './zoho.client.js';
import {
  createContractorLead,
  findLeadByEmail,
  updateLeadStage,
  getLeadsByStage,
  upsertContractorContact,
  upsertContractorLead,
  addLeadNote,
} from './zoho.crm.js';
import { CONTRACTOR_PIPELINE_STAGES, type ContractorPipelineStage } from './zoho.types.js';

export async function zohoRoutes(fastify: FastifyInstance): Promise<void> {
  // Guard: return 503 if Zoho not configured
  if (!isZohoConfigured()) {
    fastify.all('*', async (_req, reply) => {
      return reply.status(503).send({
        error: 'Zoho CRM is not configured',
        required: ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'],
      });
    });
    return;
  }

  /**
   * GET /zoho/status
   * Configuration + connectivity check.
   */
  fastify.get('/status', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      configured: isZohoConfigured(),
      domain:     process.env.ZOHO_DOMAIN ?? 'com',
      stages:     Object.values(CONTRACTOR_PIPELINE_STAGES),
    });
  });

  /**
   * POST /zoho/leads
   * Manually create a contractor lead.
   */
  fastify.post('/leads', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      firstName?:      string;
      lastName?:       string;
      email?:          string;
      phone?:          string;
      company?:        string;
      trade?:          string;
      geo?:            string;
      campaignSource?: string;
    };

    const { id, created } = await upsertContractorLead({
      firstName:       body.firstName,
      lastName:        body.lastName ?? body.company ?? 'Contractor',
      email:           body.email,
      phone:           body.phone,
      company:         body.company,
      trade:           body.trade,
      geo:             body.geo,
      campaignSource:  body.campaignSource ?? 'manual',
    });

    return reply.status(created ? 201 : 200).send({ id, created });
  });

  /**
   * GET /zoho/leads/:email
   * Look up a lead by email.
   */
  fastify.get('/leads/:email', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.params as { email: string };
    const lead = await findLeadByEmail(decodeURIComponent(email));
    if (!lead) return reply.status(404).send({ error: 'Lead not found' });
    return reply.send(lead);
  });

  /**
   * GET /zoho/leads/stage/:stage
   * List all leads in a pipeline stage.
   */
  fastify.get('/leads/stage/:stage', async (request: FastifyRequest, reply: FastifyReply) => {
    const { stage } = request.params as { stage: string };
    const { page, per_page } = request.query as { page?: string; per_page?: string };

    if (!Object.values(CONTRACTOR_PIPELINE_STAGES).includes(stage as ContractorPipelineStage)) {
      return reply.status(400).send({
        error: 'Invalid stage',
        valid: Object.values(CONTRACTOR_PIPELINE_STAGES),
      });
    }

    const leads = await getLeadsByStage(
      stage as ContractorPipelineStage,
      page ? parseInt(page, 10) : 1,
      per_page ? parseInt(per_page, 10) : 200,
    );

    return reply.send({ leads, count: leads.length });
  });

  /**
   * PUT /zoho/leads/:id/stage
   * Update a lead's pipeline stage.
   */
  fastify.put('/leads/:id/stage', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { stage, notes } = request.body as { stage: string; notes?: string };

    if (!Object.values(CONTRACTOR_PIPELINE_STAGES).includes(stage as ContractorPipelineStage)) {
      return reply.status(400).send({
        error: 'Invalid stage',
        valid: Object.values(CONTRACTOR_PIPELINE_STAGES),
      });
    }

    await updateLeadStage(id, stage as ContractorPipelineStage, notes);
    return reply.send({ updated: true, id, stage });
  });

  /**
   * POST /zoho/leads/:id/notes
   * Add a note to a lead.
   */
  fastify.post('/leads/:id/notes', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { title, content } = request.body as { title: string; content: string };

    await addLeadNote(id, title, content);
    return reply.status(201).send({ added: true });
  });

  /**
   * POST /zoho/contacts
   * Upsert a verified contractor as a Zoho Contact.
   */
  fastify.post('/contacts', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      firstName?:         string;
      lastName?:          string;
      email?:             string;
      phone?:             string;
      businessName?:      string;
      kealeeProfileId?:   string;
      kealeeUserId?:      string;
      verificationStatus?: string;
      trades?:            string[];
      serviceAreas?:      string[];
      stage?:             string;
    };

    const contactId = await upsertContractorContact({
      firstName:          body.firstName,
      lastName:           body.lastName ?? body.businessName ?? 'Contractor',
      email:              body.email,
      phone:              body.phone,
      businessName:       body.businessName,
      kealeeProfileId:    body.kealeeProfileId,
      kealeeUserId:       body.kealeeUserId,
      verificationStatus: body.verificationStatus,
      trades:             body.trades,
      serviceAreas:       body.serviceAreas,
      stage:              (body.stage as ContractorPipelineStage) ??
                          CONTRACTOR_PIPELINE_STAGES.VERIFIED_CONTRACTOR,
    });

    return reply.status(201).send({ id: contactId });
  });
}
