/**
 * contractor-agent.ts
 *
 * Decision engine for construction planning and contractor readiness.
 * Computes full CTC and drives conversion to PROJECT_EXECUTION.
 * For large projects (CTC > $500k), escalates to PM + contractor match.
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrievePermitContext,
} from "../retrieval/rag-retriever";
import { calculateCTC, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface ContractorAgentInput {
  jurisdiction?: string;
  projectType:   string;
  sqft?:         number;
  stage?:        string;
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
    projectType:  input.projectType,
    stage:        "construction",
  });

  if (!ragContext) {
    return {
      summary: `No construction cost data found for "${input.projectType}".`,
      risks: ["Cost data unavailable — manual estimation required"],
      confidence: "low",
      next_step: "Request a custom construction estimate.",
      cta: "Start Project Execution — Get Matched Now",
      conversion_product: "PROJECT_EXECUTION",
    };
  }

  const { costs, zoning, workflows } = ragContext;
  const permitRecords = retrievePermitContext(input.jurisdiction ?? "", input.projectType);

  const avgSqft    = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.avg_size_sqft, 0) / costs.length)
    : 1500;
  const targetSqft = input.sqft ?? avgSqft;

  // ── Full CTC ──────────────────────────────────────────────────────────────
  const ctcResult = calculateCTC({
    projectType:   input.projectType,
    jurisdiction:  input.jurisdiction ?? "",
    sqft:          targetSqft,
    costRecords:   costs,
    permitRecords,
    zoningRecords: zoning,
  });

  const avgDuration    = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.typical_duration_months, 0) / costs.length)
    : 8;
  const allCategories  = [...new Set(costs.flatMap(c => c.primary_expense_categories))].slice(0, 5);
  const maxCoverage    = zoning.length ? Math.max(...zoning.map(z => z.max_lot_coverage)) : null;
  const maxHeight      = zoning.length ? Math.max(...zoning.map(z => z.max_height_ft)) : null;
  const workflow       = workflows[0];

  const risks: string[] = [
    `Monitor critical cost categories: ${allCategories.slice(0, 3).join(", ")}`,
    `Build duration: ~${avgDuration} months — material delays can add 10–20%`,
    maxCoverage ? `Zoning max coverage: ${maxCoverage}% — verify site plan before breaking ground` : "Confirm lot coverage limits with surveyor",
    maxHeight ? `Max building height: ${maxHeight}ft — structural plans must comply` : "Confirm height limits with jurisdiction",
    "Require licensed, bonded contractor with jurisdiction permit history",
    workflow ? `Construction leads to ${workflow.next_stage ?? "inspections"} — pre-schedule all required inspections` : "Pre-schedule all required inspections",
  ].filter(Boolean).slice(0, 6);

  const summary = [
    `Construction planning for ${input.projectType} in ${input.jurisdiction ?? "DMV region"}.`,
    `Full CTC: ${formatCurrency(ctcResult.range[0])} – ${formatCurrency(ctcResult.range[1])}.`,
    `Construction: ${formatCurrency(ctcResult.breakdown.construction)} | Soft: ${formatCurrency(ctcResult.breakdown.soft)} | Risk: ${formatCurrency(ctcResult.breakdown.risk)} | Execution: ${formatCurrency(ctcResult.breakdown.execution)}.`,
    `Build duration: ${avgDuration} months.`,
    `Key categories: ${allCategories.join(", ")}.`,
    zoning.length ? `Zoning: ${maxCoverage}% max coverage, ${maxHeight}ft max height.` : "",
  ].filter(Boolean).join(" ");

  // CTA escalation for large projects
  const { cta, conversion_product } = ctcResult.total >= 500_000
    ? { cta: "Match with PM + Verified GC — $3,749", conversion_product: "PERMIT_PACKAGE_PM" }
    : { cta: "Start Project Execution — Get Matched Now", conversion_product: "PROJECT_EXECUTION" };

  return {
    summary,
    risks,
    confidence: costs.length >= 5 ? "high" : costs.length >= 2 ? "medium" : "low",
    next_step:  "Engage a verified general contractor and mobilize for construction phase.",
    cta,
    conversion_product,
    ctc: {
      total:         ctcResult.total,
      range:         ctcResult.range,
      cost_per_sqft: ctcResult.cost_per_sqft,
      sqft:          ctcResult.sqft,
      breakdown:     ctcResult.breakdown,
    },
    data_used: {
      cost_records:    costs.length,
      zoning_records:  zoning.length,
      total_ctc:       ctcResult.total,
      project_type:    input.projectType,
      jurisdiction:    input.jurisdiction,
    },
  };
}
