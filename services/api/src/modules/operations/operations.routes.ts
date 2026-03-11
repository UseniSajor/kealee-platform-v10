/**
 * OS-Ops Routes — registered in main API gateway
 * Turnover, warranty, maintenance, payment templates, escrow reconciliation
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function operationsRoutes(fastify: FastifyInstance) {
  // ── Turnover Checklists ──────────────────────────────────

  fastify.post('/checklists', async (request, reply) => {
    const body = request.body as any;
    const checklist = await prisma.turnoverChecklist.create({
      data: {
        projectId: body.projectId, orgId: body.orgId, title: body.title,
        description: body.description, category: body.category,
        targetDate: body.targetDate, templateId: body.templateId, status: 'DRAFT',
      },
      include: { items: true },
    });
    return reply.code(201).send({ checklist });
  });

  fastify.get('/checklists', async (request, reply) => {
    const { projectId } = request.query as any;
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const checklists = await prisma.turnoverChecklist.findMany({
      where: { projectId }, include: { items: true }, orderBy: { createdAt: 'desc' },
    });
    return reply.send({ checklists });
  });

  fastify.get('/checklists/:id', async (request, reply) => {
    const { id } = request.params as any;
    const checklist = await prisma.turnoverChecklist.findUnique({
      where: { id }, include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!checklist) return reply.code(404).send({ error: 'Checklist not found' });
    return reply.send({ checklist });
  });

  fastify.post('/checklists/:id/items', async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const item = await prisma.turnoverItem.create({
      data: {
        checklistId: id, category: body.category, title: body.title,
        description: body.description, sortOrder: body.sortOrder ?? 0,
        requiresPhoto: body.requiresPhoto ?? false,
        requiresDocument: body.requiresDocument ?? false,
        requiresSignature: body.requiresSignature ?? false, status: 'PENDING',
      },
    });
    // Update totals
    const items = await prisma.turnoverItem.findMany({ where: { checklistId: id } });
    const completed = items.filter(i => i.status === 'COMPLETED').length;
    await prisma.turnoverChecklist.update({
      where: { id }, data: { totalItems: items.length, completedItems: completed, completionPct: items.length > 0 ? (completed / items.length) * 100 : 0 },
    });
    return reply.code(201).send({ item });
  });

  // ── Work Orders ──────────────────────────────────────────

  fastify.post('/work-orders', async (request, reply) => {
    const body = request.body as any;
    const wo = await prisma.maintenanceWorkOrder.create({
      data: {
        projectId: body.projectId, orgId: body.orgId, scheduleId: body.scheduleId,
        title: body.title, description: body.description, category: body.category,
        priority: body.priority ?? 'MEDIUM', assignedTo: body.assignedTo,
        assignedName: body.assignedName, scheduledDate: body.scheduledDate,
        location: body.location, estimatedCost: body.estimatedCost,
        reportedBy: body.reportedBy, status: 'OPEN',
      },
    });
    return reply.code(201).send({ workOrder: wo });
  });

  fastify.get('/work-orders', async (request, reply) => {
    const q = request.query as any;
    if (!q.projectId) return reply.code(400).send({ error: 'projectId required' });
    const where: any = { projectId: q.projectId };
    if (q.status) where.status = q.status;
    if (q.priority) where.priority = q.priority;
    const [workOrders, total] = await Promise.all([
      prisma.maintenanceWorkOrder.findMany({
        where, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: q.limit ? parseInt(q.limit) : 50, skip: q.offset ? parseInt(q.offset) : 0,
      }),
      prisma.maintenanceWorkOrder.count({ where }),
    ]);
    return reply.send({ workOrders, total });
  });

  // ── Maintenance Schedules ────────────────────────────────

  fastify.post('/maintenance/schedules', async (request, reply) => {
    const body = request.body as any;
    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        projectId: body.projectId, orgId: body.orgId, title: body.title,
        description: body.description, category: body.category, frequency: body.frequency,
        nextDueDate: body.nextDueDate, assignedTo: body.assignedTo,
        assignedName: body.assignedName, vendorName: body.vendorName,
        estimatedCost: body.estimatedCost, isActive: true,
      },
    });
    return reply.code(201).send({ schedule });
  });

  fastify.get('/maintenance/schedules', async (request, reply) => {
    const { projectId } = request.query as any;
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { projectId, isActive: true }, orderBy: { nextDueDate: 'asc' },
    });
    return reply.send({ schedules });
  });

  // ── Payment Templates ────────────────────────────────────

  fastify.post('/payment-templates', async (request, reply) => {
    const body = request.body as any;
    const template = await prisma.paymentScheduleTemplate.create({
      data: {
        orgId: body.orgId, name: body.name, description: body.description,
        projectType: body.projectType, milestones: body.milestones,
        totalMilestones: Array.isArray(body.milestones) ? body.milestones.length : 0,
        isDefault: body.isDefault ?? false,
      },
    });
    return reply.code(201).send({ template });
  });

  fastify.get('/payment-templates', async (request, reply) => {
    const { orgId } = request.query as any;
    if (!orgId) return reply.code(400).send({ error: 'orgId required' });
    const templates = await prisma.paymentScheduleTemplate.findMany({
      where: { orgId }, orderBy: { usageCount: 'desc' },
    });
    return reply.send({ templates });
  });

  // ── Escrow Reconciliation ────────────────────────────────

  fastify.post('/escrow-reconciliations', async (request, reply) => {
    const body = request.body as any;
    const discrepancy = body.actualBalance - body.expectedBalance;
    const recon = await prisma.escrowReconciliation.create({
      data: {
        projectId: body.projectId, orgId: body.orgId,
        periodStart: new Date(body.periodStart), periodEnd: new Date(body.periodEnd),
        expectedBalance: body.expectedBalance, actualBalance: body.actualBalance,
        discrepancy: Math.abs(discrepancy), hasDiscrepancy: Math.abs(discrepancy) > 0.01,
        totalDeposits: body.totalDeposits ?? 0, totalDisbursements: body.totalDisbursements ?? 0,
        totalHolds: body.totalHolds ?? 0, status: 'DRAFT',
      },
    });
    return reply.code(201).send({ reconciliation: recon });
  });

  fastify.get('/escrow-reconciliations', async (request, reply) => {
    const { projectId } = request.query as any;
    if (!projectId) return reply.code(400).send({ error: 'projectId required' });
    const reconciliations = await prisma.escrowReconciliation.findMany({
      where: { projectId }, orderBy: { periodEnd: 'desc' },
    });
    return reply.send({ reconciliations });
  });
}
