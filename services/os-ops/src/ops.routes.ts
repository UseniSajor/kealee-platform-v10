/**
 * OS-Ops Routes — /api/v1/ops
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { opsService } from './ops.service';

const uuidParam = z.object({ id: z.string().uuid() });

export async function opsRoutes(fastify: FastifyInstance) {
  // ── Turnover Checklists ──────────────────────────────────

  fastify.post('/checklists', async (request, reply) => {
    const checklist = await opsService.createChecklist(request.body as any);
    return reply.code(201).send({ checklist });
  });

  fastify.get('/checklists', async (request, reply) => {
    const { projectId } = request.query as any;
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const checklists = await opsService.listChecklists(projectId);
    return reply.send({ checklists });
  });

  fastify.get('/checklists/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const checklist = await opsService.getChecklist(id);
    if (!checklist) return reply.code(404).send({ error: 'Checklist not found' });
    return reply.send({ checklist });
  });

  fastify.post('/checklists/:id/items', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const item = await opsService.addChecklistItem(id, request.body as any);
    return reply.code(201).send({ item });
  });

  fastify.post('/checklists/items/:id/complete', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { completedBy, ...data } = request.body as any;
    const item = await opsService.completeChecklistItem(id, completedBy, data);
    return reply.send({ item });
  });

  fastify.post('/checklists/:id/sign-off', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { signedOffBy } = request.body as any;
    const checklist = await opsService.signOffChecklist(id, signedOffBy);
    return reply.send({ checklist });
  });

  // ── Maintenance Schedules ────────────────────────────────

  fastify.post('/maintenance/schedules', async (request, reply) => {
    const schedule = await opsService.createMaintenanceSchedule(request.body as any);
    return reply.code(201).send({ schedule });
  });

  fastify.get('/maintenance/schedules', async (request, reply) => {
    const { projectId } = request.query as any;
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const schedules = await opsService.listMaintenanceSchedules(projectId);
    return reply.send({ schedules });
  });

  fastify.get('/maintenance/overdue', async (request, reply) => {
    const { orgId } = request.query as any;
    if (!orgId) return reply.code(400).send({ error: 'orgId required' });
    const schedules = await opsService.getOverdueSchedules(orgId);
    return reply.send({ schedules });
  });

  // ── Work Orders ──────────────────────────────────────────

  fastify.post('/work-orders', async (request, reply) => {
    const workOrder = await opsService.createWorkOrder(request.body as any);
    return reply.code(201).send({ workOrder });
  });

  fastify.get('/work-orders', async (request, reply) => {
    const q = request.query as any;
    if (!q.projectId) return reply.code(400).send({ error: 'projectId required' });
    const result = await opsService.listWorkOrders(q.projectId, {
      status: q.status,
      priority: q.priority,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return reply.send(result);
  });

  fastify.get('/work-orders/:id', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const workOrder = await opsService.getWorkOrder(id);
    if (!workOrder) return reply.code(404).send({ error: 'Work order not found' });
    return reply.send({ workOrder });
  });

  fastify.patch('/work-orders/:id/status', async (request, reply) => {
    const { id } = uuidParam.parse(request.params);
    const { status, ...data } = request.body as any;
    const workOrder = await opsService.updateWorkOrderStatus(id, status, data);
    return reply.send({ workOrder });
  });

  // ── Payment Templates ────────────────────────────────────

  fastify.post('/payment-templates', async (request, reply) => {
    const template = await opsService.createPaymentTemplate(request.body as any);
    return reply.code(201).send({ template });
  });

  fastify.get('/payment-templates', async (request, reply) => {
    const { orgId } = request.query as any;
    if (!orgId) return reply.code(400).send({ error: 'orgId required' });
    const templates = await opsService.listPaymentTemplates(orgId);
    return reply.send({ templates });
  });

  // ── Escrow Reconciliation ────────────────────────────────

  fastify.post('/escrow-reconciliations', async (request, reply) => {
    const body = request.body as any;
    const recon = await opsService.createEscrowReconciliation({
      ...body,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
    });
    return reply.code(201).send({ reconciliation: recon });
  });

  fastify.get('/escrow-reconciliations', async (request, reply) => {
    const { projectId } = request.query as any;
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const reconciliations = await opsService.listReconciliations(projectId);
    return reply.send({ reconciliations });
  });
}
