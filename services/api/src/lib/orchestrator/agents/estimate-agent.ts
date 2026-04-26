/**
 * estimate-agent.ts
 *
 * Decision engine for construction cost estimation.
 * Uses live Prisma data (Parcel, ZoningProfile, FeasibilityStudy, DigitalTwin)
 * FIRST, then falls back to RAG for any missing context.
 * Live DB data ALWAYS overrides RAG static data.
 *
 * Drives conversion to PERMIT_PACKAGE ($799).
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrievePermitContext,
  retrieveZoningContext,
} from "../retrieval/rag-retriever";
import { fetchLiveDBContext, liveDBSummary } from "../retrieval/live-db";
import { calculateCTC, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface EstimateAgentInput {
  jurisdiction?: string;
  projectType:   string;
  sqft?:         number;
  stage?:        string;
  address?:      string;
  /** If provided, live DB data is fetched and overrides RAG */
  projectId?:    string;
}

export async function executeEstimateAgent(input: EstimateAgentInput): Promise<AgentOutput> {
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
    stage:        "estimate",
  });

  if (!ragContext && live.source === 'none') {
    return {
      summary: `No cost data found for project type "${input.projectType}".`,
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

  const resolvedJurisdiction = input.jurisdiction ?? "";

  // Feasibility override: totalProjectCost is the authoritative cost figure
  const liveTotalCost  = live.feasibility?.totalProjectCost
    ? Number(live.feasibility.totalProjectCost)
    : null;
  const liveFeasUnits  = live.feasibility?.targetUnits  ?? null;
  const liveFeasSqFt   = live.feasibility?.targetSqFt
    ? Number(live.feasibility.targetSqFt)
    : null;

  // ── 4. CTC Calculation ───────────────────────────────────────────────────────
  const permitRecords = retrievePermitContext(resolvedJurisdiction, input.projectType);
  const zoningRecords = retrieveZoningContext(resolvedJurisdiction);

  const ctcResult = calculateCTC({
    projectType:   input.projectType,
    jurisdiction:  resolvedJurisdiction,
    sqft:          liveFeasSqFt ?? targetSqft,
    costRecords:   costs,
    permitRecords,
    zoningRecords,
  });

  // ── 5. Build risks ───────────────────────────────────────────────────────────
  const avgContingency = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.contingency_percent, 0) / costs.length)
    : 15;
  const avgSoftPct = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.soft_costs_percent, 0) / costs.length)
    : 12;
  const topExpenses = [...new Set(costs.flatMap(c => c.primary_expense_categories))].slice(0, 4);
  const workflow = workflows[0];

  const risks: string[] = [];

  // Live data risks first
  if (live.feasibility) {
    if (live.feasibility.decision === 'NO_GO') {
      risks.push("CRITICAL: Feasibility decision is NO_GO — estimate may not be actionable");
    }
    if (liveTotalCost !== null && liveTotalCost > ctcResult.total * 1.2) {
      risks.push(`Feasibility cost ($${liveTotalCost.toLocaleString()}) exceeds RAG estimate by >20% — verify scope`);
    }
    if (live.feasibility.aiConfidence !== null && live.feasibility.aiConfidence < 0.6) {
      risks.push(`Feasibility AI confidence ${(live.feasibility.aiConfidence * 100).toFixed(0)}% — additional data collection recommended`);
    }
    if (liveFeasUnits !== null) {
      risks.push(`Unit count from feasibility: ${liveFeasUnits} units — ensure estimate covers full program`);
    }
  }
  if (live.zoning) {
    if (live.zoning.maxFAR !== null && live.zoning.maxFAR < 1.0) {
      risks.push(`FAR limit ${live.zoning.maxFAR} may cap buildable program — verify against design`);
    }
  }
  if (live.parcel && live.parcel.developmentScore !== null && live.parcel.developmentScore < 50) {
    risks.push(`Development score ${live.parcel.developmentScore}/100 — site conditions may increase costs`);
  }
  if (live.twin && live.twin.healthStatus !== 'HEALTHY') {
    risks.push(`Twin health ${live.twin.healthStatus} — budget KPIs may be at risk`);
  }

  // RAG risks
  risks.push(`Total estimate: ${formatCurrency(ctcResult.range[0])} – ${formatCurrency(ctcResult.range[1])} (±${avgContingency}% contingency)`);
  risks.push(`Soft costs (~${avgSoftPct}%) include design, permitting, and inspection fees`);
  if (topExpenses[0]) {
    risks.push(`Top cost drivers: ${topExpenses.slice(0, 3).join(", ")}`);
  }
  if (workflow) {
    risks.push(`Estimation phase: ~${workflow.estimated_days ?? 14} days to finalize scope`);
  }
  risks.push("Material prices indexed to 2026 DMV rates — request current pricing from suppliers");

  // ── 6. Confidence ────────────────────────────────────────────────────────────
  const liveBoost = live.feasibility !== null ? 2 : live.source === 'live_db' ? 1 : 0;
  const ragScore  = costs.length >= 5 ? 2 : costs.length >= 2 ? 1 : 0;
  const confidence: "high" | "medium" | "low" =
    (ragScore + liveBoost) >= 3 ? "high" : (ragScore + liveBoost) >= 1 ? "medium" : "low";

  // ── 7. Summary ───────────────────────────────────────────────────────────────
  const liveFeasLine = live.feasibility
    ? `Live feasibility: ${live.feasibility.status}${live.feasibility.decision ? ` / ${live.feasibility.decision}` : ''}${liveTotalCost ? `, project cost $${liveTotalCost.toLocaleString()}` : ''}${live.feasibility.bestROI ? `, ROI ${(live.feasibility.bestROI * 100).toFixed(1)}%` : ''}.`
    : null;
  const liveParcelLine = live.parcel
    ? `Parcel: ${Number(live.parcel.squareFeet ?? 0).toLocaleString()} sqft on record.`
    : null;

  const summary = [
    `Cost estimate for ${input.projectType} in ${resolvedJurisdiction || "DMV region"}.`,
    liveParcelLine,
    liveFeasLine,
    `CTC: ${formatCurrency(liveTotalCost ?? ctcResult.range[0])} – ${formatCurrency(ctcResult.range[1])}.`,
    `Construction: ${formatCurrency(ctcResult.breakdown.construction)} at ${ctcResult.cost_per_sqft}/sqft × ${(liveFeasSqFt ?? targetSqft).toLocaleString()} sqft.`,
    `Soft: ${formatCurrency(ctcResult.breakdown.soft)} | Risk: ${formatCurrency(ctcResult.breakdown.risk)} | Exec: ${formatCurrency(ctcResult.breakdown.execution)}.`,
  ].filter(Boolean).join(" ");

  return {
    summary,
    risks: risks.slice(0, 6),
    confidence,
    next_step:          "Review the cost breakdown and proceed to permit filing.",
    cta:                "Order Permit Package — $799",
    conversion_product: "PERMIT_PACKAGE",
    ctc: {
      total:         liveTotalCost ?? ctcResult.total,
      range:         ctcResult.range,
      cost_per_sqft: ctcResult.cost_per_sqft,
      sqft:          liveFeasSqFt ?? targetSqft,
      breakdown:     ctcResult.breakdown,
    },
    data_used: {
      // Live DB (source of truth)
      ...liveDBSummary(live),
      live_feasibility_cost:   liveTotalCost,
      live_feasibility_sqft:   liveFeasSqFt,
      live_feasibility_units:  liveFeasUnits,
      // RAG fallback counts
      rag_cost_records:        costs.length,
      rag_workflow_records:    workflows.length,
      // Resolved values
      resolved_sqft:           liveFeasSqFt ?? targetSqft,
      resolved_jurisdiction:   resolvedJurisdiction,
      live_ctc_override:       liveTotalCost !== null,
      total_ctc:               liveTotalCost ?? ctcResult.total,
      project_type:            input.projectType,
    },
  };
}
