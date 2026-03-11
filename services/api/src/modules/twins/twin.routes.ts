/**
 * Twin Routes — DDTS API endpoints at /api/v1/twins
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { twinService } from './twin.service';
import { authenticateUser } from '../auth/auth.middleware';

const twinIdParam = z.object({ id: z.string().uuid() });

const createTwinSchema = z.object({
  projectId: z.string().uuid(),
  orgId: z.string().uuid(),
  tier: z.enum(['L1', 'L2', 'L3']).optional(),
  label: z.string().optional(),
  enabledModules: z.array(z.string()).optional(),
});

const updateTwinSchema = z.object({
  tier: z.enum(['L1', 'L2', 'L3']).optional(),
  label: z.string().optional(),
  enabledModules: z.array(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
});

const transitionSchema = z.object({
  status: z.enum([
    'INTAKE', 'LAND_ANALYSIS', 'FEASIBILITY', 'ENTITLEMENT',
    'PRE_CONSTRUCTION', 'CONSTRUCTION', 'CLOSEOUT', 'OPERATIONS', 'ARCHIVED',
  ]),
  reason: z.string().optional(),
});

const kpiUpdateSchema = z.object({
  updates: z.array(z.object({
    kpiKey: z.string(),
    value: z.number(),
  })),
});

const eventSchema = z.object({
  eventType: z.string(),
  source: z.string(),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  payload: z.record(z.unknown()),
  description: z.string().optional(),
  correlationId: z.string().optional(),
  causedBy: z.string().optional(),
  actorType: z.enum(['USER', 'SYSTEM', 'AI', 'BOT']).optional(),
  actorId: z.string().optional(),
});

const moduleSchema = z.object({
  moduleKey: z.string(),
  state: z.record(z.unknown()).optional(),
});

export async function twinRoutes(fastify: FastifyInstance) {
  // POST /twins — create a new digital twin
  fastify.post(
    '/',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const body = createTwinSchema.parse(request.body);
      const twin = await twinService.createTwin(body);
      return reply.code(201).send({ twin });
    }
  );

  // GET /twins — list twins for an org
  fastify.get(
    '/',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const query = request.query as any;
      const orgId = query.orgId as string;
      if (!orgId) return reply.code(400).send({ error: 'orgId query param required' });
      const result = await twinService.listTwins(orgId, {
        status: query.status,
        tier: query.tier,
        healthStatus: query.healthStatus,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      });
      return reply.send(result);
    }
  );

  // GET /twins/:id — get twin details
  fastify.get(
    '/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const twin = await twinService.getTwin(id);
      if (!twin) return reply.code(404).send({ error: 'Twin not found' });
      return reply.send({ twin });
    }
  );

  // GET /twins/project/:projectId — get twin by project
  fastify.get(
    '/project/:projectId',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { projectId } = z.object({ projectId: z.string().uuid() }).parse(request.params);
      const twin = await twinService.getTwinByProject(projectId);
      if (!twin) return reply.code(404).send({ error: 'Twin not found for project' });
      return reply.send({ twin });
    }
  );

  // PATCH /twins/:id — update twin metadata
  fastify.patch(
    '/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const body = updateTwinSchema.parse(request.body);
      const twin = await twinService.updateTwin(id, body);
      return reply.send({ twin });
    }
  );

  // POST /twins/:id/transition — transition to a new phase
  fastify.post(
    '/:id/transition',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const { status, reason } = transitionSchema.parse(request.body);
      const twin = await twinService.transitionPhase(id, status, reason);
      return reply.send({ twin });
    }
  );

  // POST /twins/:id/snapshots — create a snapshot
  fastify.post(
    '/:id/snapshots',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const body = (request.body || {}) as any;
      const snapshot = await twinService.createSnapshot(id, {
        label: body.label,
        trigger: body.trigger ?? 'manual',
      });
      return reply.code(201).send({ snapshot });
    }
  );

  // GET /twins/:id/snapshots — list snapshots
  fastify.get(
    '/:id/snapshots',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const query = request.query as any;
      const snapshots = await twinService.getSnapshots(id, query.limit ? parseInt(query.limit) : undefined);
      return reply.send({ snapshots });
    }
  );

  // POST /twins/:id/kpis — update KPI values
  fastify.post(
    '/:id/kpis',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const { updates } = kpiUpdateSchema.parse(request.body);
      await twinService.updateKPIs(id, updates);
      const health = await twinService.recalculateHealth(id);
      return reply.send({ health });
    }
  );

  // POST /twins/:id/events — record a twin event
  fastify.post(
    '/:id/events',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const body = eventSchema.parse(request.body);
      const event = await twinService.recordEvent(id, body);
      return reply.code(201).send({ event });
    }
  );

  // GET /twins/:id/timeline — get event timeline
  fastify.get(
    '/:id/timeline',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const query = request.query as any;
      const events = await twinService.getTimeline(
        id,
        query.limit ? parseInt(query.limit) : undefined,
        query.offset ? parseInt(query.offset) : undefined,
      );
      return reply.send({ events });
    }
  );

  // POST /twins/:id/modules — activate a module
  fastify.post(
    '/:id/modules',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const { moduleKey, state } = moduleSchema.parse(request.body);
      const module = await twinService.activateModule(id, moduleKey, state);
      return reply.code(201).send({ module });
    }
  );

  // DELETE /twins/:id/modules/:moduleKey — deactivate a module
  fastify.delete(
    '/:id/modules/:moduleKey',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = twinIdParam.parse(request.params);
      const { moduleKey } = z.object({ moduleKey: z.string() }).parse(request.params);
      const module = await twinService.deactivateModule(id, moduleKey);
      return reply.send({ module });
    }
  );
}
