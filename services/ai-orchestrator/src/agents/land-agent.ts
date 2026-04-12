/**
 * land-agent.ts
 *
 * Decision engine for land feasibility analysis.
 * Uses RAG to retrieve zoning + workflow data for the jurisdiction
 * and produces a structured output that DRIVES conversion to
 * the DESIGN_CONCEPT_VALIDATION paid service.
 */

import {
  buildRAGContext,
  isRAGLoaded,
  ZoningRecord,
  WorkflowRecord,
} from "../retrieval/rag-retriever";

export interface LandAgentInput {
  jurisdiction: string;
  projectType?: string;
  address?: string;
  acreage?: number;
  stage?: string;
}

export interface AgentOutput {
  summary: string;
  risks: string[];
  confidence: "high" | "medium" | "low";
  next_step: string;
  cta: string;
  conversion_product?: string;
  data_used?: Record<string, unknown>;
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
    projectType: input.projectType ?? "single-family",
    stage: "land-analysis",
  });

  if (!ragContext) {
    return {
      summary: `No zoning or permit data found for "${input.jurisdiction}". Jurisdiction may not yet be in our dataset.`,
      risks: ["Jurisdiction data unavailable — manual research required"],
      confidence: "low",
      next_step: "Request a manual jurisdiction analysis from our team.",
      cta: "Request Custom Analysis",
      conversion_product: "CUSTOM_ANALYSIS",
    };
  }

  const zoning: ZoningRecord[] = ragContext.zoning;
  const workflows: WorkflowRecord[] = ragContext.workflows;
  const permits = ragContext.permits;

  // Derive feasibility insights
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
  if (maxCoverage !== null && maxCoverage < 40) risks.push(`Low max lot coverage (${maxCoverage}%) limits buildable area`);
  if (minLot !== null && minLot > 10000) risks.push(`Large minimum lot size (${minLot.toLocaleString()} sqft) may affect parcel viability`);
  if (avgPermitDays > 50) risks.push(`Permit processing averages ${avgPermitDays} days — factor into schedule`);
  if (!aduAllowed) risks.push("ADU not permitted by right — verify via zoning board");
  if (zoning.some(z => z.by_right === false)) risks.push("Some uses require Special Exception — additional approval needed");
  risks.push("Conduct Phase I Environmental Site Assessment before purchase");
  risks.push("Confirm utility capacity at site (water, sewer, electric, gas)");
  if (risks.length < 3) risks.push("Title search and survey required before design begins");

  const summary = [
    `Land feasibility analysis for ${input.address ?? "subject property"} in ${input.jurisdiction}.`,
    zoning.length
      ? `Found ${zoning.length} zoning classifications (${zonesFound}): max ${maxCoverage}% lot coverage, ${maxHeight}ft height limit.`
      : "No zoning records found for this jurisdiction.",
    aduAllowed
      ? `ADU is permitted — minimum ${zoning.find(z => z.adu_allowed)?.min_adu_sqft ?? "N/A"} sqft.`
      : "ADU not permitted by right in this zone.",
    `Average permit processing: ${avgPermitDays} days.`,
    workflow ? `Next workflow stage: ${workflow.next_stage ?? "design"} (est. ${workflow.estimated_days} days).` : "",
  ].filter(Boolean).join(" ");

  return {
    summary,
    risks: risks.slice(0, 6),
    confidence: zoning.length >= 3 ? "high" : zoning.length >= 1 ? "medium" : "low",
    next_step: "Validate your concept design against confirmed zoning with a licensed architect.",
    cta: "Get Design Concept Validation — $299",
    conversion_product: "DESIGN_CONCEPT_VALIDATION",
    data_used: {
      zoning_records: zoning.length,
      permit_records: permits.length,
      workflow_records: workflows.length,
      jurisdiction: input.jurisdiction,
      project_type: input.projectType,
    },
  };
}
