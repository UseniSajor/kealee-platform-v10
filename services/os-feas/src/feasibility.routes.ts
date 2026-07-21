/**
 * Feasibility Routes — Fastify plugin for os-feas service
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { feasibilityService } from './feasibility.service';

// ── Zod Schemas ──

const createStudySchema = z.object({
  orgId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  parcelId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  landCost: z.number().nonnegative().optional(),
  targetUnits: z.number().int().nonnegative().optional(),
  targetSqFt: z.number().nonnegative().optional(),
  productType: z.string().optional(),
  constructionType: z.string().optional(),
  createdBy: z.string().uuid().optional(),
});

const updateStudySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'DATA_GATHERING', 'ANALYZING', 'REVIEW', 'GO', 'NO_GO', 'ON_HOLD', 'ARCHIVED']).optional(),
  landCost: z.number().nonnegative().optional(),
  targetUnits: z.number().int().nonnegative().optional(),
  targetSqFt: z.number().nonnegative().optional(),
  productType: z.string().optional(),
  constructionType: z.string().optional(),
  projectId: z.string().uuid().optional(),
  parcelId: z.string().uuid().optional(),
});

const addScenarioSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isBaseline: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  unitMix: z.any(),
  totalUnits: z.number().int().nonnegative().optional(),
  totalSqFt: z.number().nonnegative().optional(),
  landCost: z.number().nonnegative().optional(),
  hardCosts: z.number().nonnegative().optional(),
  softCosts: z.number().nonnegative().optional(),
  contingency: z.number().nonnegative().optional(),
  totalDevelopCost: z.number().nonnegative().optional(),
  costPerUnit: z.number().nonnegative().optional(),
  costPerSqFt: z.number().nonnegative().optional(),
  grossRevenue: z.number().nonnegative().optional(),
  grossRentalIncome: z.number().nonnegative().optional(),
  vacancyRate: z.number().min(0).max(100).optional(),
  effectiveGrossIncome: z.number().nonnegative().optional(),
  operatingExpenses: z.number().nonnegative().optional(),
  netOperatingIncome: z.number().optional(),
  irr: z.number().optional(),
  roi: z.number().optional(),
  cashOnCash: z.number().optional(),
  capRate: z.number().optional(),
  equityMultiple: z.number().optional(),
  paybackMonths: z.number().int().nonnegative().optional(),
  proformaYears: z.number().int().min(1).max(30).optional(),
});

const updateScenarioSchema = addScenarioSchema.partial();

const addCostAssumptionSchema = z.object({
  category: z.string().min(1),
  subcategory: z.string().optional(),
  lineItem: z.string().min(1),
  amount: z.number(),
  unit: z.string().optional(),
  quantity: z.number().optional(),
  totalCost: z.number().optional(),
  source: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const addRevenueAssumptionSchema = z.object({
  unitType: z.string().min(1),
  unitCount: z.number().int().min(1),
  avgSqFt: z.number().nonnegative().optional(),
  pricePerUnit: z.number().nonnegative().optional(),
  pricePerSqFt: z.number().nonnegative().optional(),
  monthlyRent: z.number().nonnegative().optional(),
  annualEscalation: z.number().optional(),
  stabilizedOccupancy: z.number().min(0).max(100).optional(),
  absorptionMonths: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const addComparisonSchema = z.object({
  projectName: z.string().min(1),
  address: z.string().optional(),
  completedAt: z.string().optional(),
  productType: z.string().optional(),
  totalUnits: z.number().int().nonnegative().optional(),
  totalSqFt: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
  costPerUnit: z.number().nonnegative().optional(),
  costPerSqFt: z.number().nonnegative().optional(),
  avgSalePrice: z.number().nonnegative().optional(),
  avgRent: z.number().nonnegative().optional(),
  capRate: z.number().optional(),
  similarity: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

const decideSchema = z.object({
  decision: z.enum(['GO', 'NO_GO', 'CONDITIONAL']),
  decisionBy: z.string().uuid(),
  notes: z.string().optional(),
});

// ── Route Plugin ──

export async function feasibilityRoutes(fastify: FastifyInstance) {
  // POST /studies — create study
  fastify.post('/studies', async (request, reply) => {
    const parsed = createStudySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const study = await feasibilityService.createStudy(parsed.data);
    return reply.code(201).send({ study });
  });

  // GET /studies — list by orgId
  fastify.get('/studies', async (request, reply) => {
    const q = request.query as any;
    if (!q.orgId) return reply.code(400).send({ error: 'orgId query parameter required' });

    const result = await feasibilityService.listStudies(q.orgId, {
      status: q.status,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return reply.send(result);
  });

  // GET /studies/:id — get detail
  fastify.get('/studies/:id', async (request, reply) => {
    const { id } = request.params as any;
    const study = await feasibilityService.getStudy(id);
    if (!study) return reply.code(404).send({ error: 'Feasibility study not found' });
    return reply.send({ study });
  });

  // PATCH /studies/:id — update
  fastify.patch('/studies/:id', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = updateStudySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const study = await feasibilityService.updateStudy(id, parsed.data);
    return reply.send({ study });
  });

  // POST /studies/:id/scenarios — add scenario
  fastify.post('/studies/:id/scenarios', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = addScenarioSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const scenario = await feasibilityService.addScenario(id, parsed.data);
    return reply.code(201).send({ scenario });
  });

  // PATCH /studies/scenarios/:id — update scenario
  fastify.patch('/studies/scenarios/:id', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = updateScenarioSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const scenario = await feasibilityService.updateScenario(id, parsed.data);
    return reply.send({ scenario });
  });

  // POST /studies/scenarios/:id/proforma — generate proforma
  fastify.post('/studies/scenarios/:id/proforma', async (request, reply) => {
    const { id } = request.params as any;
    const result = await feasibilityService.generateProforma(id);

    // Also update best metrics on the parent study
    await feasibilityService.updateBestMetrics(result.scenario.studyId);

    return reply.send(result);
  });

  // POST /studies/:id/costs — add cost assumption
  fastify.post('/studies/:id/costs', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = addCostAssumptionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const cost = await feasibilityService.addCostAssumption(id, parsed.data);
    return reply.code(201).send({ cost });
  });

  // POST /studies/:id/revenue — add revenue assumption
  fastify.post('/studies/:id/revenue', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = addRevenueAssumptionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const revenue = await feasibilityService.addRevenueAssumption(id, parsed.data);
    return reply.code(201).send({ revenue });
  });

  // POST /studies/:id/comparisons — add comparison
  fastify.post('/studies/:id/comparisons', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = addComparisonSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const comparison = await feasibilityService.addComparison(id, parsed.data);
    return reply.code(201).send({ comparison });
  });

  // POST /studies/:id/decide — make go/no-go decision
  fastify.post('/studies/:id/decide', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = decideSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const study = await feasibilityService.makeDecision(id, parsed.data.decision, parsed.data.decisionBy, parsed.data.notes);
    return reply.send({ study });
  });
}
