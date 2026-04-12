/**
 * permit-agent.ts
 *
 * Decision engine for permit requirement analysis.
 * Retrieves permit records from RAG and drives conversion to
 * the CONTRACTOR_MATCH paid service.
 */

import {
  buildRAGContext,
  isRAGLoaded,
  PermitRecord,
  WorkflowRecord,
} from "../retrieval/rag-retriever";

export interface PermitAgentInput {
  jurisdiction: string;
  projectType?: string;
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
    projectType: input.projectType ?? "single-family",
    stage: "permitting",
  });

  if (!ragContext) {
    return {
      summary: `No permit data found for "${input.jurisdiction}". This jurisdiction may require a custom permit research.`,
      risks: ["Jurisdiction permit data unavailable — manual research required"],
      confidence: "low",
      next_step: "Request a custom permit research package for this jurisdiction.",
      cta: "Order Custom Permit Research — $399",
      conversion_product: "CUSTOM_PERMIT_RESEARCH",
    };
  }

  const permits: PermitRecord[]   = ragContext.permits;
  const workflows: WorkflowRecord[] = ragContext.workflows;

  // Aggregate permit metrics
  const avgDays = permits.length
    ? Math.round(permits.reduce((s, p) => s + p.processing_days, 0) / permits.length)
    : 45;
  const minDays = permits.length ? Math.min(...permits.map(p => p.processing_days)) : 20;
  const maxDays = permits.length ? Math.max(...permits.map(p => p.processing_days)) : 75;
  const avgFee  = permits.length
    ? Math.round(permits.reduce((s, p) => s + p.fee_base, 0) / permits.length)
    : 500;
  const avgReviewRounds = permits.length
    ? parseFloat((permits.reduce((s, p) => s + (p.plan_review_rounds_avg ?? 2), 0) / permits.length).toFixed(1))
    : 2;
  const expeditedAvailable = permits.some(p => p.expedited_available);
  const onlineSubmission   = permits.some(p => p.online_submission);

  // Consolidate requirements and issues
  const allReqs   = [...new Set(permits.flatMap(p => p.requirements))].slice(0, 6);
  const allIssues = [...new Set(permits.flatMap(p => p.common_issues))].slice(0, 5);
  const workflow  = workflows[0];

  const risks: string[] = [
    `Plan review averages ${avgReviewRounds} rounds — submit complete package to minimize delays`,
    ...allIssues.map(i => `Avoid: ${i}`),
    `Processing time: ${minDays}–${maxDays} days (avg ${avgDays} days) — not including comment resolution`,
    expeditedAvailable
      ? "Expedited review available — ask about fee premium for faster approval"
      : "No expedited review — standard processing timeline applies",
    workflow ? `Permitting stage typically takes ~${workflow.estimated_days ?? avgDays} days and leads to ${workflow.next_stage ?? "bidding"} phase` : "",
  ].filter(Boolean).slice(0, 6);

  const summary = [
    `Permit analysis for ${input.projectType ?? "residential"} project in ${input.jurisdiction}.`,
    `Found ${permits.length} permit records.`,
    `Processing time: ${avgDays} days average (range: ${minDays}–${maxDays} days).`,
    `Estimated base permit fee: $${avgFee.toLocaleString()}.`,
    `Required documents: ${allReqs.slice(0, 3).join(", ")}.`,
    onlineSubmission ? "Online submission available." : "In-person submission required.",
  ].join(" ");

  return {
    summary,
    risks,
    confidence: permits.length >= 5 ? "high" : permits.length >= 2 ? "medium" : "low",
    next_step: "Match with a licensed contractor who has permit experience in this jurisdiction.",
    cta: "Find Verified Contractors — $199",
    conversion_product: "CONTRACTOR_MATCH",
    data_used: {
      permit_records: permits.length,
      workflow_records: workflows.length,
      avg_processing_days: avgDays,
      avg_fee: avgFee,
      expedited_available: expeditedAvailable,
      jurisdiction: input.jurisdiction,
      project_type: input.projectType,
    },
  };
}
