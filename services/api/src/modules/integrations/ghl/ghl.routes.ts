/**
 * GHL API Routes
 *
 * Authenticated endpoints for GHL CRM operations.
 * All routes require Supabase JWT authentication.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sanitizeErrorMessage } from '../../../utils/sanitize-error';
import * as contacts from './ghl-contacts';
import * as opportunities from './ghl-opportunities';
import { isGhlConfigured } from './ghl-client';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  address1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
});

const createOpportunitySchema = z.object({
  pipelineId: z.string(),
  pipelineStageId: z.string(),
  contactId: z.string(),
  name: z.string(),
  monetaryValue: z.number().optional(),
  source: z.string().optional(),
});

const updateOpportunitySchema = z.object({
  pipelineStageId: z.string().optional(),
  name: z.string().optional(),
  monetaryValue: z.number().optional(),
  status: z.enum(['open', 'won', 'lost', 'abandoned']).optional(),
});

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function ghlRoutes(fastify: FastifyInstance) {
  // Guard: if GHL isn't configured, return 503 for all routes
  if (!isGhlConfigured()) {
    fastify.addHook('onRequest', async (_req, reply) => {
      return reply.code(503).send({
        success: false,
        error: 'GoHighLevel integration is not configured',
      });
    });
  }

  // ── Contacts ─────────────────────────────────────────────────

  /** POST / - Create or update a GHL contact (upsert by email) */
  fastify.post('/contacts', async (request, reply) => {
    try {
      const input = createContactSchema.parse(request.body);
      const { contact, created } = await contacts.upsertContact(input);
      return reply.code(created ? 201 : 200).send({ success: true, data: contact, created });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: 'Invalid contact data', details: error.issues });
      }
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to sync contact') });
    }
  });

  /** GET /contacts/:email - Find contact by email */
  fastify.get('/contacts/:email', async (request, reply) => {
    try {
      const { email } = request.params as { email: string };
      const contact = await contacts.findContactByEmail(email);
      if (!contact) return reply.code(404).send({ success: false, error: 'Contact not found' });
      return reply.send({ success: true, data: contact });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to find contact') });
    }
  });

  // ── Opportunities ────────────────────────────────────────────

  /** POST /opportunities - Create a pipeline opportunity */
  fastify.post('/opportunities', async (request, reply) => {
    try {
      const input = createOpportunitySchema.parse(request.body);
      const opportunity = await opportunities.createOpportunity(input);
      return reply.code(201).send({ success: true, data: opportunity });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: 'Invalid opportunity data', details: error.issues });
      }
      fastify.log.error(error);
      return reply
        .code(500)
        .send({ success: false, error: sanitizeErrorMessage(error, 'Failed to create opportunity') });
    }
  });

  /** PUT /opportunities/:id - Update opportunity stage or details */
  fastify.put('/opportunities/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const input = updateOpportunitySchema.parse(request.body);
      const opportunity = await opportunities.updateOpportunity(id, input);
      return reply.send({ success: true, data: opportunity });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ success: false, error: 'Invalid update data', details: error.issues });
      }
      fastify.log.error(error);
      return reply
        .code(500)
        .send({ success: false, error: sanitizeErrorMessage(error, 'Failed to update opportunity') });
    }
  });
}
