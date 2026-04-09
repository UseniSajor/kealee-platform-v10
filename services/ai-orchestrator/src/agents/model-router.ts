/**
 * agents/model-router.ts
 *
 * Wraps @kealee/core-llm routing for use inside LangGraph agent nodes.
 *
 * Provides a unified interface so graph nodes never hardcode model selection.
 * Follows the existing routing policy defined in packages/core-llm/src/router.ts:
 *   - Internal (Qwen) for classification, extraction, scoring, summarization
 *   - Claude/GPT for permit narratives, client-facing outputs, escalations
 */

import type { RoutingContext } from "@kealee/core-llm";

// Conditional import — core-llm may not be available in all environments
let coreRouter: { decideRoute: (ctx: RoutingContext) => { selectedProvider: string; reason: string } } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  coreRouter = require("@kealee/core-llm");
} catch {
  // core-llm not available — use fallback routing
}

// ─── Model selection for orchestrator contexts ────────────────────────────────

export type OrchestratorModelContext =
  | "classify_role"
  | "classify_intent"
  | "collect_intake"
  | "qualify_project"
  | "recommend_product"
  | "land_analysis_report"
  | "concept_generation"
  | "estimate_summary"
  | "permit_narrative"
  | "contractor_match_summary"
  | "support_triage"
  | "escalation_reasoning"
  | "client_deliverable";

// Maps orchestrator contexts to core-llm routing contexts
const CONTEXT_MAP: Record<OrchestratorModelContext, RoutingContext> = {
  classify_role:              "intake_classification",
  classify_intent:            "intake_classification",
  collect_intake:             "missing_field_detection",
  qualify_project:            "service_recommendation",
  recommend_product:          "service_recommendation",
  land_analysis_report:       "narrative_generation",
  concept_generation:         "complex_reasoning",
  estimate_summary:           "retrieval_summary",
  permit_narrative:           "permit_path_synthesis",
  contractor_match_summary:   "retrieval_summary",
  support_triage:             "intake_classification",
  escalation_reasoning:       "complex_reasoning",
  client_deliverable:         "narrative_generation",
};

// ─── Model decision ───────────────────────────────────────────────────────────

export interface ModelDecision {
  provider: string;
  reason: string;
  useInternalModel: boolean;
  usePremiumModel: boolean;
}

export function selectModelForContext(context: OrchestratorModelContext): ModelDecision {
  const routingCtx = CONTEXT_MAP[context];

  if (coreRouter) {
    try {
      const decision = coreRouter.decideRoute(routingCtx);
      return {
        provider: decision.selectedProvider,
        reason: decision.reason,
        useInternalModel: decision.selectedProvider === "internal",
        usePremiumModel: decision.selectedProvider === "claude" || decision.selectedProvider === "gpt",
      };
    } catch {
      // Fall through to default
    }
  }

  // Default routing (when core-llm is not available)
  const premiumContexts: OrchestratorModelContext[] = [
    "permit_narrative",
    "concept_generation",
    "land_analysis_report",
    "escalation_reasoning",
    "client_deliverable",
  ];

  const isPremium = premiumContexts.includes(context);
  return {
    provider: isPremium ? "claude" : "internal",
    reason: `Default routing: ${isPremium ? "premium context" : "routine context"}`,
    useInternalModel: !isPremium,
    usePremiumModel: isPremium,
  };
}

// ─── System prompts per context ───────────────────────────────────────────────

export const SYSTEM_PROMPTS: Record<OrchestratorModelContext, string> = {
  classify_role: `You are a Kealee intake classifier. Classify the user's role.
Valid roles: homeowner, land_owner, developer, contractor, architect, unknown.
Output ONLY a JSON object: {"role": "<role>", "confidence": 0.0-1.0, "reason": "..."}`,

  classify_intent: `You are a Kealee intent classifier.
Valid intents: start_project, land_analysis, get_concept, get_estimate, get_permit,
find_contractor, manage_construction, support_request, contractor_growth, developer_pipeline, browse, unknown.
Output ONLY a JSON object: {"intent": "<intent>", "confidence": 0.0-1.0, "reason": "..."}`,

  collect_intake: `You are a Kealee intake data collector.
Identify which required fields are missing from the user's project context.
Required fields: address, projectType, scopeSummary.
Output ONLY a JSON object: {"missingFields": ["..."], "hasEnoughToClassify": true/false}`,

  qualify_project: `You are a Kealee project qualification agent.
Analyze the project context and determine complexity score (0-100) and DCS score (0-100).
complexity_score: 0=simple cosmetic, 100=major structural/multifamily
dcs_score (Design Complexity Score): 0=simple, 100=custom architecture required
Also determine if architect is required and if permit is likely required.
Output ONLY a JSON object: {"complexityScore": 0-100, "dcsScore": 0-100, "architectRequired": bool, "permitRequired": bool, "reason": "..."}`,

  recommend_product: `You are a Kealee product recommendation agent.
Based on the project state, confirm or adjust the recommended next product.
You are NOT allowed to show the full catalog. Show only the single best next product.
Output ONLY a JSON object matching the ProductRecommendation interface.`,

  land_analysis_report: `You are a Kealee land feasibility analyst.
Generate a clear, factual land analysis report based on the parcel data, zoning, and buildability assessment.
Be honest about limitations. Flag risks clearly. Do not overstate buildability.
Recommend the next step (always a Kealee product).`,

  concept_generation: `You are a Kealee design brief generator.
Based on the project context, generate a structured design brief.
IMPORTANT: AI concept packages are design intent visualizations only.
They are NOT permit-ready stamped construction documents.
Always include this disclaimer in client-facing output.`,

  estimate_summary: `You are a Kealee cost estimate summarizer.
Synthesize the cost data into a clear executive summary.
Show cost by trade category. Include contingency recommendation (10-15%).
Do not overstate precision — this is an estimate, not a certified cost report.`,

  permit_narrative: `You are a Kealee permit pathway specialist.
Describe the permit path for this project in clear language.
Include: permit type, jurisdiction, estimated timeline, key risks.
IMPORTANT: Permit services represent actual permit execution — research, forms, submission, tracking.
They are not vague research reports.`,

  contractor_match_summary: `You are a Kealee contractor match summarizer.
Summarize why each matched contractor is a good fit for this project.
Include: relevant experience, proximity, rating, estimated availability.`,

  support_triage: `You are a Kealee support triage agent.
Classify the support request and determine if it can be resolved in chat or needs a ticket.
If the user is missing project setup data, redirect them to the intake flow.`,

  escalation_reasoning: `You are a Kealee escalation decision agent.
Determine whether this situation requires human review or professional handoff.
Be conservative — escalate when in doubt. Provide clear reason.`,

  client_deliverable: `You are a Kealee client communication specialist.
Write clear, professional client-facing content.
Be specific about what was delivered, what happens next, and any required actions.`,
};
