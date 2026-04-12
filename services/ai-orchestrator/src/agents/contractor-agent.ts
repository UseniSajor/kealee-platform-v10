/**
 * contractor-agent.ts
 *
 * Decision engine for construction planning and contractor readiness.
 * Retrieves cost + zoning data from RAG and drives conversion to
 * the PROJECT_EXECUTION paid service.
 */

import {
  buildRAGContext,
  isRAGLoaded,
  CostRecord,
  ZoningRecord,
  WorkflowRecord,
} from "../retrieval/rag-retriever";

export interface ContractorAgentInput {
  jurisdiction?: string;
  projectType: string;
  sqft?: number;
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

export async function executeContractorAgent(input: ContractorAgentInput): Promise<AgentOutput> {
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
    jurisdiction: input.jurisdiction ?? "",
    projectType: input.projectType,
    stage: "construction",
  });

  if (!ragContext) {
    return {
      summary: `No construction cost data found for project type "${input.projectType}".`,
      risks: ["Cost data unavailable — manual estimation required"],
      confidence: "low",
      next_step: "Request a custom construction estimate.",
      cta: "Request Custom Estimate",
      conversion_product: "CUSTOM_ESTIMATE",
    };
  }

  const costs: CostRecord[]     = ragContext.costs;
  const zoning: ZoningRecord[]  = ragContext.zoning;
  const workflows: WorkflowRecord[] = ragContext.workflows;

  // Cost metrics
  const avgCostPerSqft = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.cost_per_sqft, 0) / costs.length)
    : 0;
  const avgDuration = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.typical_duration_months, 0) / costs.length)
    : 8;
  const targetSqft = input.sqft ?? (costs.length
    ? Math.round(costs.reduce((s, c) => s + c.avg_size_sqft, 0) / costs.length)
    : 1500);
  const hardCostEst = avgCostPerSqft * targetSqft;

  const allCategories = [...new Set(costs.flatMap(c => c.primary_expense_categories))].slice(0, 5);
  const workflow = workflows[0];

  // Zoning constraints relevant to contractor
  const maxCoverage = zoning.length ? Math.max(...zoning.map(z => z.max_lot_coverage)) : null;
  const maxHeight   = zoning.length ? Math.max(...zoning.map(z => z.max_height_ft)) : null;

  const risks: string[] = [
    `Monitor critical cost categories: ${allCategories.slice(0, 3).join(", ")}`,
    `Construction duration: ~${avgDuration} months — weather and material delays can add 10–20%`,
    maxCoverage ? `Zoning max lot coverage: ${maxCoverage}% — verify site plan does not exceed` : "Confirm lot coverage with surveyor",
    maxHeight ? `Maximum building height: ${maxHeight}ft — structural plans must comply` : "Confirm height limits with jurisdiction",
    "Require licensed, bonded contractor with jurisdiction-specific permit experience",
    workflow ? `Construction phase typically leads to ${workflow.next_stage ?? "inspections"} — schedule inspections in advance` : "Pre-schedule all required inspections",
  ].filter(Boolean).slice(0, 6);

  const summary = [
    `Construction planning for ${input.projectType} in ${input.jurisdiction ?? "DMV region"}.`,
    `Estimated hard cost: $${avgCostPerSqft}/sqft × ${targetSqft.toLocaleString()} sqft = $${hardCostEst.toLocaleString()}.`,
    `Typical build duration: ${avgDuration} months.`,
    `Primary cost categories: ${allCategories.join(", ")}.`,
    zoning.length ? `Zoning constraints: ${maxCoverage}% max coverage, ${maxHeight}ft max height.` : "",
  ].filter(Boolean).join(" ");

  return {
    summary,
    risks,
    confidence: costs.length >= 5 ? "high" : costs.length >= 2 ? "medium" : "low",
    next_step: "Engage a verified general contractor and mobilize for construction phase.",
    cta: "Start Project Execution — Get Matched Now",
    conversion_product: "PROJECT_EXECUTION",
    data_used: {
      cost_records: costs.length,
      zoning_records: zoning.length,
      workflow_records: workflows.length,
      avg_cost_per_sqft: avgCostPerSqft,
      hard_cost_estimate: hardCostEst,
      project_type: input.projectType,
      jurisdiction: input.jurisdiction,
    },
  };
}
