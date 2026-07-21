/**
 * design-agent.ts
 *
 * Decision engine for design concept + cost analysis.
 * Retrieves cost and workflow data from RAG, computes full CTC,
 * and drives conversion to PERMIT_PACKAGE ($799) or
 * PERMIT_PACKAGE_PM ($3,749) for large projects.
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrieveCostContext,
  retrievePermitContext,
  retrieveZoningContext,
} from "../retrieval/rag-retriever";
import { calculateCTC, ctcCTAAndProduct, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface DesignAgentInput {
  jurisdiction?: string;
  projectType:   string;
  sqft?:         number;
  stage?:        string;
}

export async function executeDesignAgent(input: DesignAgentInput): Promise<AgentOutput> {
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
    stage:        "design",
  });

  if (!ragContext) {
    return {
      summary: `No cost or design data found for project type "${input.projectType}".`,
      risks: ["Project type not in dataset — cost estimate unavailable"],
      confidence: "low",
      next_step: "Request a custom cost estimate from our team.",
      cta: "Order Permit Package — $799",
      conversion_product: "PERMIT_PACKAGE",
    };
  }

  const { costs, workflows } = ragContext;

  // Pull full context for CTC
  const permitRecords = retrievePermitContext(input.jurisdiction ?? "", input.projectType);
  const zoningRecords = retrieveZoningContext(input.jurisdiction ?? "");

  // Target sqft
  const avgSqft    = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.avg_size_sqft, 0) / costs.length)
    : 1500;
  const targetSqft = input.sqft ?? avgSqft;

  // ── CTC Calculation ──────────────────────────────────────────────────────
  const ctcResult = calculateCTC({
    projectType:   input.projectType,
    jurisdiction:  input.jurisdiction ?? "",
    sqft:          targetSqft,
    costRecords:   costs,
    permitRecords,
    zoningRecords,
  });

  const { cta, conversion_product } = ctcCTAAndProduct(ctcResult.total);

  // ── Risk factors ─────────────────────────────────────────────────────────
  const avgSoftPct     = costs.length ? costs.reduce((s, c) => s + c.soft_costs_percent, 0) / costs.length : 12;
  const avgContingency = costs.length ? costs.reduce((s, c) => s + c.contingency_percent, 0) / costs.length : 15;
  const avgDurationMo  = costs.length ? Math.round(costs.reduce((s, c) => s + c.typical_duration_months, 0) / costs.length) : 8;
  const topExpenses    = [...new Set(costs.flatMap(c => c.primary_expense_categories))].slice(0, 4);
  const workflow       = workflows[0];

  const risks: string[] = [
    `Budget variance: ${formatCurrency(ctcResult.range[0])}–${formatCurrency(ctcResult.range[1])} depending on site conditions`,
    `Soft costs (~${Math.round(avgSoftPct)}%) must be budgeted separately from construction`,
    `Hold ${Math.round(avgContingency)}% contingency — typical for ${input.projectType}`,
    `Coordinate ${topExpenses[0] ?? "foundation"} and ${topExpenses[1] ?? "framing"} early to avoid delays`,
    `Design phase takes ~${workflow?.estimated_days ?? 30} days — plan permit submission timeline`,
    "Value engineering review recommended before design development is finalized",
  ];

  const summary = [
    `Design feasibility for ${input.projectType} in ${input.jurisdiction ?? "DMV region"}.`,
    `CTC estimate: ${formatCurrency(ctcResult.range[0])} – ${formatCurrency(ctcResult.range[1])}.`,
    `Construction: ${formatCurrency(ctcResult.breakdown.construction)} at ${ctcResult.cost_per_sqft}/sqft × ${targetSqft.toLocaleString()} sqft.`,
    `Soft costs: ${formatCurrency(ctcResult.breakdown.soft)} | Risk buffer: ${formatCurrency(ctcResult.breakdown.risk)} | Execution: ${formatCurrency(ctcResult.breakdown.execution)}.`,
    `Typical build duration: ${avgDurationMo} months.`,
  ].join(" ");

  return {
    summary,
    risks,
    confidence:         costs.length >= 5 ? "high" : costs.length >= 2 ? "medium" : "low",
    next_step:          "Prepare your permit application package with stamped drawings and specifications.",
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
      workflow_records: workflows.length,
      total_ctc:       ctcResult.total,
      project_type:    input.projectType,
      jurisdiction:    input.jurisdiction,
    },
  };
}
