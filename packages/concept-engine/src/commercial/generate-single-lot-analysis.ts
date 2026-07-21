/**
 * Single-Lot Development Analysis
 *
 * Evaluates SFR, duplex, and triplex options on a single parcel.
 * Returns for-sale and hold/rent financial scenarios side by side.
 */

import type {
  SingleLotAnalysisInput,
  SingleLotAnalysisResult,
  SingleLotAnalysis,
  SingleLotBuildingType,
  SingleLotUnit,
} from './types';

// ── Building type specs ───────────────────────────────────────────────────────

interface BuildingSpec {
  units:          number;
  bedsPerUnit:    number;
  bathsPerUnit:   number;
  areaPerUnit:    number; // sqft
  hardCostPerSqFt: number;
  setbackFront:   number;
  setbackRear:    number;
  setbackSide:    number;
  lotCoverageMax: number; // max lot coverage ratio
  stories:        number;
  defaultRentPerUnit:  number; // $/month
  defaultSalesPrice:   number; // $ per unit (for condo/sale)
}

const BUILDING_SPECS: Record<SingleLotBuildingType, BuildingSpec> = {
  single_family: {
    units: 1, bedsPerUnit: 3, bathsPerUnit: 2,
    areaPerUnit: 1_800, hardCostPerSqFt: 165,
    setbackFront: 20, setbackRear: 25, setbackSide: 5,
    lotCoverageMax: 0.40, stories: 1,
    defaultRentPerUnit: 3_200, defaultSalesPrice: 650_000,
  },
  duplex: {
    units: 2, bedsPerUnit: 2, bathsPerUnit: 2,
    areaPerUnit: 1_100, hardCostPerSqFt: 185,
    setbackFront: 15, setbackRear: 20, setbackSide: 5,
    lotCoverageMax: 0.50, stories: 2,
    defaultRentPerUnit: 2_400, defaultSalesPrice: 475_000,
  },
  triplex: {
    units: 3, bedsPerUnit: 2, bathsPerUnit: 1,
    areaPerUnit: 900, hardCostPerSqFt: 195,
    setbackFront: 15, setbackRear: 20, setbackSide: 5,
    lotCoverageMax: 0.55, stories: 2,
    defaultRentPerUnit: 2_100, defaultSalesPrice: 420_000,
  },
};

const SOFT_COST_PCT   = 0.18;
const CONTINGENCY_PCT = 0.08;
const OPEX_RATIO      = 0.38;
const MARKET_CAP_RATE = 0.052;
const EQUITY_PCT      = 0.30;

// ── Main entry point ─────────────────────────────────────────────────────────

export async function generateSingleLotAnalysis(
  input: SingleLotAnalysisInput,
): Promise<SingleLotAnalysisResult> {
  const buildingTypes: SingleLotBuildingType[] = ['single_family', 'duplex', 'triplex'];

  const scenarios: SingleLotAnalysis[] = buildingTypes.map(bt =>
    analyseOption(bt, input),
  );

  // Recommend highest feasibility score; prefer preferred type if close
  const preferred = input.preferredBuildingType;
  let recommended = scenarios.reduce((best, s) =>
    s.feasibilityScore > best.feasibilityScore ? s : best,
  );
  if (preferred) {
    const prefScenario = scenarios.find(s => s.buildingType === preferred);
    if (prefScenario && prefScenario.feasibilityScore >= recommended.feasibilityScore - 5) {
      recommended = prefScenario;
    }
  }

  return {
    feasible:                 recommended.feasibilityScore >= 50,
    feasibilityScore:         recommended.feasibilityScore,
    recommendedBuildingType:  recommended.buildingType,
    scenarios,
    recommended,
    keyRisks:         buildRisks(recommended, input),
    keyOpportunities: buildOpportunities(recommended),
    generatedAt: new Date().toISOString(),
  };
}

// ── Per-option analyser ───────────────────────────────────────────────────────

function analyseOption(
  buildingType: SingleLotBuildingType,
  input: SingleLotAnalysisInput,
): SingleLotAnalysis {
  const spec       = BUILDING_SPECS[buildingType];
  const lotSqFt    = input.lotSizeSqFt;
  const landCost   = input.askingPrice;
  const intendSell = input.intendToSell ?? true;

  // Buildable footprint after setbacks (assuming rectangular lot, estimate width from area)
  const estimatedLotWidth  = Math.sqrt(lotSqFt / 2.5); // assume 2.5:1 depth:width
  const estimatedLotDepth  = lotSqFt / estimatedLotWidth;
  const bldgWidthFt        = Math.max(10, estimatedLotWidth - spec.setbackSide * 2);
  const bldgDepthFt        = Math.max(10, estimatedLotDepth - spec.setbackFront - spec.setbackRear);
  const buildableFootprint = Math.round(bldgWidthFt * bldgDepthFt);

  const maxCoverage    = Math.round(lotSqFt * spec.lotCoverageMax);
  const footprintUsed  = Math.min(buildableFootprint, maxCoverage);
  const lotCoveragePct = parseFloat((footprintUsed / lotSqFt * 100).toFixed(1));
  const totalAreaSqFt  = spec.areaPerUnit * spec.units;
  const far            = parseFloat((totalAreaSqFt / lotSqFt).toFixed(2));

  // Units
  const salesPricePerUnit = input.targetSalesPrice ?? spec.defaultSalesPrice;
  const rentPerUnit       = input.targetRentPerUnit ?? spec.defaultRentPerUnit;
  const units: SingleLotUnit[] = Array.from({ length: spec.units }, (_, i) => ({
    unitNumber:         i + 1,
    buildingType,
    bedrooms:           spec.bedsPerUnit,
    bathrooms:          spec.bathsPerUnit,
    areaSqFt:           spec.areaPerUnit,
    monthlyRent:        rentPerUnit,
    estimatedSalesPrice: salesPricePerUnit,
  }));

  // Costs
  const totalHard      = Math.round(spec.hardCostPerSqFt * totalAreaSqFt);
  const totalSoft      = Math.round(totalHard * SOFT_COST_PCT);
  const contingency    = Math.round((totalHard + totalSoft) * CONTINGENCY_PCT);
  const totalDevCost   = landCost + totalHard + totalSoft + contingency;
  const costPerUnit    = Math.round(totalDevCost / spec.units);

  // For-sale
  const totalSalesRev  = salesPricePerUnit * spec.units;
  const saleProfit     = totalSalesRev - totalDevCost;
  const saleMargPct    = totalSalesRev > 0
    ? parseFloat((saleProfit / totalSalesRev * 100).toFixed(1))
    : 0;
  const saleIrr        = estimateSaleIrr(saleProfit, totalDevCost, spec.units);

  // Hold / rent
  const gpr            = rentPerUnit * spec.units * 12;
  const egi            = gpr * 0.95;  // 5% vacancy
  const noi            = Math.round(egi * (1 - OPEX_RATIO));
  const capRate        = totalDevCost > 0
    ? parseFloat((noi / totalDevCost * 100).toFixed(2))
    : 0;
  const stabilisedVal  = MARKET_CAP_RATE > 0
    ? Math.round(noi / MARKET_CAP_RATE)
    : 0;
  const debtService    = Math.round(totalDevCost * 0.65 * 0.068);
  const cashOnCash     = totalDevCost * EQUITY_PCT > 0
    ? parseFloat(((noi - debtService) / (totalDevCost * EQUITY_PCT) * 100).toFixed(1))
    : 0;

  // Strategy recommendation
  let recommendedStrategy: SingleLotAnalysis['recommendedStrategy'] = 'sell';
  if (spec.units >= 2 && cashOnCash >= 6) recommendedStrategy = 'hold';
  if (spec.units === 2 && saleProfit > 50_000) recommendedStrategy = 'sell_one_hold_one';

  const feasibilityScore = computeFeasibility({
    saleProfit, saleMargPct, saleIrr, capRate, cashOnCash, spec,
  });

  return {
    buildingType,
    units,
    totalUnits:               spec.units,
    totalAreaSqFt,
    buildableFootprintSqFt:   buildableFootprint,
    lotCoverage:              lotCoveragePct,
    far,
    landCost,
    hardCostTotal:            totalHard,
    softCostTotal:            totalSoft,
    contingencyAmount:        contingency,
    totalDevelopmentCost:     totalDevCost,
    costPerUnit,
    totalSalesRevenue:        totalSalesRev,
    saleProfit,
    saleProfitMarginPct:      saleMargPct,
    saleIrr,
    grossPotentialRent:       gpr,
    netOperatingIncome:       noi,
    capRate,
    stabilizedValue:          stabilisedVal,
    cashOnCashReturn:         cashOnCash,
    feasibilityScore,
    recommendedStrategy,
  };
}

function estimateSaleIrr(profit: number, tdc: number, units: number): number {
  // Simple IRR proxy: profit / TDC annualised over build timeline
  const buildMonths = 8 + units * 3; // ~8-14 months
  const returnPct   = tdc > 0 ? (profit / tdc) * 100 : 0;
  return parseFloat(Math.min(40, Math.max(5, returnPct / (buildMonths / 12) * 0.70)).toFixed(1));
}

function computeFeasibility(p: {
  saleProfit: number;
  saleMargPct: number;
  saleIrr: number;
  capRate: number;
  cashOnCash: number;
  spec: BuildingSpec;
}): number {
  let score = 50;
  if (p.saleIrr >= 20) score += 15;
  else if (p.saleIrr >= 14) score += 8;
  else if (p.saleIrr < 8) score -= 15;

  if (p.saleMargPct >= 20) score += 10;
  else if (p.saleMargPct < 10) score -= 10;

  if (p.capRate >= 5) score += 10;
  else if (p.capRate < 3) score -= 10;

  if (p.cashOnCash >= 6) score += 10;

  // Bonus for multi-unit (more income streams)
  if (p.spec.units >= 2) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ── Content builders ──────────────────────────────────────────────────────────

function buildRisks(analysis: SingleLotAnalysis, input: SingleLotAnalysisInput): string[] {
  const risks: string[] = [];
  if (analysis.far > 1.5) risks.push('FAR may exceed local zoning limits — verify with jurisdiction');
  if (analysis.saleProfit < 50_000) risks.push('Thin profit margin — construction cost overruns could eliminate returns');
  if (analysis.totalUnits >= 3) risks.push('Triplex may require additional fire and egress compliance');
  risks.push('Material and labor cost inflation affects hard cost estimates');
  risks.push('Permit timeline may extend 3–9 months beyond estimate');
  if (input.intendToSell === false) risks.push('Rental income sensitive to local vacancy trends and management costs');
  return risks;
}

function buildOpportunities(analysis: SingleLotAnalysis): string[] {
  const ops: string[] = [
    `${analysis.totalUnits} unit(s) — ${analysis.totalAreaSqFt.toLocaleString()} sf total`,
    `For-sale margin: ${analysis.saleProfitMarginPct}% at $${analysis.totalSalesRevenue.toLocaleString()} revenue`,
    `Hold cap rate: ${analysis.capRate}% with NOI of $${analysis.netOperatingIncome.toLocaleString()}/year`,
  ];
  if (analysis.recommendedStrategy === 'sell_one_hold_one') {
    ops.push('Duplex strategy: sell one unit, hold one for cash flow — best of both worlds');
  }
  if (analysis.totalUnits >= 2) {
    ops.push('Multi-unit provides income diversification — one vacancy does not stop cash flow');
  }
  return ops;
}
