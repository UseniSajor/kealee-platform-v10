/**
 * Strict JSON output contract for all OrgBot decisions.
 * Every OrgBot must return a StructuredDecision — no exceptions.
 */

export type ConfidenceLevel = number; // 0.0–1.0

export type DecisionOutcome =
  | "APPROVE"
  | "REJECT"
  | "ESCALATE"
  | "DEFER"
  | "CONDITIONAL_APPROVE";

export interface OrgBotRisk {
  category: string;    // financial | schedule | regulatory | market | operational
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  mitigation: string;
}

export interface OrgBotAction {
  type: string;        // notify | create_task | update_budget | trigger_bot | block
  target: string;      // who/what to act on
  payload: Record<string, unknown>;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface StructuredDecision {
  decision: DecisionOutcome;
  confidence: ConfidenceLevel;
  data: Record<string, unknown>;       // domain-specific findings
  reasoning: string;                   // 1–3 sentences explaining the decision
  actions: OrgBotAction[];             // downstream actions to trigger
  risks: OrgBotRisk[];                 // identified risks with mitigations
  next_steps: string[];                // ordered list of recommended next steps
}

export interface OrgBotRequest {
  projectId: string;
  sessionId?: string;
  context: Record<string, unknown>;    // project data, estimates, permits, etc.
  triggeredBy: string;                 // which bot/event triggered this
  urgency: "routine" | "urgent" | "critical";
}

export interface OrgBotResponse {
  botName: string;
  projectId: string;
  decision: StructuredDecision;
  latencyMs: number;
  modelTokensUsed?: number;
  error?: string;
}

/**
 * Validate that a raw JSON object conforms to StructuredDecision.
 * Throws if required fields are missing.
 */
export function validateDecision(raw: unknown): StructuredDecision {
  if (!raw || typeof raw !== "object") {
    throw new Error("OrgBot response is not an object");
  }
  const d = raw as Record<string, unknown>;

  const requiredFields: (keyof StructuredDecision)[] = [
    "decision", "confidence", "data", "reasoning", "actions", "risks", "next_steps",
  ];

  for (const field of requiredFields) {
    if (d[field] === undefined) {
      throw new Error(`OrgBot response missing required field: ${field}`);
    }
  }

  const validOutcomes: DecisionOutcome[] = [
    "APPROVE", "REJECT", "ESCALATE", "DEFER", "CONDITIONAL_APPROVE",
  ];
  if (!validOutcomes.includes(d.decision as DecisionOutcome)) {
    throw new Error(`Invalid decision outcome: ${d.decision}`);
  }

  const confidence = Number(d.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(`Invalid confidence value: ${d.confidence}`);
  }

  return d as unknown as StructuredDecision;
}
