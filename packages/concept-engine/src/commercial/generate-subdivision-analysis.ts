/**
 * Subdivision Analysis — For-Sale Financial Model
 *
 * Covers townhome and single-family subdivision projects.
 * Models lot-only sale (horizontal) and build-to-sell options.
 */

import type {
  SubdivisionAnalysisInput,
  SubdivisionAnalysisResult,
  SubdivisionFinancials,
  SubdivisionInfrastructureCost,
  AlternativeScenario,
} from './types';
import { generateSubdivisionLayout } from './subdivision-layout';

// ── Benchmarks ────────────────────────────────────────────────────────────────

const INFRA_COST_PER_LOT: Record<string, number> = {
  townhome:                  14_000,
  single_family_subdivision: 22_000,
};

const HARD_COST_PER_SQFT: Record<string, number> = {
  townhome:                  178,
  single_family_subdivision: 158,
};

const AVG_HOME_SQFT: Record<string, number> = {
  townhome:                  1_650,
  single_family_subdivision: 2_200,
};

const DEFAULT_SALES_PRICE: Record<string, number> = {
  townhome:                  490_000,
  single_family_subdivision: 625_000,
};

const ABSORPTION_PER_MONTH: Record<string, number> = {
  townhome:                  4.5,
  single_family_subdivision: 2.5,
};

const SOFT_COST_PCT    = 0.18;
const CONTINGENCY_PCT  = 0.08;
const OPEX_RATIO       = 0.38;
const MARKET_CAP_RATE  = 0.055;

// ── Main entry point ─────────────────────────────────────────────────────────

export async function generateSubdivisionAnalysis(
  input: SubdivisionAnalysisInput,
): Promise<SubdivisionAnalysisResult> {
  const devType    = input.developmentType;
  const salesPrice = input.targetSalesPrice ?? DEFAULT_SALES_PRICE[devType] ?? 500_000;
  const buildToSell = input.buildToSell ?? true;
  const avgHome    = AVG_HOME_SQFT[devType] ?? 2_000;

  // Generate site layout
  const layout = generateSubdivisionLayout({
    developmentType: devType,
    totalSiteSqFt:   input.lotSizeSqFt,
    targetLotCount:  input.targetLotCount,
    targetLotWidthFt: input.targetLotWidthFt,
  });

  const totalLots = layout.totalLots;

  // Assign per-lot sales prices (corner lots +5%)
  layout.lots.forEach(lot => {
    lot.estimatedSalesPrice = lot.isCornerLot
      ? Math.round(salesPrice * 1.05)
      : salesPrice;
  });

  // Financials
  const financials = computeFinancials({
    landCost:    input.askingPrice,
    totalLots,
    devType,
    salesPrice,
    buildToSell,
    avgHome,
  });

  // Assign phase revenue/cost
  layout.phases.forEach(phase => {
    const phaseLotCount = phase.lots.length;
    const rev  = phaseLotCount * salesPrice;
    const cost = computePhaseCost(phaseLotCount, devType, input.askingPrice / totalLots, buildToSell, avgHome);
    phase.phaseRevenue = rev;
    phase.phaseCost    = cost;
    phase.phaseProfit  = rev - cost;
  });

  const feasibilityScore = scoreFeasibility(financials);

  return {
    feasible: feasibilityScore >= 50,
    feasibilityScore,
    layout,
    financials,
    keyRisks:         buildRisks(financials, layout, devType),
    keyOpportunities: buildOpportunities(financials, layout, devType, salesPrice),
    alternativeScenarios: buildAlternatives(input, layout, salesPrice),
    generatedAt: new Date().toISOString(),
  };
}

// ── Financial calculations ────────────────────────────────────────────────────

function computeFinancials(params: {
  landCost:   number;
  totalLots:  number;
  devType:    string;
  salesPrice: number;
  buildToSell: boolean;
  avgHome:    number;
}): SubdivisionFinancials {
  const { landCost, totalLots, devType, salesPrice, buildToSell, avgHome } = params;

  const infraPerLot = INFRA_COST_PER_LOT[devType] ?? 20_000;
  const totalInfra  = infraPerLot * totalLots;

  const infraCost: SubdivisionInfrastructureCost = {
    siteWorkCost:            Math.round(totalInfra * 0.30),
    streetCost:              Math.round(totalInfra * 0.35),
    utilityCost:             Math.round(totalInfra * 0.25),
    commonAreaCost:          Math.round(totalInfra * 0.05),
    permitAndFeesCost:       Math.round(totalInfra * 0.05),
    totalInfrastructureCost: totalInfra,
    costPerLot:              infraPerLot,
  };

  const costPerSqFt   = buildToSell ? (HARD_COST_PER_SQFT[devType] ?? 165) : 0;
  const totalHard     = buildToSell ? Math.round(costPerSqFt * avgHome * totalLots) : 0;
  const totalSoft     = buildToSell ? Math.round(totalHard * SOFT_COST_PCT) : 0;
  const contingency   = Math.round((totalHard + totalSoft) * CONTINGENCY_PCT);
  const totalDevCost  = landCost + totalInfra + totalHard + totalSoft + contingency;

  const totalRevenue  = totalLots * salesPrice;
  const totalProfit   = totalRevenue - totalDevCost;
  const profitMarginPct = totalRevenue > 0
    ? parseFloat((totalProfit / totalRevenue * 100).toFixed(1))
    : 0;
  const returnOnCost  = totalDevCost > 0
    ? parseFloat((totalProfit / totalDevCost * 100).toFixed(1))
    : 0;

  const absorption      = ABSORPTION_PER_MONTH[devType] ?? 3;
  const selloutMonths   = Math.ceil(totalLots / absorption);

  // Annualised IRR estimate
  const annualReturn    = returnOnCost / (selloutMonths / 12);
  const irr             = parseFloat(Math.min(45, Math.max(8, annualReturn * 0.72)).toFixed(1));
  const equityPct       = 0.30; // 30% equity assumption
  const equityMultiple  = parseFloat(
    (1 + totalProfit / Math.max(1, totalDevCost * equityPct)).toFixed(2),
  );

  return {
    landCost,
    infrastructureCost:         infraCost,
    hardConstructionCostPerUnit: Math.round(costPerSqFt * avgHome),
    totalHardConstructionCost:   totalHard,
    softCostPct:                 SOFT_COST_PCT,
    totalSoftCost:               totalSoft,
    contingencyPct:              CONTINGENCY_PCT,
    contingencyAmount:           contingency,
    totalDevelopmentCost:        totalDevCost,
    averageSalesPrice:           salesPrice,
    totalRevenue,
    totalProfit,
    profitMarginPct,
    returnOnCost,
    irr,
    equityMultiple,
    absorptionRatePerMonth:  absorption,
    estimatedSelloutMonths:  selloutMonths,
  };
}

function computePhaseCost(
  lots: number,
  devType: string,
  landPerLot: number,
  buildToSell: boolean,
  avgHome: number,
): number {
  const infra = (INFRA_COST_PER_LOT[devType] ?? 20_000) * lots;
  const constr = buildToSell
    ? (HARD_COST_PER_SQFT[devType] ?? 165) * avgHome * lots * (1 + SOFT_COST_PCT + CONTINGENCY_PCT)
    : 0;
  return Math.round(landPerLot * lots + infra + constr);
}

function scoreFeasibility(fin: SubdivisionFinancials): number {
  let score = 50;
  if (fin.irr >= 20) score += 20;
  else if (fin.irr >= 15) score += 10;
  else if (fin.irr < 10) score -= 20;

  if (fin.profitMarginPct >= 20) score += 15;
  else if (fin.profitMarginPct < 10) score -= 15;

  if (fin.returnOnCost >= 25) score += 10;
  else if (fin.returnOnCost < 10) score -= 10;

  if (fin.estimatedSelloutMonths <= 24) score += 5;
  else if (fin.estimatedSelloutMonths > 48) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ── Content builders ──────────────────────────────────────────────────────────

function buildRisks(
  fin: SubdivisionFinancials,
  layout: { densityLotsPerAcre: number },
  devType: string,
): string[] {
  const risks: string[] = [];
  if (fin.estimatedSelloutMonths > 36)
    risks.push('Sellout period exceeds 3 years — higher exposure to market cycle risk');
  if (fin.profitMarginPct < 15)
    risks.push('Margin below 15% — limited buffer for cost overruns or price softening');
  if (layout.densityLotsPerAcre > 14)
    risks.push('High density may trigger additional review during entitlement process');
  risks.push('Infrastructure cost increases common with extended permitting timelines');
  risks.push('Buyer financing costs affect absorption rate — interest rate sensitivity');
  risks.push('Municipal impact fees and school fees may exceed initial estimates');
  return risks;
}

function buildOpportunities(
  fin: SubdivisionFinancials,
  layout: { totalLots: number; densityLotsPerAcre: number; phases: { length: number } },
  devType: string,
  salesPrice: number,
): string[] {
  return [
    `${layout.totalLots} for-sale lots at ${layout.densityLotsPerAcre} units/acre`,
    `${fin.profitMarginPct}% profit margin at $${salesPrice.toLocaleString()} ASP`,
    `IRR of ${fin.irr}% over ${fin.estimatedSelloutMonths}-month sellout`,
    `${layout.phases.length}-phase delivery aligns infrastructure spend with sales revenue`,
    devType === 'townhome'
      ? 'Attached townhome product addresses entry-level and downsizer demand'
      : 'Single-family detached — highest-demand for-sale product type',
  ];
}

function buildAlternatives(
  input: SubdivisionAnalysisInput,
  layout: { totalLots: number; grossLotAreaSqFt: number },
  salesPrice: number,
): AlternativeScenario[] {
  const landOnlyPrice = Math.round(salesPrice * 0.22); // rough lot-only land value
  return [
    {
      label: 'Lot-Only Sale (Horizontal — Sell to Builder)',
      developmentType: input.developmentType,
      totalUnits:      layout.totalLots,
      totalGfaSqFt:    layout.grossLotAreaSqFt,
      estimatedNoi:    Math.round(layout.totalLots * landOnlyPrice * 0.68),
      estimatedIrr:    18,
      feasibilityScore: 65,
      pros: [
        'Lower capital requirement — no construction risk',
        'Faster exit — bulk or sequential land sale to a homebuilder',
        'Reduces management complexity',
      ],
      cons: [
        'Lower per-lot margin vs. build-to-sell',
        'Dependent on builder appetite and credit markets',
        'No control over finished product quality or timing',
      ],
    },
    {
      label: 'Build-to-Rent (BTR Community)',
      developmentType: input.developmentType,
      totalUnits:      layout.totalLots,
      totalGfaSqFt:    layout.grossLotAreaSqFt,
      estimatedNoi:    Math.round(
        layout.totalLots *
        (input.developmentType === 'townhome' ? 2_200 : 2_600) *
        12 * (1 - OPEX_RATIO),
      ),
      estimatedIrr:    12,
      feasibilityScore: 60,
      pros: [
        'Recurring rental income with portfolio refinance potential',
        'Hold for long-term appreciation',
        'Strong institutional buyer market for stabilised BTR assets',
      ],
      cons: [
        'Higher upfront capital — full construction required',
        'Property management overhead at scale',
        'Lower initial IRR vs. for-sale',
      ],
    },
    {
      label: 'Increased Yield (Add ADUs per Lot)',
      developmentType: input.developmentType,
      totalUnits:      Math.round(layout.totalLots * 1.4),
      totalGfaSqFt:    layout.grossLotAreaSqFt,
      estimatedNoi:    Math.round(
        layout.totalLots * 1.4 * salesPrice * 0.22,
      ),
      estimatedIrr:    22,
      feasibilityScore: 70,
      pros: [
        'Higher unit count and revenue without increasing land cost',
        'ADU income for buyers improves affordability and absorption',
        'Addresses housing shortage — may unlock density bonuses',
      ],
      cons: [
        'ADU permit required per lot — entitlement risk',
        'Increased infrastructure load (water, sewer)',
        'Longer build timeline per lot',
      ],
    },
  ];
}
