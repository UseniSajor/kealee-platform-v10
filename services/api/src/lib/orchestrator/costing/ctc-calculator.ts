/**
 * services/ai-orchestrator/src/costing/ctc-calculator.ts
 *
 * Complete Total Cost (CTC) Calculator
 *
 * CTC = HARD_COST + SOFT_COST + RISK_COST + EXECUTION_COST
 *
 * HARD_COST    = cost_per_sqft × sqft (from RAG cost dataset)
 * SOFT_COST    = design (5–12%) + engineering (2–5%) + permit fees (jurisdiction)
 * RISK_COST    = (hard + soft) × contingency% × zoning_risk_multiplier
 * EXECUTION    = (hard + soft + risk) × (contractor_overhead% + platform_fee%)
 */

import type { CostRecord, PermitRecord, ZoningRecord } from "../retrieval/rag-retriever";
import type { CTCOutput, CTCBreakdown } from "../types/agent-types";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface CTCInput {
  projectType:   string;
  jurisdiction:  string;
  sqft:          number;
  costRecords:   CostRecord[];
  permitRecords: PermitRecord[];
  zoningRecords: ZoningRecord[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DMV_DEFAULT_COST_PER_SQFT = 185;          // $/sqft fallback if no RAG data
const DEFAULT_SOFT_PCT           = 12;           // % of hard cost
const DEFAULT_CONTINGENCY_PCT    = 15;           // %
const PLATFORM_FEE_PCT           = 3.5;          // Kealee platform fee
const RANGE_LOW_FACTOR           = 0.85;
const RANGE_HIGH_FACTOR          = 1.20;

/**
 * 2026 DMV cumulative inflation adjustment applied to all base cost records.
 * Compound: +7.0% (2023→2024) × +4.5% (2024→2025) × +3.5% (2025→2026)
 * plus continued materials/labor market tightening in DMV metro.
 * Applied factor: 1.35 (35% cumulative above 2023 RSMeans base costs)
 */
const INFLATION_FACTOR_2026 = 1.35;

// ── Main function ─────────────────────────────────────────────────────────────

export function calculateCTC(input: CTCInput): CTCOutput {
  const { sqft, costRecords, permitRecords, zoningRecords } = input;

  // ── 1. HARD COST ──────────────────────────────────────────────────────────
  // Base cost comes from 2023 RAG dataset; inflate to 2026 DMV rates
  const avgCostPerSqft2023 = costRecords.length
    ? Math.round(costRecords.reduce((s, c) => s + c.cost_per_sqft, 0) / costRecords.length)
    : DMV_DEFAULT_COST_PER_SQFT;

  const avgCostPerSqft = Math.round(avgCostPerSqft2023 * INFLATION_FACTOR_2026);
  const hardCost = avgCostPerSqft * sqft;

  // ── 2. SOFT COST ──────────────────────────────────────────────────────────
  // Pull soft cost percentage from dataset; split into design + engineering
  const avgSoftPct = costRecords.length
    ? costRecords.reduce((s, c) => s + c.soft_costs_percent, 0) / costRecords.length
    : DEFAULT_SOFT_PCT;

  // Design: ~65% of total soft budget (typically 5–12% of hard cost)
  const designPct     = clamp(avgSoftPct * 0.65, 5, 12);
  // Engineering: ~25% of soft budget (typically 2–5%)
  const engineeringPct = clamp(avgSoftPct * 0.25, 2, 5);

  const designFee      = Math.round(hardCost * designPct / 100);
  const engineeringFee = Math.round(hardCost * engineeringPct / 100);

  // Permit fee: aggregate from RAG permit records (base + per-sqft component)
  const avgPermitFee = permitRecords.length
    ? Math.round(
        permitRecords.reduce((s, p) => s + p.fee_base + (p.fee_per_sqft ?? 0) * sqft, 0) /
        permitRecords.length
      )
    : estimatePermitFee(input.projectType, sqft);

  const softCost = designFee + engineeringFee + avgPermitFee;

  // ── 3. RISK COST ──────────────────────────────────────────────────────────
  const avgContingencyPct = costRecords.length
    ? costRecords.reduce((s, c) => s + c.contingency_percent, 0) / costRecords.length
    : DEFAULT_CONTINGENCY_PCT;

  // Zoning risk multiplier: increases when permits are complex or no data
  const zoningRiskMultiplier =
    zoningRecords.length === 0                              ? 1.20  // no data = higher risk
    : zoningRecords.some(z => z.by_right === false)        ? 1.15  // discretionary approval
    : permitRecords.some(p => p.processing_days > 60)      ? 1.10  // slow jurisdiction
    :                                                         1.05; // standard

  const riskCost = Math.round(
    (hardCost + softCost) * (avgContingencyPct / 100) * zoningRiskMultiplier
  );

  // ── 4. EXECUTION COST ─────────────────────────────────────────────────────
  // Contractor overhead scales down for larger projects (economy of scale)
  const contractorOverheadPct =
    hardCost > 2_000_000 ? 10
    : hardCost > 1_000_000 ? 12
    : hardCost > 500_000  ? 15
    :                        18;

  const executionBase = hardCost + softCost + riskCost;
  const executionCost = Math.round(
    executionBase * (contractorOverheadPct + PLATFORM_FEE_PCT) / 100
  );

  // ── 5. TOTAL ──────────────────────────────────────────────────────────────
  const totalCTC = hardCost + softCost + riskCost + executionCost;

  const breakdown: CTCBreakdown = {
    construction: hardCost,
    soft:         softCost,
    risk:         riskCost,
    execution:    executionCost,
  };

  return {
    total:          totalCTC,
    range:          [Math.round(totalCTC * RANGE_LOW_FACTOR), Math.round(totalCTC * RANGE_HIGH_FACTOR)],
    cost_per_sqft:  avgCostPerSqft,
    sqft,
    breakdown,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/** Fallback permit fee when no RAG permit records are available */
function estimatePermitFee(projectType: string, sqft: number): number {
  const base: Record<string, number> = {
    "single-family":      800,
    "adu":               600,
    "addition":          700,
    "commercial":       2500,
    "mixed-use":        3000,
    "townhouse":         900,
    "multifamily":      1800,
  };
  const typeKey = Object.keys(base).find(k => projectType.toLowerCase().includes(k)) ?? "single-family";
  const flatBase = base[typeKey] ?? 800;
  return flatBase + Math.round(sqft * 0.35);   // ~$0.35/sqft component
}

// ── Formatting helpers (used by UI + agents) ──────────────────────────────────

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
}

export function ctcCTAAndProduct(totalCTC: number): { cta: string; conversion_product: string } {
  if (totalCTC >= 500_000) {
    return {
      cta: "Order Permit Package + PM Oversight — $4,590",
      conversion_product: "PERMIT_PACKAGE_PM",
    };
  }
  if (totalCTC >= 200_000) {
    return {
      cta: "Order Permit Package — $1,095",
      conversion_product: "PERMIT_PACKAGE",
    };
  }
  return {
    cta: "Get AI Concept + Permit — $1,570",
    conversion_product: "AI_CONCEPT_PERMIT_BUNDLE",
  };
}
