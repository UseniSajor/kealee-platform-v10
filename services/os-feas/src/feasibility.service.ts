/**
 * Feasibility Study Service — CRUD + proforma generation
 * Uses Prisma directly (same pattern as all other services)
 */

import { PrismaClient, FeasibilityStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ── Helpers ──

function toNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  return typeof val === 'number' ? val : Number(val);
}

/**
 * Newton-Raphson IRR approximation.
 * cashFlows[0] is the initial investment (negative), rest are yearly net cash flows.
 */
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
  return rate; // best guess after max iterations
}

// ── Service Methods ──

async function createStudy(data: {
  orgId: string;
  projectId?: string;
  parcelId?: string;
  title: string;
  description?: string;
  landCost?: number;
  targetUnits?: number;
  targetSqFt?: number;
  productType?: string;
  constructionType?: string;
  createdBy?: string;
}) {
  return prisma.feasibilityStudy.create({
    data: {
      orgId: data.orgId,
      projectId: data.projectId,
      parcelId: data.parcelId,
      title: data.title,
      description: data.description,
      landCost: data.landCost,
      targetUnits: data.targetUnits,
      targetSqFt: data.targetSqFt,
      productType: data.productType,
      constructionType: data.constructionType,
      createdBy: data.createdBy,
      status: 'DRAFT',
    },
    include: {
      scenarios: true,
      costAssumptions: true,
      revenueAssumptions: true,
      comparisons: true,
    },
  });
}

async function getStudy(id: string) {
  return prisma.feasibilityStudy.findUnique({
    where: { id },
    include: {
      scenarios: { orderBy: { sortOrder: 'asc' } },
      costAssumptions: { orderBy: { sortOrder: 'asc' } },
      revenueAssumptions: { orderBy: { sortOrder: 'asc' } },
      comparisons: { orderBy: { createdAt: 'desc' } },
    },
  });
}

async function listStudies(
  orgId: string,
  options?: { status?: FeasibilityStatus; limit?: number; offset?: number }
) {
  const where: any = { orgId };
  if (options?.status) where.status = options.status;

  const [studies, total] = await Promise.all([
    prisma.feasibilityStudy.findMany({
      where,
      include: { scenarios: { select: { id: true, name: true, irr: true, roi: true } } },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.feasibilityStudy.count({ where }),
  ]);

  return { studies, total };
}

async function updateStudy(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: FeasibilityStatus;
    landCost?: number;
    targetUnits?: number;
    targetSqFt?: number;
    productType?: string;
    constructionType?: string;
    projectId?: string;
    parcelId?: string;
  }
) {
  return prisma.feasibilityStudy.update({
    where: { id },
    data,
    include: {
      scenarios: true,
      costAssumptions: true,
      revenueAssumptions: true,
      comparisons: true,
    },
  });
}

async function addScenario(
  studyId: string,
  data: {
    name: string;
    description?: string;
    isBaseline?: boolean;
    sortOrder?: number;
    unitMix?: any;
    totalUnits?: number;
    totalSqFt?: number;
    landCost?: number;
    hardCosts?: number;
    softCosts?: number;
    contingency?: number;
    totalDevelopCost?: number;
    costPerUnit?: number;
    costPerSqFt?: number;
    grossRevenue?: number;
    grossRentalIncome?: number;
    vacancyRate?: number;
    effectiveGrossIncome?: number;
    operatingExpenses?: number;
    netOperatingIncome?: number;
    irr?: number;
    roi?: number;
    cashOnCash?: number;
    capRate?: number;
    equityMultiple?: number;
    paybackMonths?: number;
    proformaYears?: number;
  }
) {
  return prisma.feasibilityScenario.create({
    data: {
      studyId,
      name: data.name,
      description: data.description,
      isBaseline: data.isBaseline ?? false,
      sortOrder: data.sortOrder ?? 0,
      unitMix: data.unitMix,
      totalUnits: data.totalUnits ?? 0,
      totalSqFt: data.totalSqFt,
      landCost: data.landCost,
      hardCosts: data.hardCosts,
      softCosts: data.softCosts,
      contingency: data.contingency,
      totalDevelopCost: data.totalDevelopCost,
      costPerUnit: data.costPerUnit,
      costPerSqFt: data.costPerSqFt,
      grossRevenue: data.grossRevenue,
      grossRentalIncome: data.grossRentalIncome,
      vacancyRate: data.vacancyRate,
      effectiveGrossIncome: data.effectiveGrossIncome,
      operatingExpenses: data.operatingExpenses,
      netOperatingIncome: data.netOperatingIncome,
      irr: data.irr,
      roi: data.roi,
      cashOnCash: data.cashOnCash,
      capRate: data.capRate,
      equityMultiple: data.equityMultiple,
      paybackMonths: data.paybackMonths,
      proformaYears: data.proformaYears ?? 10,
    },
  });
}

async function updateScenario(
  id: string,
  data: {
    name?: string;
    description?: string;
    isBaseline?: boolean;
    sortOrder?: number;
    unitMix?: any;
    totalUnits?: number;
    totalSqFt?: number;
    landCost?: number;
    hardCosts?: number;
    softCosts?: number;
    contingency?: number;
    totalDevelopCost?: number;
    costPerUnit?: number;
    costPerSqFt?: number;
    grossRevenue?: number;
    grossRentalIncome?: number;
    vacancyRate?: number;
    effectiveGrossIncome?: number;
    operatingExpenses?: number;
    netOperatingIncome?: number;
    irr?: number;
    roi?: number;
    cashOnCash?: number;
    capRate?: number;
    equityMultiple?: number;
    paybackMonths?: number;
    proformaYears?: number;
  }
) {
  return prisma.feasibilityScenario.update({
    where: { id },
    data,
  });
}

async function addCostAssumption(
  studyId: string,
  data: {
    category: string;
    subcategory?: string;
    lineItem: string;
    amount: number;
    unit?: string;
    quantity?: number;
    totalCost?: number;
    source?: string;
    confidence?: number;
    notes?: string;
    sortOrder?: number;
  }
) {
  return prisma.feasibilityCostAssumption.create({
    data: {
      studyId,
      category: data.category,
      subcategory: data.subcategory,
      lineItem: data.lineItem,
      amount: data.amount,
      unit: data.unit,
      quantity: data.quantity,
      totalCost: data.totalCost,
      source: data.source,
      confidence: data.confidence,
      notes: data.notes,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

async function addRevenueAssumption(
  studyId: string,
  data: {
    unitType: string;
    unitCount: number;
    avgSqFt?: number;
    pricePerUnit?: number;
    pricePerSqFt?: number;
    monthlyRent?: number;
    annualEscalation?: number;
    stabilizedOccupancy?: number;
    absorptionMonths?: number;
    notes?: string;
    sortOrder?: number;
  }
) {
  return prisma.feasibilityRevenueAssumption.create({
    data: {
      studyId,
      unitType: data.unitType,
      unitCount: data.unitCount,
      avgSqFt: data.avgSqFt,
      pricePerUnit: data.pricePerUnit,
      pricePerSqFt: data.pricePerSqFt,
      monthlyRent: data.monthlyRent,
      annualEscalation: data.annualEscalation,
      stabilizedOccupancy: data.stabilizedOccupancy,
      absorptionMonths: data.absorptionMonths,
      notes: data.notes,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

async function addComparison(
  studyId: string,
  data: {
    projectName: string;
    address?: string;
    completedAt?: string;
    productType?: string;
    totalUnits?: number;
    totalSqFt?: number;
    totalCost?: number;
    costPerUnit?: number;
    costPerSqFt?: number;
    avgSalePrice?: number;
    avgRent?: number;
    capRate?: number;
    similarity?: number;
    notes?: string;
    sourceUrl?: string;
  }
) {
  return prisma.feasibilityComparison.create({
    data: {
      studyId,
      projectName: data.projectName,
      address: data.address,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      productType: data.productType,
      totalUnits: data.totalUnits,
      totalSqFt: data.totalSqFt,
      totalCost: data.totalCost,
      costPerUnit: data.costPerUnit,
      costPerSqFt: data.costPerSqFt,
      avgSalePrice: data.avgSalePrice,
      avgRent: data.avgRent,
      capRate: data.capRate,
      similarity: data.similarity,
      notes: data.notes,
      sourceUrl: data.sourceUrl,
    },
  });
}

/**
 * Generate a 10-year DCF proforma from scenario data.
 * - 3% annual escalation on rental income and operating expenses
 * - NOI = Effective Gross Income - Operating Expenses
 * - IRR, ROI, Cap Rate, Cash-on-Cash calculated from projected cash flows
 */
async function generateProforma(scenarioId: string) {
  const scenario = await prisma.feasibilityScenario.findUniqueOrThrow({
    where: { id: scenarioId },
    include: {
      study: {
        include: {
          revenueAssumptions: true,
          costAssumptions: true,
        },
      },
    },
  });

  const years = scenario.proformaYears || 10;
  const escalation = 0.03; // 3% annual escalation

  // Total development cost is the initial investment
  const totalDevelopCost = toNumber(scenario.totalDevelopCost) ||
    (toNumber(scenario.landCost) + toNumber(scenario.hardCosts) + toNumber(scenario.softCosts) + toNumber(scenario.contingency));

  // Year-1 revenue: sum of all revenue assumptions' monthly rent * 12 * unit count
  let year1GrossRental = 0;
  for (const rev of scenario.study.revenueAssumptions) {
    const monthly = toNumber(rev.monthlyRent);
    year1GrossRental += monthly * rev.unitCount * 12;
  }
  // Fallback to scenario-level grossRentalIncome (monthly -> annual)
  if (year1GrossRental === 0) {
    year1GrossRental = toNumber(scenario.grossRentalIncome) * 12;
  }

  const vacancyRate = scenario.vacancyRate ?? 5; // default 5%
  const year1OpEx = toNumber(scenario.operatingExpenses);

  // Build year-by-year projection
  const proformaYears: Array<{
    year: number;
    grossRentalIncome: number;
    vacancyLoss: number;
    effectiveGrossIncome: number;
    operatingExpenses: number;
    netOperatingIncome: number;
    cumulativeCashFlow: number;
  }> = [];

  const cashFlows: number[] = [-totalDevelopCost]; // year 0
  let cumulativeCF = -totalDevelopCost;

  for (let y = 1; y <= years; y++) {
    const escalationFactor = Math.pow(1 + escalation, y - 1);
    const grossRental = year1GrossRental * escalationFactor;
    const vacancy = grossRental * (vacancyRate / 100);
    const egi = grossRental - vacancy;
    const opEx = year1OpEx * escalationFactor;
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

  // Calculate return metrics
  const year1NOI = proformaYears[0]?.netOperatingIncome ?? 0;
  const totalNOI = proformaYears.reduce((sum, y) => sum + y.netOperatingIncome, 0);
  const irr = calculateIRR(cashFlows);
  const roi = totalDevelopCost > 0 ? (totalNOI / totalDevelopCost) * 100 : 0;
  const capRate = totalDevelopCost > 0 ? (year1NOI / totalDevelopCost) * 100 : 0;
  const cashOnCash = totalDevelopCost > 0 ? (year1NOI / totalDevelopCost) * 100 : 0;

  // Find payback month
  let paybackMonths: number | null = null;
  if (year1NOI > 0) {
    const monthlyNOI = year1NOI / 12;
    paybackMonths = Math.ceil(totalDevelopCost / monthlyNOI);
  }

  // Update scenario with proforma and metrics
  const updated = await prisma.feasibilityScenario.update({
    where: { id: scenarioId },
    data: {
      proforma: proformaYears as any,
      netOperatingIncome: year1NOI,
      effectiveGrossIncome: proformaYears[0]?.effectiveGrossIncome,
      irr: irr !== null ? Math.round(irr * 10000) / 100 : null, // as percentage
      roi: Math.round(roi * 100) / 100,
      capRate: Math.round(capRate * 100) / 100,
      cashOnCash: Math.round(cashOnCash * 100) / 100,
      paybackMonths,
    },
  });

  return {
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
  };
}

async function makeDecision(
  studyId: string,
  decision: 'GO' | 'NO_GO' | 'CONDITIONAL',
  decisionBy: string,
  notes?: string
) {
  const statusMap: Record<string, FeasibilityStatus> = {
    GO: 'GO',
    NO_GO: 'NO_GO',
    CONDITIONAL: 'ON_HOLD',
  };

  return prisma.feasibilityStudy.update({
    where: { id: studyId },
    data: {
      decision,
      decisionDate: new Date(),
      decisionBy,
      decisionNotes: notes,
      status: statusMap[decision],
    },
    include: {
      scenarios: true,
      costAssumptions: true,
      revenueAssumptions: true,
      comparisons: true,
    },
  });
}

async function updateBestMetrics(studyId: string) {
  const scenarios = await prisma.feasibilityScenario.findMany({
    where: { studyId },
  });

  if (scenarios.length === 0) return null;

  let bestIRR: number | null = null;
  let bestROI: number | null = null;
  let bestNOI: number | null = null;
  let totalProjectCost: number | null = null;

  for (const s of scenarios) {
    if (s.irr !== null && (bestIRR === null || s.irr > bestIRR)) bestIRR = s.irr;
    if (s.roi !== null && (bestROI === null || s.roi > bestROI)) bestROI = s.roi;
    const noi = toNumber(s.netOperatingIncome);
    if (noi > 0 && (bestNOI === null || noi > toNumber(bestNOI))) bestNOI = noi;
    const cost = toNumber(s.totalDevelopCost);
    if (cost > 0 && (totalProjectCost === null || cost > toNumber(totalProjectCost))) totalProjectCost = cost;
  }

  return prisma.feasibilityStudy.update({
    where: { id: studyId },
    data: {
      bestIRR,
      bestROI,
      bestNOI,
      totalProjectCost,
    },
  });
}

export const feasibilityService = {
  createStudy,
  getStudy,
  listStudies,
  updateStudy,
  addScenario,
  updateScenario,
  addCostAssumption,
  addRevenueAssumption,
  addComparison,
  generateProforma,
  makeDecision,
  updateBestMetrics,
};
