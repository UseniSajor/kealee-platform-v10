/**
 * land-agent.ts
 *
 * Decision engine for land feasibility analysis.
 * Uses live Prisma data (Parcel, ZoningProfile, FeasibilityStudy, DigitalTwin)
 * FIRST, then falls back to RAG for any missing context.
 * Live DB data ALWAYS overrides RAG static data.
 *
 * Drives conversion to DESIGN_CONCEPT_VALIDATION ($395).
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrieveCostContext,
  retrievePermitContext,
} from "../retrieval/rag-retriever";
import { fetchLiveDBContext, liveDBSummary } from "../retrieval/live-db";
import { calculateCTC, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface LandAgentInput {
  jurisdiction:  string;
  projectType?:  string;
  address?:      string;
  acreage?:      number;
  sqft?:         number;
  stage?:        string;
  /** If provided, live DB data is fetched and overrides RAG */
  projectId?:    string;
}

export async function executeLandAgent(input: LandAgentInput): Promise<AgentOutput> {
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
    stage:        "land-analysis",
  });

  if (!ragContext && live.source === 'none') {
    return {
      summary: `No zoning or permit data found for "${input.jurisdiction}".`,
      risks: ["Jurisdiction data unavailable — manual research required"],
      confidence: "low",
      next_step: "Request a manual jurisdiction analysis from our team.",
      cta: "Get Design Concept Validation — $395",
      conversion_product: "DESIGN_CONCEPT_VALIDATION",
      data_used: { ...liveDBSummary(live) },
    };
  }

  const { zoning: ragZoning = [], workflows = [], permits = [] } = ragContext ?? {};

  // ── 3. Merge: live DB overrides RAG ─────────────────────────────────────────
  // Sqft: live parcel.squareFeet > input.sqft > RAG avg
  const liveAcreage = live.parcel?.acreage ? Number(live.parcel.acreage) : null;
  const liveSqft    = live.parcel?.squareFeet ? Number(live.parcel.squareFeet) : null;
  const targetSqft  = liveSqft ?? input.sqft ?? 1500;
  const targetAcreage = liveAcreage ?? input.acreage;

  // Zoning constraints: live ZoningProfile > RAG zoning records
  const liveMaxCoverage = live.zoning?.maxLotCoverage ?? null;
  const liveMaxHeight   = live.zoning?.maxHeight      ?? null;
  const liveZoneCode    = live.zoning?.zoningCode      ?? null;
  const liveDistrict    = live.zoning?.zoningDistrict  ?? null;

  // RAG fallback values
  const ragMaxCoverage = ragZoning.length ? Math.max(...ragZoning.map(z => z.max_lot_coverage)) : null;
  const ragMaxHeight   = ragZoning.length ? Math.max(...ragZoning.map(z => z.max_height_ft))   : null;
  const aduAllowed     = ragZoning.some(z => z.adu_allowed);
  const minLot         = ragZoning.length ? Math.min(...ragZoning.map(z => z.min_lot_size_sqft)) : null;
  const zonesFound     = ragZoning.map(z => z.zone).slice(0, 3).join(", ");

  // Final resolved values (live wins)
  const maxCoverage = liveMaxCoverage ?? ragMaxCoverage;
  const maxHeight   = liveMaxHeight   ?? ragMaxHeight;

  // ── 4. CTC Calculation ───────────────────────────────────────────────────────
  const costRecords   = retrieveCostContext(input.projectType ?? "single-family", input.jurisdiction);
  const permitRecords = retrievePermitContext(input.jurisdiction, input.projectType ?? "single-family");

  const ctcResult = calculateCTC({
    projectType:   input.projectType ?? "single-family",
    jurisdiction:  input.jurisdiction,
    sqft:          targetSqft,
    costRecords,
    permitRecords,
    zoningRecords: ragZoning,
  });

  // If live feasibility exists — override CTC total with study's totalProjectCost
  const liveTotalCost = live.feasibility?.totalProjectCost
    ? Number(live.feasibility.totalProjectCost)
    : null;

  const avgPermitDays = permits.length
    ? Math.round(permits.reduce((s, p) => s + p.processing_days, 0) / permits.length)
    : 45;
  const workflow = workflows[0];

  // ── 5. Build risks ───────────────────────────────────────────────────────────
  const risks: string[] = [];

  // Live data insights first
  if (live.parcel) {
    if (live.parcel.developmentScore !== null && live.parcel.developmentScore < 50) {
      risks.push(`Development score ${live.parcel.developmentScore}/100 — site has notable constraints`);
    }
    if (live.parcel.status !== 'IDENTIFIED' && live.parcel.status !== 'ACQUIRED') {
      risks.push(`Parcel status: ${live.parcel.status} — verify acquisition stage before proceeding`);
    }
  }
  if (live.zoning) {
    if (live.zoning.maxFAR !== null && live.zoning.maxFAR < 0.5) {
      risks.push(`Low FAR (${live.zoning.maxFAR}) — limits allowable building area`);
    }
    if (live.zoning.nepaExemption === 'NONE') {
      risks.push("No NEPA exemption — environmental review may be required");
    }
  }
  if (live.feasibility) {
    if (live.feasibility.decision === 'NO_GO') {
      risks.push("CRITICAL: Feasibility study decision is NO_GO — review before proceeding");
    } else if (live.feasibility.decision === 'CONDITIONAL') {
      risks.push(`Feasibility is CONDITIONAL — review study conditions before commitment`);
    }
  }
  if (live.twin && live.twin.healthStatus === 'CRITICAL') {
    risks.push(`Digital Twin health: CRITICAL (score ${live.twin.healthScore}/100) — project needs immediate attention`);
  }

  // RAG-derived risks
  if (maxCoverage !== null && maxCoverage < 40)
    risks.push(`Max lot coverage ${maxCoverage}% limits buildable footprint`);
  if (minLot !== null && minLot > 10_000)
    risks.push(`Minimum lot size ${minLot.toLocaleString()} sqft may constrain parcel options`);
  if (avgPermitDays > 50)
    risks.push(`Permit processing averages ${avgPermitDays} days — factor into financing schedule`);
  if (!aduAllowed && !live.zoning)
    risks.push("ADU not permitted by right — verify via zoning board before acquisition");
  risks.push("Phase I Environmental Site Assessment required before purchase");
  risks.push("Confirm utility capacity (water, sewer, electric, gas)");

  // ── 6. Confidence (live data boosts confidence) ───────────────────────────────
  const liveBoost = live.source === 'live_db' ? 1 : 0;
  const ragScore  = ragZoning.length >= 3 ? 2 : ragZoning.length >= 1 ? 1 : 0;
  const totalScore = ragScore + liveBoost;
  const confidence: "high" | "medium" | "low" =
    totalScore >= 2 ? "high" : totalScore >= 1 ? "medium" : "low";

  // ── 7. Summary ───────────────────────────────────────────────────────────────
  const liveParcelLine = live.parcel
    ? `Live parcel: ${live.parcel.address ?? 'address on file'}, ${liveAcreage?.toFixed(2) ?? 'N/A'} ac.`
    : null;
  const liveZoningLine = live.zoning
    ? `Live zoning: ${live.zoning.zoningCode} (${live.zoning.zoningDistrict}), max height ${liveMaxHeight}ft, max coverage ${liveMaxCoverage}%.`
    : null;
  const liveFeasLine   = live.feasibility
    ? `Feasibility: ${live.feasibility.status}${live.feasibility.decision ? ` / ${live.feasibility.decision}` : ''}${live.feasibility.bestROI ? `, ROI ${(live.feasibility.bestROI * 100).toFixed(1)}%` : ''}.`
    : null;
  const liveTwinLine   = live.twin
    ? `Digital Twin: ${live.twin.status}, health ${live.twin.healthScore}/100.`
    : null;

  const summary = [
    `Land feasibility for ${input.address ?? "subject property"} in ${input.jurisdiction}.`,
    liveParcelLine,
    liveZoningLine ?? (ragZoning.length
      ? `${ragZoning.length} RAG zoning records (${zonesFound}): max ${maxCoverage}% coverage, ${maxHeight}ft height.`
      : "No zoning records found."),
    liveFeasLine,
    liveTwinLine,
    `Preliminary CTC: ${formatCurrency(liveTotalCost ?? ctcResult.range[0])} – ${formatCurrency(ctcResult.range[1])}.`,
    workflow ? `Next phase: ${workflow.next_stage ?? "design"} (~${workflow.estimated_days} days).` : "",
  ].filter(Boolean).join(" ");

  return {
    summary,
    risks: risks.slice(0, 6),
    confidence,
    next_step:          "Validate your concept design against confirmed zoning with a licensed architect.",
    cta:                "Get Design Concept Validation — $395",
    conversion_product: "DESIGN_CONCEPT_VALIDATION",
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
      rag_zoning_records:   ragZoning.length,
      rag_permit_records:   permits.length,
      rag_workflow_records: workflows.length,
      // Resolved values
      resolved_sqft:        targetSqft,
      resolved_acreage:     targetAcreage ?? null,
      resolved_max_coverage: maxCoverage,
      resolved_max_height:  maxHeight,
      live_ctc_override:    liveTotalCost !== null,
      jurisdiction:         input.jurisdiction,
      project_type:         input.projectType,
    },
  };
}
