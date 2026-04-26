/**
 * design-agent.ts
 *
 * Decision engine for design concept + cost analysis.
 * Uses live Prisma data (Parcel, ZoningProfile, FeasibilityStudy, DigitalTwin)
 * FIRST, then falls back to RAG for any missing context.
 * Live DB data ALWAYS overrides RAG static data.
 *
 * Drives conversion to PERMIT_PACKAGE ($799) or PERMIT_PACKAGE_PM ($3,749).
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrieveCostContext,
  retrievePermitContext,
  retrieveZoningContext,
} from "../retrieval/rag-retriever";
import { fetchLiveDBContext, liveDBSummary } from "../retrieval/live-db";
import { calculateCTC, ctcCTAAndProduct, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface DesignAgentInput {
  jurisdiction?: string;
  projectType:   string;
  sqft?:         number;
  stage?:        string;
  address?:      string;
  /** If provided, live DB data is fetched and overrides RAG */
  projectId?:    string;
}

export async function executeDesignAgent(input: DesignAgentInput): Promise<AgentOutput> {
  // ── 1. Live DB fetch (always first) ─────────────────────────────────────────
  const live = await fetchLiveDBContext({
    projectId: input.projectId,
    address:   input.address,
  });

  // ── 2. RAG fallback check ────────────────────────────────────────────────────
  if (!isRAGLoaded()) {
    return {
      summary: "RAG dataset not available.",
      risks: ["System error: dataset not loaded"],
      confidence: "low",
      next_step: "Contact support — RAG system offline.",
      cta: "Contact Support",
      conversion_product: "SUPPORT",
      data_used: { ...liveDBSummary(live) },
    };
  }

  const ragContext = buildRAGContext({
    jurisdiction: input.jurisdiction ?? "",
    projectType:  input.projectType,
    stage:        "design",
  });

  if (!ragContext && live.source === 'none') {
    return {
      summary: `No cost or design data found for project type "${input.projectType}".`,
      risks: ["Project type not in dataset — cost estimate unavailable"],
      confidence: "low",
      next_step: "Request a custom cost estimate from our team.",
      cta: "Order Permit Package — $799",
      conversion_product: "PERMIT_PACKAGE",
      data_used: { ...liveDBSummary(live) },
    };
  }

  const { costs = [], workflows = [] } = ragContext ?? {};

  // ── 3. Merge: live DB overrides RAG ─────────────────────────────────────────
  // Sqft: live parcel.squareFeet > input.sqft > RAG avg
  const liveSqft = live.parcel?.squareFeet ? Number(live.parcel.squareFeet) : null;
  const avgSqft  = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.avg_size_sqft, 0) / costs.length)
    : 1500;
  const targetSqft = liveSqft ?? input.sqft ?? avgSqft;

  // Jurisdiction: prefer live zoning address fields
  const resolvedJurisdiction = input.jurisdiction
    ?? (live.zoning ? `${live.zoning.zoningDistrict}` : "")
    ?? "";

  // Zoning constraints from live DB
  const liveMaxHeight   = live.zoning?.maxHeight   ?? null;
  const liveMaxFAR      = live.zoning?.maxFAR       ?? null;
  const liveMaxCoverage = live.zoning?.maxLotCoverage ?? null;
  const liveAllowed     = live.zoning?.allowedHousingTypes ?? [];

  // Feasibility override: if study has totalProjectCost use it for CTC
  const liveTotalCost = live.feasibility?.totalProjectCost
    ? Number(live.feasibility.totalProjectCost)
    : null;

  // ── 4. CTC Calculation ───────────────────────────────────────────────────────
  const permitRecords = retrievePermitContext(resolvedJurisdiction, input.projectType);
  const zoningRecords = retrieveZoningContext(resolvedJurisdiction);

  const ctcResult = calculateCTC({
    projectType:   input.projectType,
    jurisdiction:  resolvedJurisdiction,
    sqft:          targetSqft,
    costRecords:   costs,
    permitRecords,
    zoningRecords,
  });

  const { cta, conversion_product } = ctcCTAAndProduct(liveTotalCost ?? ctcResult.total);

  // ── 5. Build risks ───────────────────────────────────────────────────────────
  const avgSoftPct     = costs.length ? costs.reduce((s, c) => s + c.soft_costs_percent, 0) / costs.length : 12;
  const avgContingency = costs.length ? costs.reduce((s, c) => s + c.contingency_percent, 0) / costs.length : 15;
  const avgDurationMo  = costs.length ? Math.round(costs.reduce((s, c) => s + c.typical_duration_months, 0) / costs.length) : 8;
  const topExpenses    = [...new Set(costs.flatMap(c => c.primary_expense_categories))].slice(0, 4);
  const workflow       = workflows[0];

  const risks: string[] = [];

  // Live data risks first
  if (live.zoning) {
    if (liveMaxFAR !== null && liveMaxFAR < 1.0) {
      risks.push(`FAR limit ${liveMaxFAR} constrains total buildable area — verify design compliance`);
    }
    if (liveMaxHeight !== null) {
      risks.push(`Max height ${liveMaxHeight}ft — structural plans must comply with live zoning`);
    }
    if (liveAllowed.length > 0 && !liveAllowed.includes(input.projectType.toUpperCase().replace(/-/g, '_'))) {
      risks.push(`Project type may not be in allowed housing types: ${liveAllowed.slice(0, 3).join(', ')}`);
    }
  }
  if (live.feasibility) {
    if (live.feasibility.decision === 'NO_GO') {
      risks.push("CRITICAL: Feasibility decision is NO_GO — design should not proceed without review");
    }
    if (live.feasibility.bestROI !== null && live.feasibility.bestROI < 0.1) {
      risks.push(`Low feasibility ROI (${(live.feasibility.bestROI * 100).toFixed(1)}%) — value engineering required`);
    }
  }
  if (live.twin && live.twin.healthStatus !== 'HEALTHY') {
    risks.push(`Digital Twin ${live.twin.healthStatus} (score ${live.twin.healthScore}/100) — review project KPIs`);
  }

  // RAG risks
  risks.push(`Budget variance: ${formatCurrency(ctcResult.range[0])}–${formatCurrency(ctcResult.range[1])} depending on site conditions`);
  risks.push(`Soft costs (~${Math.round(avgSoftPct)}%) must be budgeted separately from construction`);
  risks.push(`Hold ${Math.round(avgContingency)}% contingency — typical for ${input.projectType}`);
  if (topExpenses[0]) {
    risks.push(`Coordinate ${topExpenses[0]} and ${topExpenses[1] ?? "framing"} early to avoid delays`);
  }
  if (workflow) {
    risks.push(`Design phase takes ~${workflow.estimated_days ?? 30} days — plan permit submission timeline`);
  }

  // ── 6. Confidence ────────────────────────────────────────────────────────────
  const liveBoost = live.source === 'live_db' ? 1 : 0;
  const ragScore  = costs.length >= 5 ? 2 : costs.length >= 2 ? 1 : 0;
  const confidence: "high" | "medium" | "low" =
    (ragScore + liveBoost) >= 2 ? "high" : (ragScore + liveBoost) >= 1 ? "medium" : "low";

  // ── 7. Summary ───────────────────────────────────────────────────────────────
  const liveZoningLine   = live.zoning
    ? `Live zoning: ${live.zoning.zoningCode} (${live.zoning.zoningDistrict}), FAR ${liveMaxFAR ?? 'N/A'}, max height ${liveMaxHeight ?? 'N/A'}ft.`
    : null;
  const liveFeasLine     = live.feasibility
    ? `Feasibility: ${live.feasibility.status}${live.feasibility.decision ? ` / ${live.feasibility.decision}` : ''}.`
    : null;
  const liveParcelLine   = live.parcel
    ? `Parcel: ${Number(live.parcel.squareFeet ?? 0).toLocaleString()} sqft on record.`
    : null;

  const summary = [
    `Design feasibility for ${input.projectType} in ${resolvedJurisdiction || "DMV region"}.`,
    liveParcelLine,
    liveZoningLine ?? `CTC estimate: ${formatCurrency(ctcResult.range[0])} – ${formatCurrency(ctcResult.range[1])}.`,
    liveFeasLine,
    `Construction: ${formatCurrency(ctcResult.breakdown.construction)} at ${ctcResult.cost_per_sqft}/sqft × ${targetSqft.toLocaleString()} sqft.`,
    `Soft costs: ${formatCurrency(ctcResult.breakdown.soft)} | Risk: ${formatCurrency(ctcResult.breakdown.risk)} | Exec: ${formatCurrency(ctcResult.breakdown.execution)}.`,
    `Typical build: ${avgDurationMo} months.`,
  ].filter(Boolean).join(" ");

  return {
    summary,
    risks: risks.slice(0, 6),
    confidence,
    next_step:          "Prepare your permit application package with stamped drawings and specifications.",
    cta,
    conversion_product,
    ctc: {
      total:         liveTotalCost ?? ctcResult.total,
      range:         ctcResult.range,
      cost_per_sqft: ctcResult.cost_per_sqft,
      sqft:          targetSqft,
      breakdown:     ctcResult.breakdown,
    },
    data_used: {
      // Live DB (source of truth)
      ...liveDBSummary(live),
      // RAG fallback counts
      rag_cost_records:    costs.length,
      rag_workflow_records: workflows.length,
      // Resolved values
      resolved_sqft:       targetSqft,
      resolved_jurisdiction: resolvedJurisdiction,
      live_zoning_applied: live.zoning !== null,
      live_ctc_override:   liveTotalCost !== null,
      total_ctc:           liveTotalCost ?? ctcResult.total,
      project_type:        input.projectType,
      jurisdiction:        resolvedJurisdiction,
    },
  };
}
