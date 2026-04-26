/**
 * permit-agent.ts
 *
 * Decision engine for permit requirement analysis.
 * Uses live Prisma data (Parcel, ZoningProfile, FeasibilityStudy, DigitalTwin)
 * FIRST, then falls back to RAG for any missing context.
 * Live DB data ALWAYS overrides RAG static data.
 *
 * Drives conversion to CONTRACTOR_MATCH ($199).
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrieveCostContext,
  retrieveZoningContext,
} from "../retrieval/rag-retriever";
import { fetchLiveDBContext, liveDBSummary } from "../retrieval/live-db";
import { calculateCTC, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface PermitAgentInput {
  jurisdiction:  string;
  projectType?:  string;
  sqft?:         number;
  stage?:        string;
  address?:      string;
  /** If provided, live DB data is fetched and overrides RAG */
  projectId?:    string;
}

export async function executePermitAgent(input: PermitAgentInput): Promise<AgentOutput> {
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
    jurisdiction: input.jurisdiction,
    projectType:  input.projectType ?? "single-family",
    stage:        "permitting",
  });

  if (!ragContext && live.source === 'none') {
    return {
      summary: `No permit data found for "${input.jurisdiction}".`,
      risks: ["Jurisdiction permit data unavailable — manual research required"],
      confidence: "low",
      next_step: "Request a custom permit research package for this jurisdiction.",
      cta: "Find Verified Contractors — $199",
      conversion_product: "CONTRACTOR_MATCH",
      data_used: { ...liveDBSummary(live) },
    };
  }

  const { permits = [], workflows = [] } = ragContext ?? {};

  // ── 3. Merge: live DB overrides RAG ─────────────────────────────────────────
  // Sqft: live parcel > input > RAG avg
  const liveSqft     = live.parcel?.squareFeet ? Number(live.parcel.squareFeet) : null;
  const costRecords  = retrieveCostContext(input.projectType ?? "single-family", input.jurisdiction);
  const avgSqft      = costRecords.length
    ? Math.round(costRecords.reduce((s, c) => s + c.avg_size_sqft, 0) / costRecords.length)
    : 1500;
  const targetSqft   = liveSqft ?? input.sqft ?? avgSqft;

  // ZoningProfile: use live district/code for permit lookup context
  const liveZoneCode  = live.zoning?.zoningCode     ?? null;
  const liveDistrict  = live.zoning?.zoningDistrict ?? null;
  const liveNepa      = live.zoning?.nepaExemption  ?? null;

  // Feasibility: use decision + IRR for risk context
  const liveFeasDecision = live.feasibility?.decision      ?? null;
  const liveFeasROI      = live.feasibility?.bestROI       ?? null;
  const liveFeasStatus   = live.feasibility?.status        ?? null;

  // ── 4. CTC Calculation ───────────────────────────────────────────────────────
  const zoningRecords = retrieveZoningContext(input.jurisdiction);

  const ctcResult = calculateCTC({
    projectType:   input.projectType ?? "single-family",
    jurisdiction:  input.jurisdiction,
    sqft:          targetSqft,
    costRecords,
    permitRecords: permits,
    zoningRecords,
  });

  // ── 5. Permit metrics ────────────────────────────────────────────────────────
  const avgDays   = permits.length ? Math.round(permits.reduce((s, p) => s + p.processing_days, 0) / permits.length) : 45;
  const minDays   = permits.length ? Math.min(...permits.map(p => p.processing_days)) : 20;
  const maxDays   = permits.length ? Math.max(...permits.map(p => p.processing_days)) : 75;
  const avgFee    = permits.length ? Math.round(permits.reduce((s, p) => s + p.fee_base, 0) / permits.length) : 800;
  const avgRounds = permits.length
    ? parseFloat((permits.reduce((s, p) => s + (p.plan_review_rounds_avg ?? 2), 0) / permits.length).toFixed(1))
    : 2;
  const expedited = permits.some(p => p.expedited_available);
  const online    = permits.some(p => p.online_submission);
  const allReqs   = [...new Set(permits.flatMap(p => p.requirements))].slice(0, 6);
  const allIssues = [...new Set(permits.flatMap(p => p.common_issues))].slice(0, 4);
  const workflow  = workflows[0];

  // ── 6. Build risks ───────────────────────────────────────────────────────────
  const risks: string[] = [];

  // Live data risks first
  if (live.zoning) {
    risks.push(`Live zoning: ${liveZoneCode} (${liveDistrict}) — permits must align with this classification`);
    if (liveNepa === 'NONE') {
      risks.push("No NEPA exemption on record — environmental review may be triggered");
    }
  }
  if (live.feasibility) {
    if (liveFeasDecision === 'NO_GO') {
      risks.push("CRITICAL: Feasibility is NO_GO — permit filing should be paused pending review");
    } else if (liveFeasDecision === 'CONDITIONAL') {
      risks.push(`Feasibility is CONDITIONAL — verify conditions are met before permit submission`);
    }
  }
  if (live.twin) {
    if (live.twin.status === 'FEASIBILITY' || live.twin.status === 'ENTITLEMENT') {
      risks.push(`Project in ${live.twin.status} phase — permit timeline must align with entitlement schedule`);
    }
    if (live.twin.healthStatus === 'CRITICAL') {
      risks.push(`Digital Twin CRITICAL (score ${live.twin.healthScore}/100) — permit delays likely`);
    }
  }

  // RAG risks
  risks.push(`Plan review averages ${avgRounds} rounds — submit complete package to minimize comment cycles`);
  risks.push(...allIssues.map(i => `Avoid: ${i}`));
  risks.push(`Processing: ${minDays}–${maxDays} days (avg ${avgDays}) — not including comment resolution`);
  risks.push(expedited
    ? "Expedited review available — confirm fee premium for faster approval"
    : "No expedited option — plan around standard timeline");
  if (workflow) {
    risks.push(`Permit phase leads to ${workflow.next_stage ?? "bidding"} — pre-qualify contractors now`);
  }

  // ── 7. Confidence ────────────────────────────────────────────────────────────
  const liveBoost = live.source === 'live_db' ? 1 : 0;
  const ragScore  = permits.length >= 5 ? 2 : permits.length >= 2 ? 1 : 0;
  const confidence: "high" | "medium" | "low" =
    (ragScore + liveBoost) >= 2 ? "high" : (ragScore + liveBoost) >= 1 ? "medium" : "low";

  // ── 8. Summary ───────────────────────────────────────────────────────────────
  const liveZoningLine = live.zoning
    ? `Live zoning: ${liveZoneCode} (${liveDistrict}).`
    : null;
  const liveFeasLine   = live.feasibility
    ? `Feasibility: ${liveFeasStatus}${liveFeasDecision ? ` / ${liveFeasDecision}` : ''}.`
    : null;
  const liveTwinLine   = live.twin
    ? `Twin phase: ${live.twin.status}, health ${live.twin.healthScore}/100.`
    : null;

  const summary = [
    `Permit analysis for ${input.projectType ?? "residential"} in ${input.jurisdiction}.`,
    liveZoningLine,
    liveFeasLine,
    liveTwinLine,
    `${permits.length} permit records found.`,
    `Timeline: ${avgDays} days average (${minDays}–${maxDays} day range).`,
    `Base permit fee: $${avgFee.toLocaleString()}.`,
    allReqs.length ? `Required: ${allReqs.slice(0, 3).join(", ")}.` : "",
    `CTC permit contribution: ${formatCurrency(ctcResult.breakdown.soft)} (soft costs).`,
    online ? "Online submission available." : "In-person submission required.",
  ].filter(Boolean).join(" ");

  return {
    summary,
    risks: risks.slice(0, 6),
    confidence,
    next_step:          "Match with a licensed contractor who has proven permit experience in this jurisdiction.",
    cta:                "Find Verified Contractors — $199",
    conversion_product: "CONTRACTOR_MATCH",
    ctc: {
      total:         ctcResult.total,
      range:         ctcResult.range,
      cost_per_sqft: ctcResult.cost_per_sqft,
      sqft:          targetSqft,
      breakdown:     ctcResult.breakdown,
    },
    data_used: {
      // Live DB (source of truth)
      ...liveDBSummary(live),
      live_zoning_code:      liveZoneCode,
      live_zoning_district:  liveDistrict,
      live_nepa_exemption:   liveNepa,
      live_feas_decision:    liveFeasDecision,
      live_feas_roi:         liveFeasROI,
      live_twin_phase:       live.twin?.status ?? null,
      // RAG fallback counts
      rag_permit_records:    permits.length,
      rag_workflow_records:  workflows.length,
      // Resolved values
      resolved_sqft:         targetSqft,
      avg_permit_days:       avgDays,
      avg_permit_fee:        avgFee,
      jurisdiction:          input.jurisdiction,
      project_type:          input.projectType,
    },
  };
}
