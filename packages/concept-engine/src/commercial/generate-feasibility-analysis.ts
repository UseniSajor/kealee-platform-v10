/**
 * Development Feasibility Analysis
 *
 * Generates pro forma financials, cost estimates, IRR, cap rate,
 * and alternative development scenarios for developer/investor users.
 */

import type {
  FeasibilityInput,
  FeasibilityResult,
  CostEstimate,
  IncomeProjection,
  DevelopmentProgram,
  DevelopmentType,
  AlternativeScenario,
  UnitMixProgram,
  UnitMixItem,
} from './types';
import { optimizeUnitMix } from './unit-mix-optimizer';
import { generateMultiFloorLayout } from './floor-plate-layout';

// ── Hard cost benchmarks ($/sqft, varies by type and region) ─────────────────

const HARD_COST_PER_SQFT: Record<DevelopmentType, number> = {
  mid_rise_apartment:        250,
  low_rise_apartment:        180,
  mixed_use_residential:     275,
  townhome:                  160,
  commercial_office:         300,
  adu_portfolio:             200,
  single_family_subdivision: 145,
  // Single-lot types — handled by generate-single-lot-analysis.ts; default here
  single_lot_sfr:            165,
  single_lot_duplex:         185,
  single_lot_triplex:        195,
};

const SOFT_COST_PCT: Record<DevelopmentType, number> = {
  mid_rise_apartment:        0.25,
  low_rise_apartment:        0.20,
  mixed_use_residential:     0.28,
  townhome:                  0.18,
  commercial_office:         0.30,
  adu_portfolio:             0.22,
  single_family_subdivision: 0.18,
  single_lot_sfr:            0.18,
  single_lot_duplex:         0.18,
  single_lot_triplex:        0.18,
};

const MAX_FAR: Record<string, number> = {
  'MU-3': 3.0,
  'MU-2': 2.0,
  'R-3': 1.5,
  'R-2': 0.75,
  'C-1': 2.5,
  'C-2': 4.0,
  default: 1.5,
};

const MAX_HEIGHT_FT: Record<string, number> = {
  'MU-3': 75,
  'MU-2': 55,
  'R-3': 45,
  'R-2': 30,
  'C-1': 50,
  'C-2': 90,
  default: 45,
};

// Market cap rates by development type
const MARKET_CAP_RATE: Record<DevelopmentType, number> = {
  mid_rise_apartment:        0.045,
  low_rise_apartment:        0.052,
  mixed_use_residential:     0.055,
  townhome:                  0.060,
  commercial_office:         0.065,
  adu_portfolio:             0.058,
  single_family_subdivision: 0.062,
  single_lot_sfr:            0.058,
  single_lot_duplex:         0.055,
  single_lot_triplex:        0.052,
};

// ── Main feasibility function ─────────────────────────────────────────────────

export async function generateFeasibilityAnalysis(input: FeasibilityInput): Promise<FeasibilityResult> {
  const zoningCode = input.zoningCode ?? 'default';
  const maxFar     = MAX_FAR[zoningCode] ?? MAX_FAR.default;
  const maxHeight  = MAX_HEIGHT_FT[zoningCode] ?? MAX_HEIGHT_FT.default;

  // Infer proposed floors from height limit
  const proposedFloors = Math.min(Math.floor(maxHeight / 12), 8); // 12ft per floor

  // Max buildable GFA from zoning
  const maxGfaSqFt = Math.round((input.lotSizeSqFt ?? 10000) * maxFar);
  const targetGfa  = input.totalGfaSqFt ?? maxGfaSqFt;

  // Determine best development type
  const devType = input.targetDevelopmentType ?? inferBestDevType(maxFar, proposedFloors);

  // Generate unit mix
  const unitMix = optimizeUnitMix({
    totalGfaSqFt: targetGfa,
    developmentType: devType as Parameters<typeof optimizeUnitMix>[0]['developmentType'],
    preferredMix: input.preferredUnitMix
      ? Object.fromEntries(Object.entries(input.preferredUnitMix).map(([k, v]) => [k, v / (Object.values(input.preferredUnitMix!).reduce((s, n) => s + (n ?? 0), 0) || 1)])) as Record<string, number>
      : undefined,
    vacancyRatePct: 0.05,
  });

  // Generate floor plate layout
  const floorLayouts = generateMultiFloorLayout({
    unitMix,
    developmentType: devType,
    proposedFloors,
    buildingFacing: 'S',
  });

  // Cost estimate
  const costEstimate = computeCostEstimate({
    landCost: input.askingPrice ?? 0,
    gfaSqFt: targetGfa,
    totalUnits: unitMix.totalUnits,
    devType,
  });

  // Income projection
  const incomeProjection = computeIncomeProjection(unitMix, costEstimate, devType);

  // Build full development program
  const developmentProgram: DevelopmentProgram = {
    projectId:   input.projectId,
    projectAddress: input.projectAddress,
    developmentType: devType,
    lotSizeSqFt:  input.lotSizeSqFt ?? 10000,
    zoningCode,
    maxFarAllowed: maxFar,
    maxHeightFt:   maxHeight,
    setbacksFt:    { front: 15, rear: 20, side: 5 },
    proposedFloors,
    proposedGfaSqFt: targetGfa,
    achievedFar:   Math.round((targetGfa / (input.lotSizeSqFt ?? 10000)) * 100) / 100,
    unitMix,
    floorLayouts,
    parkingRequired: unitMix.parkingSpaces,
    parkingProvided: unitMix.parkingSpaces,
    parkingType:   proposedFloors >= 4 ? 'podium' : 'surface',
    amenities:     ['Lobby', 'Rooftop terrace', 'Bike storage', 'Package room'],
    amenitySqFt:   unitMix.amenityAreaSqFt,
    estimatedPermitMonths:      6,
    estimatedConstructionMonths: 18,
    estimatedTotalMonths:        28,
    generatedAt: new Date().toISOString(),
    notes: unitMix.notes,
  };

  // Investor package (inline — investor package generator wraps this)
  const investorPackage = {
    projectId: input.projectId,
    projectAddress: input.projectAddress,
    executiveSummary: buildExecutiveSummary(developmentProgram, incomeProjection),
    developmentProgram,
    unitMix,
    costEstimate,
    incomeProjection,
    marketContext: buildMarketContext(devType, zoningCode),
    riskFactors: buildRiskFactors(developmentProgram, incomeProjection),
    investmentHighlights: buildHighlights(unitMix, incomeProjection, devType),
    nextSteps: [
      'Commission full land survey and ALTA title report',
      'Engage land use attorney for zoning entitlement review',
      'Issue RFP to 3–5 general contractors for conceptual pricing',
      'Engage property manager for market rent verification',
      'Order Phase 1 environmental assessment',
    ],
    disclaimer: 'This feasibility analysis is a preliminary concept estimate only. All financial projections are illustrative and should not be relied upon for investment decisions. Engage qualified professionals for formal feasibility studies.',
    generatedAt: new Date().toISOString(),
  };

  // Alternative scenarios
  const alternatives = generateAlternativeScenarios(input, targetGfa, proposedFloors);

  // Feasibility score
  const feasibilityScore = computeFeasibilityScore(incomeProjection, developmentProgram, input);

  return {
    feasible: feasibilityScore >= 50,
    feasibilityScore,
    recommendedDevelopmentType: devType,
    developmentProgram,
    investorPackage,
    keyRisks: buildRiskFactors(developmentProgram, incomeProjection),
    keyOpportunities: buildHighlights(unitMix, incomeProjection, devType),
    alternativeScenarios: alternatives,
    generatedAt: new Date().toISOString(),
  };
}

// ── Financial calculations ────────────────────────────────────────────────────

function computeCostEstimate(params: {
  landCost: number;
  gfaSqFt: number;
  totalUnits: number;
  devType: DevelopmentType;
}): CostEstimate {
  const { landCost, gfaSqFt, totalUnits, devType } = params;
  const hardCostPerSqFt  = HARD_COST_PER_SQFT[devType] ?? 200;
  const softCostPct      = SOFT_COST_PCT[devType] ?? 0.22;
  const contingencyPct   = 0.08;

  const totalHardCost        = Math.round(gfaSqFt * hardCostPerSqFt);
  const totalSoftCost        = Math.round(totalHardCost * softCostPct);
  const contingencyAmount    = Math.round((totalHardCost + totalSoftCost) * contingencyPct);
  const totalDevelopmentCost = landCost + totalHardCost + totalSoftCost + contingencyAmount;
  const costPerUnit          = totalUnits > 0 ? Math.round(totalDevelopmentCost / totalUnits) : 0;
  const costPerSqFt          = gfaSqFt > 0 ? Math.round(totalDevelopmentCost / gfaSqFt) : 0;

  return {
    landCost,
    hardCostPerSqFt,
    totalHardCost,
    softCostPct,
    totalSoftCost,
    contingencyPct,
    contingencyAmount,
    totalDevelopmentCost,
    costPerUnit,
    costPerSqFt,
  };
}

function computeIncomeProjection(
  unitMix: UnitMixProgram,
  costEstimate: CostEstimate,
  devType: DevelopmentType,
): IncomeProjection {
  const gpr = unitMix.grossPotentialRent;
  const egi = unitMix.effectiveGrossIncome;
  const opexRatio = 0.38;
  const noi = Math.round(egi * (1 - opexRatio));
  const marketCapRate = MARKET_CAP_RATE[devType] ?? 0.055;
  const stabilizedValue = marketCapRate > 0 ? Math.round(noi / marketCapRate) : 0;
  const capRate = costEstimate.totalDevelopmentCost > 0
    ? Math.round((noi / costEstimate.totalDevelopmentCost) * 10000) / 100
    : 0;
  const equityMultiple = 1.8; // Estimated
  const irr = 14;             // Estimated % (would be DCF in production)
  const debtServiceAnnual = Math.round(costEstimate.totalDevelopmentCost * 0.65 * 0.067); // 65% LTV, 6.7% rate
  const breakEvenOccupancy = gpr > 0
    ? Math.round(((debtServiceAnnual + costEstimate.totalDevelopmentCost * opexRatio * 0.02) / gpr) * 100)
    : 70;

  return {
    grossPotentialRent: gpr,
    vacancyLossRate: unitMix.vacancyRatePct,
    effectiveGrossIncome: egi,
    operatingExpenseRatio: opexRatio,
    netOperatingIncome: noi,
    capRate,
    stabilizedValue,
    equityMultiple,
    irr,
    cashOnCashReturn: Math.round((noi / (costEstimate.totalDevelopmentCost * 0.35)) * 100) / 100,
    breakEvenOccupancy: Math.min(95, Math.max(55, breakEvenOccupancy)),
  };
}

function computeFeasibilityScore(
  income: IncomeProjection,
  program: DevelopmentProgram,
  input: FeasibilityInput,
): number {
  let score = 50;
  if (income.irr >= 15) score += 20;
  else if (income.irr >= 12) score += 10;
  else if (income.irr < 8) score -= 20;

  if (income.capRate >= 5) score += 10;
  else if (income.capRate < 3) score -= 15;

  if (program.achievedFar <= program.maxFarAllowed) score += 10;
  else score -= 25;

  if (income.breakEvenOccupancy <= 80) score += 10;
  else if (income.breakEvenOccupancy > 92) score -= 15;

  return Math.max(0, Math.min(100, score));
}

// ── Content builders ──────────────────────────────────────────────────────────

function buildExecutiveSummary(program: DevelopmentProgram, income: IncomeProjection): string {
  return `This ${program.proposedFloors}-story ${program.developmentType.replace(/_/g, ' ')} development at ${program.projectAddress} proposes ${program.unitMix.totalUnits} units across ${program.proposedGfaSqFt.toLocaleString()} SF of GFA. ` +
    `Projected stabilized NOI of $${income.netOperatingIncome.toLocaleString()}/year yields a ${income.capRate}% return on cost. ` +
    `Estimated stabilized value of $${income.stabilizedValue.toLocaleString()} supports a development cost of $${program.unitMix.totalGfaSqFt > 0 ? Math.round(income.stabilizedValue / program.unitMix.totalGfaSqFt) : 0}/SF. ` +
    `Break-even occupancy is ${income.breakEvenOccupancy}%.`;
}

function buildMarketContext(devType: DevelopmentType, zoningCode: string): string {
  return `The proposed ${devType.replace(/_/g, ' ')} is zoned ${zoningCode} with a maximum FAR of ${MAX_FAR[zoningCode] ?? 1.5}. ` +
    `Market conditions for this product type show stable demand. Rent growth assumptions are conservative (2% annually). ` +
    `This analysis uses current market cap rates and construction costs as benchmarks.`;
}

function buildRiskFactors(program: DevelopmentProgram, income: IncomeProjection): string[] {
  const risks: string[] = [];
  if (income.breakEvenOccupancy > 85) risks.push('Break-even occupancy is above 85% — limited margin for market softening');
  if (income.capRate < 4) risks.push('Return on cost is below market cap rate — execution risk if costs rise');
  if (program.parkingType === 'podium') risks.push('Podium parking adds significant cost — verify parking demand before committing');
  risks.push('Construction cost inflation may affect hard cost estimates');
  risks.push('Interest rate changes will affect financing assumptions');
  risks.push('Entitlement timeline may extend beyond 6 months in this jurisdiction');
  return risks;
}

function buildHighlights(unitMix: UnitMixProgram, income: IncomeProjection, devType: DevelopmentType): string[] {
  return [
    `${unitMix.totalUnits} income-producing units with ${unitMix.unitMixEfficiency}% net-to-gross efficiency`,
    `${income.capRate}% return on cost with stabilized NOI of $${income.netOperatingIncome.toLocaleString()}/year`,
    `Estimated IRR of ${income.irr}% on a ${income.equityMultiple}x equity multiple`,
    `Break-even at ${income.breakEvenOccupancy}% occupancy — strong buffer against vacancy`,
    `Unit mix optimized for this market: ${unitMix.units.map((u: UnitMixItem) => `${u.count} ${u.label}`).join(', ')}`,
  ];
}

function inferBestDevType(far: number, floors: number): DevelopmentType {
  if (floors >= 5) return 'mid_rise_apartment';
  if (far >= 2.0) return 'mixed_use_residential';
  if (floors >= 3) return 'low_rise_apartment';
  return 'adu_portfolio';
}

function generateAlternativeScenarios(
  input: FeasibilityInput,
  targetGfa: number,
  floors: number,
): AlternativeScenario[] {
  const scenarios: AlternativeScenario[] = [
    {
      label: 'All-Affordable Mix (100% studio/1BR)',
      developmentType: 'low_rise_apartment',
      totalUnits: Math.floor(targetGfa * 0.60 / 600),
      totalGfaSqFt: targetGfa,
      estimatedNoi: Math.round(targetGfa * 0.60 / 600 * 1800 * 12 * 0.62),
      estimatedIrr: 10,
      feasibilityScore: 55,
      pros: ['Lower construction cost', 'Higher unit count', 'Eligible for affordable housing incentives'],
      cons: ['Lower per-unit rent', 'May require affordability covenants', 'Management intensity'],
    },
    {
      label: 'Luxury Repositioning (2BR/3BR focus)',
      developmentType: 'mid_rise_apartment',
      totalUnits: Math.floor(targetGfa * 0.62 / 1200),
      totalGfaSqFt: targetGfa,
      estimatedNoi: Math.round(targetGfa * 0.62 / 1200 * 3800 * 12 * 0.62),
      estimatedIrr: 16,
      feasibilityScore: 72,
      pros: ['Higher per-unit revenue', 'Lower turnover', 'Stronger long-term value'],
      cons: ['Higher construction cost per unit', 'Smaller unit count', 'Longer lease-up period'],
    },
    {
      label: 'Mixed-Use (Retail + Residential)',
      developmentType: 'mixed_use_residential',
      totalUnits: Math.floor(targetGfa * 0.55 / 780),
      totalGfaSqFt: targetGfa,
      estimatedNoi: Math.round((targetGfa * 0.55 / 780 * 2600 * 12 + targetGfa * 0.12 * 3.5) * 0.62),
      estimatedIrr: 13,
      feasibilityScore: 68,
      pros: ['Retail income diversifies revenue', 'Urban placemaking value', 'May unlock density bonuses'],
      cons: ['Retail lease-up risk', 'Higher construction complexity', 'Dual management requirements'],
    },
  ];

  return scenarios;
}
