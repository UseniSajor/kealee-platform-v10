/**
 * Feasibility Routes — registered in main API gateway
 * Inline CRUD operations using Prisma directly (same pattern as land.routes.ts)
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Helpers ──

function toNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  return typeof val === 'number' ? val : Number(val);
}

function calculateIRR(cashFlows: number[], guess = 0.1, maxIter = 100, tolerance = 1e-6): number | null {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denom;
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-12) return null;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }
  return rate;
}

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

    const study = await prisma.feasibilityStudy.create({
      data: {
        orgId: parsed.data.orgId,
        projectId: parsed.data.projectId,
        parcelId: parsed.data.parcelId,
        title: parsed.data.title,
        description: parsed.data.description,
        landCost: parsed.data.landCost,
        targetUnits: parsed.data.targetUnits,
        targetSqFt: parsed.data.targetSqFt,
        productType: parsed.data.productType,
        constructionType: parsed.data.constructionType,
        createdBy: parsed.data.createdBy,
        status: 'DRAFT',
      },
      include: { scenarios: true, costAssumptions: true, revenueAssumptions: true, comparisons: true },
    });
    return reply.code(201).send({ study });
  });

  // GET /studies — list by orgId
  fastify.get('/studies', async (request, reply) => {
    const q = request.query as any;
    if (!q.orgId) return reply.code(400).send({ error: 'orgId query parameter required' });

    const where: any = { orgId: q.orgId };
    if (q.status) where.status = q.status;

    const [studies, total] = await Promise.all([
      prisma.feasibilityStudy.findMany({
        where,
        include: { scenarios: { select: { id: true, name: true, irr: true, roi: true } } },
        orderBy: { updatedAt: 'desc' },
        take: q.limit ? parseInt(q.limit) : 50,
        skip: q.offset ? parseInt(q.offset) : 0,
      }),
      prisma.feasibilityStudy.count({ where }),
    ]);
    return reply.send({ studies, total });
  });

  // GET /studies/:id — get detail
  fastify.get('/studies/:id', async (request, reply) => {
    const { id } = request.params as any;
    const study = await prisma.feasibilityStudy.findUnique({
      where: { id },
      include: {
        scenarios: { orderBy: { sortOrder: 'asc' } },
        costAssumptions: { orderBy: { sortOrder: 'asc' } },
        revenueAssumptions: { orderBy: { sortOrder: 'asc' } },
        comparisons: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!study) return reply.code(404).send({ error: 'Feasibility study not found' });
    return reply.send({ study });
  });

  // PATCH /studies/:id — update
  fastify.patch('/studies/:id', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = updateStudySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const study = await prisma.feasibilityStudy.update({
      where: { id },
      data: parsed.data,
      include: { scenarios: true, costAssumptions: true, revenueAssumptions: true, comparisons: true },
    });
    return reply.send({ study });
  });

  // POST /studies/:id/scenarios — add scenario
  fastify.post('/studies/:id/scenarios', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = addScenarioSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const d = parsed.data;
    const scenario = await prisma.feasibilityScenario.create({
      data: {
        studyId: id,
        name: d.name,
        description: d.description,
        isBaseline: d.isBaseline ?? false,
        sortOrder: d.sortOrder ?? 0,
        unitMix: d.unitMix,
        totalUnits: d.totalUnits ?? 0,
        totalSqFt: d.totalSqFt,
        landCost: d.landCost,
        hardCosts: d.hardCosts,
        softCosts: d.softCosts,
        contingency: d.contingency,
        totalDevelopCost: d.totalDevelopCost,
        costPerUnit: d.costPerUnit,
        costPerSqFt: d.costPerSqFt,
        grossRevenue: d.grossRevenue,
        grossRentalIncome: d.grossRentalIncome,
        vacancyRate: d.vacancyRate,
        effectiveGrossIncome: d.effectiveGrossIncome,
        operatingExpenses: d.operatingExpenses,
        netOperatingIncome: d.netOperatingIncome,
        irr: d.irr,
        roi: d.roi,
        cashOnCash: d.cashOnCash,
        capRate: d.capRate,
        equityMultiple: d.equityMultiple,
        paybackMonths: d.paybackMonths,
        proformaYears: d.proformaYears ?? 10,
      },
    });
    return reply.code(201).send({ scenario });
  });

  // PATCH /studies/scenarios/:id — update scenario
  fastify.patch('/studies/scenarios/:id', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = updateScenarioSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const scenario = await prisma.feasibilityScenario.update({
      where: { id },
      data: parsed.data,
    });
    return reply.send({ scenario });
  });

  // POST /studies/scenarios/:id/proforma — generate proforma
  fastify.post('/studies/scenarios/:id/proforma', async (request, reply) => {
    const { id } = request.params as any;

    const scenario = await prisma.feasibilityScenario.findUniqueOrThrow({
      where: { id },
      include: {
        study: {
          include: { revenueAssumptions: true, costAssumptions: true },
        },
      },
    });

    const years = scenario.proformaYears || 10;
    const escalation = 0.03;

    const totalDevelopCost = toNumber(scenario.totalDevelopCost) ||
      (toNumber(scenario.landCost) + toNumber(scenario.hardCosts) + toNumber(scenario.softCosts) + toNumber(scenario.contingency));

    let year1GrossRental = 0;
    for (const rev of scenario.study.revenueAssumptions) {
      year1GrossRental += toNumber(rev.monthlyRent) * rev.unitCount * 12;
    }
    if (year1GrossRental === 0) {
      year1GrossRental = toNumber(scenario.grossRentalIncome) * 12;
    }

    const vacancyRate = scenario.vacancyRate ?? 5;
    const year1OpEx = toNumber(scenario.operatingExpenses);

    const proformaYears: Array<{
      year: number;
      grossRentalIncome: number;
      vacancyLoss: number;
      effectiveGrossIncome: number;
      operatingExpenses: number;
      netOperatingIncome: number;
      cumulativeCashFlow: number;
    }> = [];

    const cashFlows: number[] = [-totalDevelopCost];
    let cumulativeCF = -totalDevelopCost;

    for (let y = 1; y <= years; y++) {
      const factor = Math.pow(1 + escalation, y - 1);
      const grossRental = year1GrossRental * factor;
      const vacancy = grossRental * (vacancyRate / 100);
      const egi = grossRental - vacancy;
      const opEx = year1OpEx * factor;
      const noi = egi - opEx;
      cumulativeCF += noi;
      cashFlows.push(noi);
      proformaYears.push({
        year: y,
        grossRentalIncome: Math.round(grossRental * 100) / 100,
        vacancyLoss: Math.round(vacancy * 100) / 100,
        effectiveGrossIncome: Math.round(egi * 100) / 100,
        operatingExpenses: Math.round(opEx * 100) / 100,
        netOperatingIncome: Math.round(noi * 100) / 100,
        cumulativeCashFlow: Math.round(cumulativeCF * 100) / 100,
      });
    }

    const year1NOI = proformaYears[0]?.netOperatingIncome ?? 0;
    const totalNOI = proformaYears.reduce((sum, y) => sum + y.netOperatingIncome, 0);
    const irr = calculateIRR(cashFlows);
    const roi = totalDevelopCost > 0 ? (totalNOI / totalDevelopCost) * 100 : 0;
    const capRate = totalDevelopCost > 0 ? (year1NOI / totalDevelopCost) * 100 : 0;
    const cashOnCash = totalDevelopCost > 0 ? (year1NOI / totalDevelopCost) * 100 : 0;
    let paybackMonths: number | null = null;
    if (year1NOI > 0) paybackMonths = Math.ceil(totalDevelopCost / (year1NOI / 12));

    const updated = await prisma.feasibilityScenario.update({
      where: { id },
      data: {
        proforma: proformaYears as any,
        netOperatingIncome: year1NOI,
        effectiveGrossIncome: proformaYears[0]?.effectiveGrossIncome,
        irr: irr !== null ? Math.round(irr * 10000) / 100 : null,
        roi: Math.round(roi * 100) / 100,
        capRate: Math.round(capRate * 100) / 100,
        cashOnCash: Math.round(cashOnCash * 100) / 100,
        paybackMonths,
      },
    });

    // Update best metrics on the parent study
    const allScenarios = await prisma.feasibilityScenario.findMany({ where: { studyId: scenario.studyId } });
    let bestIRR: number | null = null;
    let bestROI: number | null = null;
    let bestNOI: number | null = null;
    let totalProjectCost: number | null = null;
    for (const s of allScenarios) {
      if (s.irr !== null && (bestIRR === null || s.irr > bestIRR)) bestIRR = s.irr;
      if (s.roi !== null && (bestROI === null || s.roi > bestROI)) bestROI = s.roi;
      const sNOI = toNumber(s.netOperatingIncome);
      if (sNOI > 0 && (bestNOI === null || sNOI > toNumber(bestNOI))) bestNOI = sNOI;
      const sCost = toNumber(s.totalDevelopCost);
      if (sCost > 0 && (totalProjectCost === null || sCost > toNumber(totalProjectCost))) totalProjectCost = sCost;
    }
    await prisma.feasibilityStudy.update({
      where: { id: scenario.studyId },
      data: { bestIRR, bestROI, bestNOI, totalProjectCost },
    });

    return reply.send({
      scenario: updated,
      proforma: proformaYears,
      metrics: {
        totalDevelopCost,
        year1NOI,
        irr: irr !== null ? Math.round(irr * 10000) / 100 : null,
        roi: Math.round(roi * 100) / 100,
        capRate: Math.round(capRate * 100) / 100,
        cashOnCash: Math.round(cashOnCash * 100) / 100,
        paybackMonths,
      },
    });
  });

  // POST /studies/:id/costs — add cost assumption
  fastify.post('/studies/:id/costs', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = addCostAssumptionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const cost = await prisma.feasibilityCostAssumption.create({
      data: {
        studyId: id,
        category: parsed.data.category,
        subcategory: parsed.data.subcategory,
        lineItem: parsed.data.lineItem,
        amount: parsed.data.amount,
        unit: parsed.data.unit,
        quantity: parsed.data.quantity,
        totalCost: parsed.data.totalCost,
        source: parsed.data.source,
        confidence: parsed.data.confidence,
        notes: parsed.data.notes,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });
    return reply.code(201).send({ cost });
  });

  // POST /studies/:id/revenue — add revenue assumption
  fastify.post('/studies/:id/revenue', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = addRevenueAssumptionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const revenue = await prisma.feasibilityRevenueAssumption.create({
      data: {
        studyId: id,
        unitType: parsed.data.unitType,
        unitCount: parsed.data.unitCount,
        avgSqFt: parsed.data.avgSqFt,
        pricePerUnit: parsed.data.pricePerUnit,
        pricePerSqFt: parsed.data.pricePerSqFt,
        monthlyRent: parsed.data.monthlyRent,
        annualEscalation: parsed.data.annualEscalation,
        stabilizedOccupancy: parsed.data.stabilizedOccupancy,
        absorptionMonths: parsed.data.absorptionMonths,
        notes: parsed.data.notes,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });
    return reply.code(201).send({ revenue });
  });

  // POST /studies/:id/comparisons — add comparison
  fastify.post('/studies/:id/comparisons', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = addComparisonSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const d = parsed.data;
    const comparison = await prisma.feasibilityComparison.create({
      data: {
        studyId: id,
        projectName: d.projectName,
        address: d.address,
        completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
        productType: d.productType,
        totalUnits: d.totalUnits,
        totalSqFt: d.totalSqFt,
        totalCost: d.totalCost,
        costPerUnit: d.costPerUnit,
        costPerSqFt: d.costPerSqFt,
        avgSalePrice: d.avgSalePrice,
        avgRent: d.avgRent,
        capRate: d.capRate,
        similarity: d.similarity,
        notes: d.notes,
        sourceUrl: d.sourceUrl,
      },
    });
    return reply.code(201).send({ comparison });
  });

  // POST /studies/:id/decide — make go/no-go decision
  fastify.post('/studies/:id/decide', async (request, reply) => {
    const { id } = request.params as any;
    const parsed = decideSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });

    const statusMap: Record<string, string> = {
      GO: 'GO',
      NO_GO: 'NO_GO',
      CONDITIONAL: 'ON_HOLD',
    };

    const study = await prisma.feasibilityStudy.update({
      where: { id },
      data: {
        decision: parsed.data.decision,
        decisionDate: new Date(),
        decisionBy: parsed.data.decisionBy,
        decisionNotes: parsed.data.notes,
        status: statusMap[parsed.data.decision] as any,
      },
      include: { scenarios: true, costAssumptions: true, revenueAssumptions: true, comparisons: true },
    });
    return reply.send({ study });
  });
}
