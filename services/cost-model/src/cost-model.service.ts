/**
 * Cost Model Service
 *
 * Callable cost estimation service using 2026 DMV market benchmarks.
 * Wraps estimation-tool data and provides a clean interface for OrgBots and CLAWs.
 *
 * Priority: EstimateBot (KeaBot) → cost model endpoint → this service
 */

export type ProjectType =
  | "single_family_new"
  | "single_family_renovation_major"
  | "single_family_renovation_minor"
  | "multifamily_small"        // 2–12 units
  | "multifamily_mid"          // 13–50 units
  | "multifamily_large"        // 51+ units
  | "commercial_office"
  | "commercial_retail"
  | "mixed_use"
  | "land_development";

export type ComplexityLevel = "low" | "medium" | "high";

export type CostCategory =
  | "SITE_WORK"
  | "CONCRETE"
  | "MASONRY"
  | "METALS"
  | "WOOD_FRAMING"
  | "THERMAL_MOISTURE"
  | "OPENINGS"
  | "FINISHES"
  | "SPECIALTIES"
  | "MEP"
  | "EQUIPMENT"
  | "SITEWORK_UTILITIES"
  | "SOFT_COSTS"
  | "CONTINGENCY";

export interface CostLineItem {
  category: CostCategory;
  description: string;
  unitCost: number;     // $/SF or flat
  unit: "SF" | "LS"    // square foot or lump sum
  quantity: number;
  subtotal: number;
  pct: number;          // % of total hard cost
}

export interface CostModelResult {
  projectType: ProjectType;
  projectSF: number;
  complexity: ComplexityLevel;
  totalHardCost: number;
  totalSoftCost: number;
  totalProjectCost: number;
  costPerSF: number;
  benchmarkLow: number;     // $/SF
  benchmarkHigh: number;    // $/SF
  withinBenchmark: boolean;
  variancePct: number;      // % above/below benchmark midpoint
  lineItems: CostLineItem[];
  contingencyPct: number;
  inflationFactor: number;  // 2026 DMV inflation multiplier
  generatedAt: string;
}

// 2026 DMV Market Benchmarks ($/SF hard cost)
const BENCHMARKS: Record<ProjectType, { low: number; high: number }> = {
  single_family_new:               { low: 180, high: 280 },
  single_family_renovation_major:  { low: 120, high: 200 },
  single_family_renovation_minor:  { low: 60,  high: 120 },
  multifamily_small:               { low: 160, high: 240 },
  multifamily_mid:                 { low: 200, high: 300 },
  multifamily_large:               { low: 220, high: 320 },
  commercial_office:               { low: 200, high: 350 },
  commercial_retail:               { low: 175, high: 280 },
  mixed_use:                       { low: 210, high: 320 },
  land_development:                { low: 40,  high: 90  },
};

// CSI Division cost split percentages by project type
const CSI_SPLITS: Record<string, Record<CostCategory, number>> = {
  residential: {
    SITE_WORK:         0.05,
    CONCRETE:          0.06,
    MASONRY:           0.03,
    METALS:            0.02,
    WOOD_FRAMING:      0.18,
    THERMAL_MOISTURE:  0.05,
    OPENINGS:          0.08,
    FINISHES:          0.16,
    SPECIALTIES:       0.03,
    MEP:               0.18,
    EQUIPMENT:         0.04,
    SITEWORK_UTILITIES: 0.04,
    SOFT_COSTS:        0.06,
    CONTINGENCY:       0.02,
  },
  commercial: {
    SITE_WORK:         0.06,
    CONCRETE:          0.12,
    MASONRY:           0.05,
    METALS:            0.08,
    WOOD_FRAMING:      0.05,
    THERMAL_MOISTURE:  0.06,
    OPENINGS:          0.07,
    FINISHES:          0.14,
    SPECIALTIES:       0.03,
    MEP:               0.22,
    EQUIPMENT:         0.03,
    SITEWORK_UTILITIES: 0.04,
    SOFT_COSTS:        0.03,
    CONTINGENCY:       0.02,
  },
};

const COMPLEXITY_MULTIPLIER: Record<ComplexityLevel, number> = {
  low:    0.90,
  medium: 1.00,
  high:   1.18,
};

const SOFT_COST_PCT = 0.18;  // Architecture, engineering, permits, fees
const INFLATION_FACTOR = 1.13; // 2026 DMV inflation vs 2023 RSMeans base

function getSplit(projectType: ProjectType): Record<CostCategory, number> {
  const commercial = [
    "commercial_office", "commercial_retail", "mixed_use",
  ].includes(projectType);
  return commercial ? CSI_SPLITS.commercial : CSI_SPLITS.residential;
}

export function computeCostModel(
  projectType: ProjectType,
  projectSF: number,
  complexity: ComplexityLevel = "medium",
  overrideContingencyPct?: number,
): CostModelResult {
  const benchmark = BENCHMARKS[projectType];
  const benchmarkMid = (benchmark.low + benchmark.high) / 2;
  const baseCostPerSF = benchmarkMid * COMPLEXITY_MULTIPLIER[complexity] * INFLATION_FACTOR;
  const contingencyPct = overrideContingencyPct ?? 0.10;
  const split = getSplit(projectType);

  const baseHardCost = baseCostPerSF * projectSF;
  const hardCostWithContingency = baseHardCost * (1 + contingencyPct);
  const softCost = hardCostWithContingency * SOFT_COST_PCT;
  const totalProjectCost = hardCostWithContingency + softCost;
  const costPerSF = totalProjectCost / projectSF;

  const lineItems: CostLineItem[] = (Object.entries(split) as [CostCategory, number][])
    .map(([category, pct]) => {
      const subtotal = hardCostWithContingency * pct;
      return {
        category,
        description: CATEGORY_LABELS[category] ?? category,
        unitCost: subtotal / projectSF,
        unit: "SF" as const,
        quantity: projectSF,
        subtotal,
        pct: pct * 100,
      };
    });

  const variancePct = ((baseCostPerSF - benchmarkMid) / benchmarkMid) * 100;

  return {
    projectType,
    projectSF,
    complexity,
    totalHardCost: hardCostWithContingency,
    totalSoftCost: softCost,
    totalProjectCost,
    costPerSF,
    benchmarkLow: benchmark.low * INFLATION_FACTOR,
    benchmarkHigh: benchmark.high * INFLATION_FACTOR,
    withinBenchmark:
      baseCostPerSF >= benchmark.low * INFLATION_FACTOR &&
      baseCostPerSF <= benchmark.high * INFLATION_FACTOR,
    variancePct,
    lineItems,
    contingencyPct: contingencyPct * 100,
    inflationFactor: INFLATION_FACTOR,
    generatedAt: new Date().toISOString(),
  };
}

export function computeScheduleModel(
  projectType: ProjectType,
  projectSF: number,
  complexity: ComplexityLevel = "medium",
): {
  estimatedDurationDays: number;
  benchmarkDaysMin: number;
  benchmarkDaysMax: number;
  criticalPath: string[];
} {
  const SCHEDULE_BENCHMARKS: Record<ProjectType, { min: number; max: number }> = {
    single_family_new:               { min: 240, max: 420 },
    single_family_renovation_major:  { min: 120, max: 240 },
    single_family_renovation_minor:  { min: 30,  max: 90  },
    multifamily_small:               { min: 360, max: 540 },
    multifamily_mid:                 { min: 540, max: 900 },
    multifamily_large:               { min: 720, max: 1200 },
    commercial_office:               { min: 300, max: 600 },
    commercial_retail:               { min: 90,  max: 180 },
    mixed_use:                       { min: 540, max: 900 },
    land_development:                { min: 180, max: 360 },
  };

  const bench = SCHEDULE_BENCHMARKS[projectType];
  const mid = (bench.min + bench.max) / 2;
  const estimated = Math.round(mid * COMPLEXITY_MULTIPLIER[complexity]);

  const criticalPath = [
    "Site Preparation & Utilities",
    "Foundation & Concrete Work",
    "Structural Framing",
    "MEP Rough-In",
    "Insulation & Drywall",
    "Interior Finishes & Millwork",
    "MEP Trim & Fixtures",
    "Final Inspections & CO",
  ];

  return {
    estimatedDurationDays: estimated,
    benchmarkDaysMin: bench.min,
    benchmarkDaysMax: bench.max,
    criticalPath,
  };
}

export function computeRiskScore(params: {
  costVariancePct: number;
  permitStatus: "obtained" | "pending" | "not_started";
  contractorStatus: "contracted" | "selected" | "searching";
  marketCondition: "stable" | "volatile" | "distressed";
  complexity: ComplexityLevel;
}): { score: number; level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // Cost variance risk
  if (Math.abs(params.costVariancePct) > 25) {
    score += 30; factors.push(`High cost variance: ${params.costVariancePct.toFixed(1)}%`);
  } else if (Math.abs(params.costVariancePct) > 15) {
    score += 15; factors.push(`Moderate cost variance: ${params.costVariancePct.toFixed(1)}%`);
  }

  // Permit risk
  if (params.permitStatus === "not_started") {
    score += 25; factors.push("Permit not started");
  } else if (params.permitStatus === "pending") {
    score += 10; factors.push("Permit pending");
  }

  // Contractor risk
  if (params.contractorStatus === "searching") {
    score += 25; factors.push("No GC selected");
  } else if (params.contractorStatus === "selected") {
    score += 8; factors.push("GC selected but not contracted");
  }

  // Market risk
  if (params.marketCondition === "distressed") {
    score += 20; factors.push("Distressed market conditions");
  } else if (params.marketCondition === "volatile") {
    score += 10; factors.push("Volatile market conditions");
  }

  // Complexity premium
  if (params.complexity === "high") {
    score += 10; factors.push("High project complexity");
  }

  const capped = Math.min(100, score);
  const level =
    capped >= 75 ? "CRITICAL" :
    capped >= 50 ? "HIGH" :
    capped >= 25 ? "MEDIUM" : "LOW";

  return { score: capped, level, factors };
}

const CATEGORY_LABELS: Partial<Record<CostCategory, string>> = {
  SITE_WORK:         "Division 31 — Earthwork & Site Preparation",
  CONCRETE:          "Division 03 — Concrete",
  MASONRY:           "Division 04 — Masonry",
  METALS:            "Division 05 — Metals & Structural Steel",
  WOOD_FRAMING:      "Division 06 — Wood Framing & Carpentry",
  THERMAL_MOISTURE:  "Division 07 — Thermal & Moisture Protection",
  OPENINGS:          "Division 08 — Doors, Windows & Glazing",
  FINISHES:          "Division 09 — Finishes (Drywall, Paint, Flooring)",
  SPECIALTIES:       "Division 10–14 — Specialties & Equipment",
  MEP:               "Division 21–28 — Mechanical, Electrical, Plumbing",
  EQUIPMENT:         "Division 11–12 — Equipment & Furnishings",
  SITEWORK_UTILITIES: "Division 33 — Utilities & Site Improvements",
  SOFT_COSTS:        "Soft Costs (A/E, Permits, Financing, Insurance)",
  CONTINGENCY:       "Contingency Reserve",
};
