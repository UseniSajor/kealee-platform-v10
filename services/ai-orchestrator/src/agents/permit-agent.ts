/**
 * permit-agent.ts
 *
 * Decision engine for permit requirement analysis.
 * Retrieves permit records, computes permit-phase CTC contribution,
 * and drives conversion to CONTRACTOR_MATCH ($199).
 */

import {
  buildRAGContext,
  isRAGLoaded,
  retrieveCostContext,
  retrieveZoningContext,
} from "../retrieval/rag-retriever";
import { calculateCTC, formatCurrency } from "../costing/ctc-calculator";
import type { AgentOutput } from "../types/agent-types";

export interface PermitAgentInput {
  jurisdiction:  string;
  projectType?:  string;
  sqft?:         number;
  stage?:        string;
}

export async function executePermitAgent(input: PermitAgentInput): Promise<AgentOutput> {
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
    stage:        "permitting",
  });

  if (!ragContext) {
    return {
      summary: `No permit data found for "${input.jurisdiction}".`,
      risks: ["Jurisdiction permit data unavailable — manual research required"],
      confidence: "low",
      next_step: "Request a custom permit research package for this jurisdiction.",
      cta: "Find Verified Contractors — $199",
      conversion_product: "CONTRACTOR_MATCH",
    };
  }

  const { permits, workflows } = ragContext;

  // CTC context for this project
  const costRecords   = retrieveCostContext(input.projectType ?? "single-family", input.jurisdiction);
  const zoningRecords = retrieveZoningContext(input.jurisdiction);
  const targetSqft    = input.sqft ?? (costRecords.length
    ? Math.round(costRecords.reduce((s, c) => s + c.avg_size_sqft, 0) / costRecords.length)
    : 1500);

  const ctcResult = calculateCTC({
    projectType:   input.projectType ?? "single-family",
    jurisdiction:  input.jurisdiction,
    sqft:          targetSqft,
    costRecords,
    permitRecords: permits,
    zoningRecords,
  });

  // Permit metrics
  const avgDays    = permits.length ? Math.round(permits.reduce((s, p) => s + p.processing_days, 0) / permits.length) : 45;
  const minDays    = permits.length ? Math.min(...permits.map(p => p.processing_days)) : 20;
  const maxDays    = permits.length ? Math.max(...permits.map(p => p.processing_days)) : 75;
  const avgFee     = permits.length ? Math.round(permits.reduce((s, p) => s + p.fee_base, 0) / permits.length) : 800;
  const avgRounds  = permits.length
    ? parseFloat((permits.reduce((s, p) => s + (p.plan_review_rounds_avg ?? 2), 0) / permits.length).toFixed(1))
    : 2;
  const expedited  = permits.some(p => p.expedited_available);
  const online     = permits.some(p => p.online_submission);
  const allReqs    = [...new Set(permits.flatMap(p => p.requirements))].slice(0, 6);
  const allIssues  = [...new Set(permits.flatMap(p => p.common_issues))].slice(0, 4);
  const workflow   = workflows[0];

  const risks: string[] = [
    `Plan review averages ${avgRounds} rounds — submit complete package to minimize comment cycles`,
    ...allIssues.map(i => `Avoid: ${i}`),
    `Processing: ${minDays}–${maxDays} days (avg ${avgDays}) — not including comment resolution`,
    expedited
      ? "Expedited review available — ask about fee premium for faster approval"
      : "No expedited option — standard timeline applies, plan accordingly",
    workflow ? `Permit phase leads to ${workflow.next_stage ?? "bidding"} — pre-qualify contractors now` : "",
  ].filter(Boolean).slice(0, 6);

  const summary = [
    `Permit analysis for ${input.projectType ?? "residential"} in ${input.jurisdiction}.`,
    `${permits.length} permit records found.`,
    `Timeline: ${avgDays} days average (${minDays}–${maxDays} day range).`,
    `Base permit fee: $${avgFee.toLocaleString()}.`,
    `Required documents: ${allReqs.slice(0, 3).join(", ")}.`,
    `CTC permit contribution: ${formatCurrency(ctcResult.breakdown.soft)} (soft costs).`,
    online ? "Online submission available." : "In-person submission required.",
  ].join(" ");

  return {
    summary,
    risks,
    confidence:         permits.length >= 5 ? "high" : permits.length >= 2 ? "medium" : "low",
    next_step:          "Match with a licensed contractor who has proven permit experience in this jurisdiction.",
    cta:                "Find Verified Contractors — $199",
    conversion_product: "CONTRACTOR_MATCH",
    ctc: {
      total:         ctcResult.total,
      range:         ctcResult.range,
      cost_per_sqft: ctcResult.cost_per_sqft,
      sqft:          ctcResult.sqft,
      breakdown:     ctcResult.breakdown,
    },
    data_used: {
      permit_records:   permits.length,
      workflow_records: workflows.length,
      avg_permit_days:  avgDays,
      avg_permit_fee:   avgFee,
      jurisdiction:     input.jurisdiction,
      project_type:     input.projectType,
    },
  };
}
