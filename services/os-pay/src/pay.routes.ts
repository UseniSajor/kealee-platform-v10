/**
 * Pay Routes — /api/v1/payments
 *
 * Milestone payments, escrow, draw requests, invoices,
 * lien waivers, reconciliation, and financial reporting.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { payService } from './pay.service';

// ── Shared Schemas ─────────────────────────────────────────────

const projectIdParam = z.object({ projectId: z.string().uuid() });
const idParam = z.object({ id: z.string().uuid() });

// ── Route Registration ─────────────────────────────────────────

export async function payRoutes(fastify: FastifyInstance) {

  // ============================================================================
  // MILESTONE PAYMENT ENDPOINTS
  // ============================================================================

  // POST /projects/:projectId/milestones — create milestone schedule
  fastify.post('/projects/:projectId/milestones', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const body = z.object({
      contractId: z.string().uuid(),
      milestones: z.array(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        amount: z.number().positive(),
        dependsOnId: z.string().uuid().optional(),
      })).min(1),
    }).parse(request.body);

    const result = await payService.createMilestoneSchedule(projectId, body);
    return reply.code(201).send(result);
  });

  // GET /projects/:projectId/milestones — list milestones
  fastify.get('/projects/:projectId/milestones', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const q = request.query as any;
    const result = await payService.listMilestones(projectId, {
      contractId: q.contractId,
      status: q.status,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return reply.send(result);
  });

  // GET /projects/:projectId/milestones/:id — get milestone detail
  fastify.get('/projects/:projectId/milestones/:id', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const milestone = await payService.getMilestone(id);
    if (!milestone) return reply.code(404).send({ error: 'Milestone not found' });
    return reply.send({ milestone });
  });

  // PATCH /projects/:projectId/milestones/:id/status — update milestone status
  fastify.patch('/projects/:projectId/milestones/:id/status', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({
      status: z.enum([
        'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISPUTED', 'PAID',
      ]),
      approvedBy: z.string().uuid().optional(),
      notes: z.string().optional(),
    }).parse(request.body);

    const milestone = await payService.updateMilestoneStatus(id, body.status, {
      approvedBy: body.approvedBy,
      notes: body.notes,
    });
    return reply.send({ milestone });
  });

  // POST /projects/:projectId/milestones/:id/release — release milestone payment
  fastify.post('/projects/:projectId/milestones/:id/release', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({
      initiatedBy: z.string().uuid(),
      skipHoldback: z.boolean().optional(),
      notes: z.string().optional(),
    }).parse(request.body);

    const result = await payService.releaseMilestonePayment(id, body.initiatedBy, {
      skipHoldback: body.skipHoldback,
      notes: body.notes,
    });
    return reply.send(result);
  });

  // GET /projects/:projectId/milestones/:id/can-release — check if payable
  fastify.get('/projects/:projectId/milestones/:id/can-release', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const result = await payService.canReleaseMilestonePayment(id);
    return reply.send(result);
  });

  // GET /projects/:projectId/milestones/:id/breakdown — payment breakdown
  fastify.get('/projects/:projectId/milestones/:id/breakdown', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const q = request.query as any;
    const milestone = await payService.getMilestone(id);
    if (!milestone) return reply.code(404).send({ error: 'Milestone not found' });

    const holdbackPct = q.holdbackPercentage ? parseFloat(q.holdbackPercentage) : undefined;
    const breakdown = payService.calculatePaymentBreakdown(
      Number(milestone.amount),
      holdbackPct,
    );
    return reply.send({ milestoneId: id, ...breakdown });
  });

  // ============================================================================
  // ESCROW ENDPOINTS
  // ============================================================================

  // POST /projects/:projectId/escrow — create escrow agreement
  fastify.post('/projects/:projectId/escrow', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const body = z.object({
      contractId: z.string().uuid(),
      totalContractAmount: z.number().positive(),
      holdbackPercentage: z.number().min(0).max(100).optional(),
      currency: z.string().length(3).optional(),
    }).parse(request.body);

    const escrow = await payService.createEscrowAgreement(projectId, body);
    return reply.code(201).send({ escrow });
  });

  // GET /projects/:projectId/escrow — get escrow agreement
  fastify.get('/projects/:projectId/escrow', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const escrow = await payService.getEscrowAgreement(projectId);
    if (!escrow) return reply.code(404).send({ error: 'Escrow agreement not found' });
    return reply.send({ escrow });
  });

  // POST /projects/:projectId/escrow/deposit — record deposit
  fastify.post('/projects/:projectId/escrow/deposit', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const body = z.object({
      amount: z.number().positive(),
      reference: z.string().optional(),
      initiatedBy: z.string().uuid(),
      metadata: z.record(z.any()).optional(),
    }).parse(request.body);

    const transaction = await payService.recordEscrowDeposit(projectId, body);
    return reply.code(201).send({ transaction });
  });

  // POST /projects/:projectId/escrow/hold — place hold
  fastify.post('/projects/:projectId/escrow/hold', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const body = z.object({
      amount: z.number().positive(),
      reason: z.enum(['DISPUTE', 'COMPLIANCE', 'MANUAL', 'LIEN']),
      notes: z.string().optional(),
      expiresAt: z.string().datetime().optional(),
      placedBy: z.string().uuid(),
    }).parse(request.body);

    const hold = await payService.placeEscrowHold(projectId, body);
    return reply.code(201).send({ hold });
  });

  // POST /projects/:projectId/escrow/holds/:id/release — release hold
  fastify.post('/projects/:projectId/escrow/holds/:id/release', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({
      releasedBy: z.string().uuid(),
      notes: z.string().optional(),
    }).parse(request.body);

    const hold = await payService.releaseEscrowHold(id, body);
    return reply.send({ hold });
  });

  // GET /projects/:projectId/escrow/transactions — list escrow transactions
  fastify.get('/projects/:projectId/escrow/transactions', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const q = request.query as any;
    const result = await payService.listEscrowTransactions(projectId, {
      type: q.type,
      status: q.status,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return reply.send(result);
  });

  // ============================================================================
  // DRAW REQUEST ENDPOINTS
  // ============================================================================

  // POST /projects/:projectId/draws — create draw request
  fastify.post('/projects/:projectId/draws', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const body = z.object({
      drawNumber: z.number().int().positive().optional(),
      periodEnd: z.string().datetime().optional(),
      description: z.string().optional(),
      scheduledAmount: z.number().positive(),
      previouslyBilled: z.number().min(0).optional(),
      currentBilling: z.number().positive(),
      retainage: z.number().min(0).max(100).optional(),
      notes: z.string().optional(),
      createdBy: z.string().uuid().optional(),
    }).parse(request.body);

    const draw = await payService.createDrawRequest(projectId, body);
    return reply.code(201).send({ draw });
  });

  // GET /projects/:projectId/draws — list draw requests
  fastify.get('/projects/:projectId/draws', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const q = request.query as any;
    const result = await payService.listDrawRequests(projectId, {
      status: q.status,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return reply.send(result);
  });

  // GET /projects/:projectId/draws/:id — get draw request detail
  fastify.get('/projects/:projectId/draws/:id', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const draw = await payService.getDrawRequest(id);
    if (!draw) return reply.code(404).send({ error: 'Draw request not found' });
    return reply.send({ draw });
  });

  // PATCH /projects/:projectId/draws/:id/status — update draw request status
  fastify.patch('/projects/:projectId/draws/:id/status', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({
      status: z.enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'FUNDED', 'REJECTED']),
      rejectedReason: z.string().optional(),
      aiaDocumentUrl: z.string().url().optional(),
      notes: z.string().optional(),
    }).parse(request.body);

    const draw = await payService.updateDrawRequestStatus(id, body.status, {
      rejectedReason: body.rejectedReason,
      aiaDocumentUrl: body.aiaDocumentUrl,
      notes: body.notes,
    });
    return reply.send({ draw });
  });

  // ============================================================================
  // INVOICE ENDPOINTS
  // ============================================================================

  // POST /projects/:projectId/invoices — create invoice
  fastify.post('/projects/:projectId/invoices', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const body = z.object({
      amount: z.number().positive(),
      description: z.string().optional(),
      dueDate: z.string().datetime().optional(),
      invoiceNumber: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }).parse(request.body);

    const invoice = await payService.createInvoice(projectId, body);
    return reply.code(201).send({ invoice });
  });

  // GET /projects/:projectId/invoices — list invoices
  fastify.get('/projects/:projectId/invoices', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const q = request.query as any;
    const result = await payService.listInvoices(projectId, {
      status: q.status,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return reply.send(result);
  });

  // PATCH /projects/:projectId/invoices/:id/status — update invoice status
  fastify.patch('/projects/:projectId/invoices/:id/status', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({
      status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']),
      paidAt: z.string().datetime().optional(),
      hostedInvoiceUrl: z.string().url().optional(),
      invoicePdf: z.string().url().optional(),
    }).parse(request.body);

    const invoice = await payService.updateInvoiceStatus(id, body.status, {
      paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
      hostedInvoiceUrl: body.hostedInvoiceUrl,
      invoicePdf: body.invoicePdf,
    });
    return reply.send({ invoice });
  });

  // ============================================================================
  // LIEN WAIVER ENDPOINTS
  // ============================================================================

  // POST /projects/:projectId/lien-waivers — create lien waiver
  fastify.post('/projects/:projectId/lien-waivers', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const body = z.object({
      contractId: z.string().uuid(),
      milestoneId: z.string().uuid().optional(),
      escrowTransactionId: z.string().uuid().optional(),
      waiverType: z.enum(['CONDITIONAL', 'UNCONDITIONAL']),
      waiverScope: z.enum(['PARTIAL', 'FINAL']),
      projectName: z.string().min(1),
      projectAddress: z.string().min(1),
      state: z.string().min(2).max(2),
      claimantName: z.string().min(1),
      claimantAddress: z.string().min(1),
      claimantEmail: z.string().email().optional(),
      claimantPhone: z.string().optional(),
      ownerName: z.string().min(1),
      ownerAddress: z.string().optional(),
      throughDate: z.string().datetime(),
      waiverAmount: z.number().positive(),
      cumulativeAmount: z.number().positive(),
      createdBy: z.string().uuid(),
      metadata: z.record(z.any()).optional(),
    }).parse(request.body);

    const waiver = await payService.createLienWaiver(projectId, body);
    return reply.code(201).send({ waiver });
  });

  // GET /projects/:projectId/lien-waivers — list lien waivers
  fastify.get('/projects/:projectId/lien-waivers', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const q = request.query as any;
    const result = await payService.listLienWaivers(projectId, {
      status: q.status,
      milestoneId: q.milestoneId,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return reply.send(result);
  });

  // PATCH /projects/:projectId/lien-waivers/:id/status — update lien waiver status
  fastify.patch('/projects/:projectId/lien-waivers/:id/status', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({
      status: z.enum(['GENERATED', 'SENT', 'SIGNED', 'RECORDED', 'EXPIRED']),
      signedDocumentUrl: z.string().url().optional(),
      documentUrl: z.string().url().optional(),
    }).parse(request.body);

    const waiver = await payService.updateLienWaiverStatus(id, body.status, {
      signedDocumentUrl: body.signedDocumentUrl,
      documentUrl: body.documentUrl,
    });
    return reply.send({ waiver });
  });

  // ============================================================================
  // PAYMENT PROCESSING ENDPOINTS
  // ============================================================================

  // POST /projects/:projectId/payments — create payment
  fastify.post('/projects/:projectId/payments', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const body = z.object({
      amount: z.number().positive(),
      currency: z.string().optional(),
      description: z.string().optional(),
      stripePaymentIntentId: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }).parse(request.body);

    const payment = await payService.createPayment({ projectId, ...body });
    return reply.code(201).send({ payment });
  });

  // GET /projects/:projectId/payments — list payments
  fastify.get('/projects/:projectId/payments', async (request, reply) => {
    const { projectId } = projectIdParam.parse(request.params);
    const q = request.query as any;
    const result = await payService.listPayments(projectId, {
      status: q.status,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
      startDate: q.startDate,
      endDate: q.endDate,
    });
    return reply.send(result);
  });

  // POST /projects/:projectId/payments/:id/refund — process refund
  fastify.post('/projects/:projectId/payments/:id/refund', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({
      amount: z.number().positive().optional(),
      reason: z.string().optional(),
    }).parse(request.body);

    const payment = await payService.processRefund(id, body);
    return reply.send({ payment });
  });

  // ============================================================================
  // RECONCILIATION ENDPOINTS
  // ============================================================================

  // POST /reconciliation/escrow/:id — reconcile single escrow
  fastify.post('/reconciliation/escrow/:id', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const result = await payService.reconcileEscrowBalances(id);
    return reply.send(result);
  });

  // POST /reconciliation/all — reconcile all active escrows
  fastify.post('/reconciliation/all', async (request, reply) => {
    const result = await payService.reconcileAll();
    return reply.send(result);
  });

  // GET /reconciliation/trust-compliance — trust account compliance summary
  fastify.get('/reconciliation/trust-compliance', async (request, reply) => {
    const result = await payService.getTrustAccountCompliance();
    return reply.send(result);
  });

  // ============================================================================
  // FINANCIAL REPORTING ENDPOINTS
  // ============================================================================

  // GET /reports/summary/:projectId — project financial summary
  fastify.get('/reports/summary/:projectId', async (request, reply) => {
    const { projectId } = z.object({
      projectId: z.string().uuid(),
    }).parse(request.params);

    const summary = await payService.getProjectFinancialSummary(projectId);
    return reply.send(summary);
  });

  // GET /reports/revenue — revenue recognition summary
  fastify.get('/reports/revenue', async (request, reply) => {
    const q = request.query as any;
    const result = await payService.getRevenueRecognitionSummary({
      startDate: q.startDate,
      endDate: q.endDate,
    });
    return reply.send(result);
  });
}
