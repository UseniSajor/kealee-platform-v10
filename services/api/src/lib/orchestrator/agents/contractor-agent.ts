/**
 * contractor-agent.ts
 *
 * Decision engine for construction planning and contractor readiness.
 * Uses live Prisma data (Parcel, ZoningProfile, FeasibilityStudy, DigitalTwin)
 * FIRST, then falls back to RAG for any missing context.
 * Live DB data ALWAYS overrides RAG static data.
 *
 * Drives conversion to PROJECT_EXECUTION or PERMIT_PACKAGE_PM for large projects.
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrievePermitContext,
} from "../retrieval/rag-retriever";
import { fetchLiveDBContext, liveDBSummary } from "../retrieval/live-db";
import { calculateCTC, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface ContractorAgentInput {
  jurisdiction?: string;
  projectType:   string;
  sqft?:         number;
  stage?:        string;
  address?:      string;
  /** If provided, live DB data is fetched and overrides RAG */
  projectId?:    string;
}

export async function executeContractorAgent(input: ContractorAgentInput): Promise<AgentOutput> {
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
    stage:        "construction",
  });

  if (!ragContext && live.source === 'none') {
    return {
      summary: `No construction cost data found for "${input.projectType}".`,
      risks: ["Cost data unavailable — manual estimation required"],
      confidence: "low",
      next_step: "Request a custom construction estimate.",
      cta: "Start Project Execution — Get Matched Now",
      conversion_product: "PROJECT_EXECUTION",
      data_used: { ...liveDBSummary(live) },
    };
  }

  const { costs = [], zoning: ragZoning = [], workflows = [] } = ragContext ?? {};

  // ── 3. Merge: live DB overrides RAG ─────────────────────────────────────────
  // Sqft: live parcel > feasibility > input > RAG avg
  const liveSqft    = live.parcel?.squareFeet     ? Number(live.parcel.squareFeet)                : null;
  const feasSqft    = live.feasibility?.targetSqFt ? Number(live.feasibility.targetSqFt)           : null;
  const avgSqft     = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.avg_size_sqft, 0) / costs.length)
    : 1500;
  const targetSqft  = liveSqft ?? feasSqft ?? input.sqft ?? avgSqft;

  const resolvedJurisdiction = input.jurisdiction ?? "";

  // Feasibility: totalProjectCost is authoritative budget
  const liveTotalCost  = live.feasibility?.totalProjectCost
    ? Number(live.feasibility.totalProjectCost)
    : null;
  const liveFeasROI    = live.feasibility?.bestROI    ?? null;
  const liveFeasIRR    = live.feasibility?.bestIRR    ?? null;
  const liveFeasUnits  = live.feasibility?.targetUnits ?? null;

  // Zoning: live constraints for contractor requirements
  const liveMaxCoverage = live.zoning?.maxLotCoverage ?? null;
  const liveMaxHeight   = live.zoning?.maxHeight      ?? null;
  const liveZoneCode    = live.zoning?.zoningCode      ?? null;

  // Digital Twin: phase context for contractor sequencing
  const twinPhase  = live.twin?.status      ?? null;
  const twinHealth = live.twin?.healthStatus ?? null;
  const twinScore  = live.twin?.healthScore  ?? null;

  // ── 4. CTC Calculation ───────────────────────────────────────────────────────
  const permitRecords = retrievePermitContext(resolvedJurisdiction, input.projectType);

  const ctcResult = calculateCTC({
    projectType:   input.projectType,
    jurisdiction:  resolvedJurisdiction,
    sqft:          targetSqft,
    costRecords:   costs,
    permitRecords,
    zoningRecords: ragZoning,
  });

  const finalCTC = liveTotalCost ?? ctcResult.total;

  // ── 5. Build risks ───────────────────────────────────────────────────────────
  const avgDuration    = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.typical_duration_months, 0) / costs.length)
    : 8;
  const allCategories  = [...new Set(costs.flatMap(c => c.primary_expense_categories))].slice(0, 5);
  const workflow       = workflows[0];

  const risks: string[] = [];

  // Live data risks first
  if (live.feasibility) {
    if (live.feasibility.decision === 'NO_GO') {
      risks.push("CRITICAL: Feasibility is NO_GO — contractor engagement should be paused");
    } else if (live.feasibility.decision === 'CONDITIONAL') {
      risks.push("Feasibility is CONDITIONAL — contractor contracts must include contingency clauses");
    }
    if (liveFeasROI !== null && liveFeasROI < 0.1) {
      risks.push(`Low feasibility ROI (${(liveFeasROI * 100).toFixed(1)}%) — contractor margins will be tight`);
    }
    if (liveFeasUnits !== null) {
      risks.push(`${liveFeasUnits}-unit program — contractor must have multi-unit delivery experience`);
    }
  }
  if (live.zoning) {
    risks.push(`Live zoning ${liveZoneCode}: max coverage ${liveMaxCoverage}%, max height ${liveMaxHeight}ft — GC must confirm site plan compliance`);
  }
  if (live.twin) {
    if (twinPhase) {
      risks.push(`Project phase: ${twinPhase} — contractor mobilization timing must align with Twin phase`);
    }
    if (twinHealth === 'CRITICAL') {
      risks.push(`Twin health CRITICAL (${twinScore}/100) — schedule and cost KPIs need immediate correction`);
    } else if (twinHealth === 'AT_RISK') {
      risks.push(`Twin AT_RISK (${twinScore}/100) — monitor contractor progress against KPI thresholds`);
    }
  }

  // RAG risks
  if (allCategories.length > 0) {
    risks.push(`Monitor critical cost categories: ${allCategories.slice(0, 3).join(", ")}`);
  }
  risks.push(`Build duration: ~${avgDuration} months — material delays can add 10–20%`);
  risks.push("Require licensed, bonded contractor with jurisdiction permit history");
  if (workflow) {
    risks.push(`Construction leads to ${workflow.next_stage ?? "inspections"} — pre-schedule all required inspections`);
  }

  // ── 6. CTA — escalate for large projects ─────────────────────────────────────
  const { cta, conversion_product } = finalCTC >= 500_000
    ? { cta: "Match with PM + Verified GC — $3,749", conversion_product: "PERMIT_PACKAGE_PM" }
    : { cta: "Start Project Execution — Get Matched Now", conversion_product: "PROJECT_EXECUTION" };

  // ── 7. Confidence ────────────────────────────────────────────────────────────
  // Feasibility study = highest confidence signal
  const liveBoost = live.feasibility !== null ? 2 : live.source === 'live_db' ? 1 : 0;
  const ragScore  = costs.length >= 5 ? 2 : costs.length >= 2 ? 1 : 0;
  const confidence: "high" | "medium" | "low" =
    (ragScore + liveBoost) >= 3 ? "high" : (ragScore + liveBoost) >= 1 ? "medium" : "low";

  // ── 8. Summary ───────────────────────────────────────────────────────────────
  const liveFeasLine = live.feasibility
    ? `Feasibility: ${live.feasibility.status}${live.feasibility.decision ? ` / ${live.feasibility.decision}` : ''}${liveTotalCost ? `, total cost $${liveTotalCost.toLocaleString()}` : ''}${liveFeasROI ? `, ROI ${(liveFeasROI * 100).toFixed(1)}%` : ''}${liveFeasIRR ? `, IRR ${(liveFeasIRR * 100).toFixed(1)}%` : ''}.`
    : null;
  const liveZoningLine = live.zoning
    ? `Zoning: ${liveZoneCode}, max coverage ${liveMaxCoverage}%, max height ${liveMaxHeight}ft.`
    : null;
  const liveTwinLine   = live.twin
    ? `Twin: ${twinPhase} phase, health ${twinScore}/100 (${twinHealth}).`
    : null;

  const summary = [
    `Construction planning for ${input.projectType} in ${resolvedJurisdiction || "DMV region"}.`,
    liveFeasLine,
    liveZoningLine,
    liveTwinLine,
    `Full CTC: ${formatCurrency(ctcResult.range[0])} – ${formatCurrency(ctcResult.range[1])}.`,
    `Construction: ${formatCurrency(ctcResult.breakdown.construction)} | Soft: ${formatCurrency(ctcResult.breakdown.soft)} | Risk: ${formatCurrency(ctcResult.breakdown.risk)}.`,
    `Build duration: ${avgDuration} months.`,
  ].filter(Boolean).join(" ");

  return {
    summary,
    risks: risks.slice(0, 6),
    confidence,
    next_step:  "Engage a verified general contractor and mobilize for construction phase.",
    cta,
    conversion_product,
    ctc: {
      total:         finalCTC,
      range:         ctcResult.range,
      cost_per_sqft: ctcResult.cost_per_sqft,
      sqft:          targetSqft,
      breakdown:     ctcResult.breakdown,
    },
    data_used: {
      // Live DB (source of truth)
      ...liveDBSummary(live),
      live_feasibility_cost:  liveTotalCost,
      live_feasibility_roi:   liveFeasROI,
      live_feasibility_irr:   liveFeasIRR,
      live_feasibility_units: liveFeasUnits,
      live_zoning_code:       liveZoneCode,
      live_twin_phase:        twinPhase,
      live_twin_health:       twinHealth,
      live_twin_score:        twinScore,
      // RAG fallback counts
      rag_cost_records:       costs.length,
      rag_zoning_records:     ragZoning.length,
      // Resolved values
      resolved_sqft:          targetSqft,
      resolved_jurisdiction:  resolvedJurisdiction,
      final_ctc:              finalCTC,
      live_ctc_override:      liveTotalCost !== null,
      project_type:           input.projectType,
      jurisdiction:           resolvedJurisdiction,
    },
  };
}
