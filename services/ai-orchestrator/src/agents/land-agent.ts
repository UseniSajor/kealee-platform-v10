/**
 * land-agent.ts
 *
 * Decision engine for land feasibility analysis.
 * Uses RAG zoning + permit data, computes a preliminary CTC,
 * and drives conversion to DESIGN_CONCEPT_VALIDATION ($395).
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrieveCostContext,
  retrievePermitContext,
} from "../retrieval/rag-retriever";
import { calculateCTC, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface LandAgentInput {
  jurisdiction:  string;
  projectType?:  string;
  address?:      string;
  acreage?:      number;
  sqft?:         number;
  stage?:        string;
}

export async function executeLandAgent(input: LandAgentInput): Promise<AgentOutput> {
  if (!isRAGLoaded()) {
    return {
      summary: "RAG dataset not available.",
      risks: ["System error: dataset not loaded"],
      confidence: "low",
      next_step: "Contact support — RAG system offline.",
      cta: "Contact Support",
      conversion_product: "SUPPORT",
    };
  }

  const ragContext = buildRAGContext({
    jurisdiction: input.jurisdiction,
    projectType:  input.projectType ?? "single-family",
    stage:        "land-analysis",
  });

  if (!ragContext) {
    return {
      summary: `No zoning or permit data found for "${input.jurisdiction}".`,
      risks: ["Jurisdiction data unavailable — manual research required"],
      confidence: "low",
      next_step: "Request a manual jurisdiction analysis from our team.",
      cta: "Get Design Concept Validation — $395",
      conversion_product: "DESIGN_CONCEPT_VALIDATION",
    };
  }

  const { zoning, workflows, permits } = ragContext;

  // Preliminary CTC — uses cost records for this project type
  const costRecords  = retrieveCostContext(input.projectType ?? "single-family", input.jurisdiction);
  const permitRecords = retrievePermitContext(input.jurisdiction, input.projectType ?? "single-family");
  const targetSqft   = input.sqft ?? 1500;

  const ctcResult = calculateCTC({
    projectType:   input.projectType ?? "single-family",
    jurisdiction:  input.jurisdiction,
    sqft:          targetSqft,
    costRecords,
    permitRecords,
    zoningRecords: zoning,
  });

  // Feasibility insights
  const aduAllowed    = zoning.some(z => z.adu_allowed);
  const maxCoverage   = zoning.length ? Math.max(...zoning.map(z => z.max_lot_coverage)) : null;
  const minLot        = zoning.length ? Math.min(...zoning.map(z => z.min_lot_size_sqft)) : null;
  const maxHeight     = zoning.length ? Math.max(...zoning.map(z => z.max_height_ft)) : null;
  const zonesFound    = zoning.map(z => z.zone).slice(0, 3).join(", ");
  const avgPermitDays = permits.length
    ? Math.round(permits.reduce((s, p) => s + p.processing_days, 0) / permits.length)
    : 45;
  const workflow = workflows[0];

  const risks: string[] = [];
  if (maxCoverage !== null && maxCoverage < 40)
    risks.push(`Low max lot coverage (${maxCoverage}%) limits buildable footprint`);
  if (minLot !== null && minLot > 10_000)
    risks.push(`Large minimum lot size (${minLot.toLocaleString()} sqft) may constrain parcel options`);
  if (avgPermitDays > 50)
    risks.push(`Permit processing averages ${avgPermitDays} days — factor into financing schedule`);
  if (!aduAllowed)
    risks.push("ADU not permitted by right — verify via zoning board before acquisition");
  if (zoning.some(z => z.by_right === false))
    risks.push("Some uses require Special Exception — adds 3–6 months and approval risk");
  risks.push("Phase I Environmental Site Assessment required before purchase");
  risks.push("Confirm utility capacity at site (water, sewer, electric, gas)");
  if (risks.length < 4) risks.push("Title search and ALTA survey required before design begins");

  const summary = [
    `Land feasibility for ${input.address ?? "subject property"} in ${input.jurisdiction}.`,
    zoning.length
      ? `${zoning.length} zoning classifications (${zonesFound}): max ${maxCoverage}% lot coverage, ${maxHeight}ft height limit.`
      : "No zoning records found — manual research required.",
    aduAllowed
      ? `ADU permitted — min ${zoning.find(z => z.adu_allowed)?.min_adu_sqft ?? "N/A"} sqft.`
      : "ADU not by right.",
    `Avg permit timeline: ${avgPermitDays} days.`,
    `Preliminary CTC: ${formatCurrency(ctcResult.range[0])} – ${formatCurrency(ctcResult.range[1])}.`,
    workflow ? `Next phase: ${workflow.next_stage ?? "design"} (~${workflow.estimated_days} days).` : "",
  ].filter(Boolean).join(" ");

  return {
    summary,
    risks: risks.slice(0, 6),
    confidence:         zoning.length >= 3 ? "high" : zoning.length >= 1 ? "medium" : "low",
    next_step:          "Validate your concept design against confirmed zoning with a licensed architect.",
    cta:                "Get Design Concept Validation — $395",
    conversion_product: "DESIGN_CONCEPT_VALIDATION",
    ctc: {
      total:         ctcResult.total,
      range:         ctcResult.range,
      cost_per_sqft: ctcResult.cost_per_sqft,
      sqft:          ctcResult.sqft,
      breakdown:     ctcResult.breakdown,
    },
    data_used: {
      zoning_records:  zoning.length,
      permit_records:  permits.length,
      workflow_records: workflows.length,
      jurisdiction:    input.jurisdiction,
      project_type:    input.projectType,
    },
  };
}
