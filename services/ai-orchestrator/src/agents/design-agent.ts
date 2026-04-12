/**
 * design-agent.ts
 *
 * Decision engine for design concept + cost analysis.
 * Retrieves cost and workflow data from RAG and drives conversion to
 * the PERMIT_PACKAGE paid service.
 */

import {
  buildRAGContext,
  isRAGLoaded,
  CostRecord,
  WorkflowRecord,
} from "../retrieval/rag-retriever";

export interface DesignAgentInput {
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
    projectType: input.projectType,
    stage: "design",
  });

  if (!ragContext) {
    return {
      summary: `No cost or design data found for project type "${input.projectType}".`,
      risks: ["Project type not in dataset — cost estimate unavailable"],
      confidence: "low",
      next_step: "Request a custom cost estimate from our team.",
      cta: "Request Custom Estimate",
      conversion_product: "CUSTOM_ESTIMATE",
    };
  }

  const costs: CostRecord[]   = ragContext.costs;
  const workflows: WorkflowRecord[] = ragContext.workflows;

  // Aggregate cost metrics
  const avgCostPerSqft = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.cost_per_sqft, 0) / costs.length)
    : 0;
  const avgSoftPct = costs.length
    ? parseFloat((costs.reduce((s, c) => s + c.soft_costs_percent, 0) / costs.length).toFixed(1))
    : 12;
  const avgContingency = costs.length
    ? parseFloat((costs.reduce((s, c) => s + c.contingency_percent, 0) / costs.length).toFixed(1))
    : 10;
  const avgDurationMo = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.typical_duration_months, 0) / costs.length)
    : 8;
  const avgSqft   = costs.length
    ? Math.round(costs.reduce((s, c) => s + c.avg_size_sqft, 0) / costs.length)
    : 1000;
  const targetSqft = input.sqft ?? avgSqft;
  const hardCostEst = avgCostPerSqft * targetSqft;
  const softCostEst = Math.round(hardCostEst * avgSoftPct / 100);
  const totalEst    = hardCostEst + softCostEst + Math.round(hardCostEst * avgContingency / 100);

  const topExpenses: string[] = costs.length
    ? [...new Set(costs.flatMap(c => c.primary_expense_categories))].slice(0, 4)
    : ["foundation", "framing", "MEP", "finishes"];

  const workflow = workflows[0];

  const risks: string[] = [
    `Budget variance risk: $${(avgCostPerSqft - 30).toLocaleString()}–$${(avgCostPerSqft + 40).toLocaleString()}/sqft range for ${input.projectType}`,
    `Soft costs (~${avgSoftPct}%) must be budgeted separately from construction`,
    `Hold ${avgContingency}% contingency — typical for this project type`,
    `Coordinate ${topExpenses[0]} and ${topExpenses[1]} early to avoid delays`,
    `Design phase takes approx ${workflow?.estimated_days ?? 30} days — plan permit submission timeline`,
    "Value engineering review recommended before design development is finalized",
  ];

  const summary = [
    `Design feasibility for ${input.projectType} in ${input.jurisdiction ?? "DMV region"}.`,
    `Cost estimate: $${avgCostPerSqft}/sqft × ${targetSqft.toLocaleString()} sqft = $${hardCostEst.toLocaleString()} hard cost.`,
    `With soft costs (${avgSoftPct}%) and ${avgContingency}% contingency: ~$${totalEst.toLocaleString()} total.`,
    `Typical construction duration: ${avgDurationMo} months.`,
    `Key expense categories: ${topExpenses.join(", ")}.`,
  ].join(" ");

  return {
    summary,
    risks,
    confidence: costs.length >= 5 ? "high" : costs.length >= 2 ? "medium" : "low",
    next_step: "Prepare your permit application package with stamped drawings and specifications.",
    cta: "Order Permit Package — $799",
    conversion_product: "PERMIT_PACKAGE",
    data_used: {
      cost_records: costs.length,
      workflow_records: workflows.length,
      avg_cost_per_sqft: avgCostPerSqft,
      total_estimate: totalEst,
      project_type: input.projectType,
      jurisdiction: input.jurisdiction,
    },
  };
}
