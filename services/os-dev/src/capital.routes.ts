/**
 * Capital Routes — /api/v1/dev
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { capitalService } from './capital.service';

const uuidParam = z.object({ id: z.string().uuid() });

export async function capitalRoutes(fastify: FastifyInstance) {
  // ── Capital Stacks ───────────────────────────────────────

  // POST /capital-stacks
  fastify.post('/capital-stacks', async (request, reply) => {
    const body = request.body as any;
    const stack = await capitalService.createCapitalStack(body);
    return reply.code(201).send({ capitalStack: stack });
  });

  // GET /capital-stacks/:projectId
  fastify.get('/capital-stacks/:projectId', async (request, reply) => {
    const { projectId } = request.params as any;
    const stack = await capitalService.getCapitalStack(projectId);
    if (!stack) return reply.code(404).send({ error: 'Capital stack not found' });
    return reply.send({ capitalStack: stack });
  });

  // PATCH /capital-stacks/:id
  fastify.patch('/capital-stacks/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const stack = await capitalService.updateCapitalStack(id, request.body as any);
    return reply.send({ capitalStack: stack });
  });

  // POST /capital-stacks/:id/finalize
  fastify.post('/capital-stacks/:id/finalize', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { finalizedBy } = request.body as any;
    const stack = await capitalService.finalizeCapitalStack(id, finalizedBy);
    return reply.send({ capitalStack: stack });
  });

  // ── Capital Sources ──────────────────────────────────────

  // POST /capital-stacks/:id/sources
  fastify.post('/capital-stacks/:id/sources', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const source = await capitalService.addSource(id, request.body as any);
    return reply.code(201).send({ source });
  });

  // PATCH /sources/:id
  fastify.patch('/sources/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const source = await capitalService.updateSource(id, request.body as any);
    return reply.send({ source });
  });

  // ── Draw Schedules ───────────────────────────────────────

  // POST /capital-stacks/:id/draws
  fastify.post('/capital-stacks/:id/draws', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const draw = await capitalService.createDraw(id, request.body as any);
    return reply.code(201).send({ draw });
  });

  // GET /capital-stacks/:id/draws
  fastify.get('/capital-stacks/:id/draws', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const draws = await capitalService.listDraws(id);
    return reply.send({ draws });
  });

  // POST /draws/:id/submit
  fastify.post('/draws/:id/submit', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const draw = await capitalService.submitDraw(id);
    return reply.send({ draw });
  });

  // POST /draws/:id/approve
  fastify.post('/draws/:id/approve', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { approvedBy, approvedAmount, retainage } = request.body as any;
    const draw = await capitalService.approveDraw(id, approvedBy, approvedAmount, retainage);
    return reply.send({ draw });
  });

  // POST /draws/:id/fund
  fastify.post('/draws/:id/fund', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const draw = await capitalService.fundDraw(id);
    return reply.send({ draw });
  });

  // POST /draws/:id/reject
  fastify.post('/draws/:id/reject', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { reviewedBy, reason } = request.body as any;
    const draw = await capitalService.rejectDraw(id, reviewedBy, reason);
    return reply.send({ draw });
  });

  // ── Investor Reports ─────────────────────────────────────

  // POST /investor-reports
  fastify.post('/investor-reports', async (request, reply) => {
    const body = request.body as any;
    const report = await capitalService.createInvestorReport({
      ...body,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
    });
    return reply.code(201).send({ report });
  });

  // GET /investor-reports/:projectId
  fastify.get('/investor-reports/:projectId', async (request, reply) => {
    const { projectId } = request.params as any;
    const reports = await capitalService.listInvestorReports(projectId);
    return reply.send({ reports });
  });

  // POST /investor-reports/:id/publish
  fastify.post('/investor-reports/:id/publish', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { publishedBy } = request.body as any;
    const report = await capitalService.publishInvestorReport(id, publishedBy);
    return reply.send({ report });
  });

  // ── Entitlements ─────────────────────────────────────────

  // POST /entitlements
  fastify.post('/entitlements', async (request, reply) => {
    const entitlement = await capitalService.createEntitlement(request.body as any);
    return reply.code(201).send({ entitlement });
  });

  // GET /entitlements/:projectId
  fastify.get('/entitlements/:projectId', async (request, reply) => {
    const { projectId } = request.params as any;
    const entitlements = await capitalService.listEntitlements(projectId);
    return reply.send({ entitlements });
  });

  // PATCH /entitlements/:id
  fastify.patch('/entitlements/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const entitlement = await capitalService.updateEntitlement(id, request.body as any);
    return reply.send({ entitlement });
  });
}
