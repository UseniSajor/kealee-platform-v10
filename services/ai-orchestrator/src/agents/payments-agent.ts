/**
 * services/ai-orchestrator/src/agents/payments-agent.ts
 *
 * Kealee Payments Agent
 *
 * Controls milestone-based payment validation and release decisions.
 * Called from the construction subgraph at payout readiness check.
 *
 * Rules:
 * - NEVER releases payment without full validation
 * - NEVER assumes milestone completion — evidence must be verified
 * - All conditions must be satisfied before payout recommendation
 * - Provides structured decision with explicit reasoning
 */

import { ClaudeProvider } from "@kealee/core-llm";
import type { KealeeState } from "../state/kealee-state.js";

// ─── System prompt ────────────────────────────────────────────────────────────

const PAYMENTS_AGENT_SYSTEM_PROMPT = `You are Kealee Payments Agent.

You control milestone-based payment decisions.

You must:
- verify milestone completion based on evidence provided
- verify that all required evidence documents are present
- ensure all milestone dependencies are met before recommending payout
- explain your decision with explicit reasoning for each condition

You must NOT:
- release payment without complete validation
- assume milestone completion without evidence
- recommend payout if any HIGH severity condition is unmet

Payments must only be recommended when ALL of the following are satisfied:
1. Milestone status is APPROVED by owner or inspector
2. Required evidence documents are submitted and described
3. No outstanding sub-milestone dependencies
4. Contractor ConnectedAccount is payout-enabled
5. No active disputes or holds on the project

Output format must be structured JSON matching this exact schema:
{
  "decision": "APPROVE" | "HOLD" | "REJECT",
  "decisionReason": "clear explanation of the decision",
  "milestoneId": "string",
  "milestoneTitle": "string",
  "conditionsEvaluated": [
    {
      "condition": "string — what was checked",
      "status": "PASSED" | "FAILED" | "WARNING" | "UNKNOWN",
      "detail": "specific finding for this condition"
    }
  ],
  "evidenceAssessment": {
    "evidenceCount": number,
    "evidenceTypes": ["photo", "inspection_report", "invoice", "lien_waiver", etc.],
    "adequacy": "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT",
    "missingEvidence": ["list of missing evidence items if any"]
  },
  "riskFlags": [
    {
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "flag": "string",
      "recommendation": "string"
    }
  ],
  "payoutAmount": number | null,
  "payoutCurrency": "USD",
  "holdReasons": ["list of reasons if decision is HOLD or REJECT"],
  "requiredActions": [
    {
      "action": "string",
      "owner": "OWNER" | "CONTRACTOR" | "KEALEE" | "INSPECTOR",
      "urgency": "IMMEDIATE" | "WITHIN_24H" | "WITHIN_WEEK"
    }
  ],
  "lienWaiverRequired": true | false,
  "lienWaiverType": "conditional" | "unconditional" | null,
  "approvedBy": null,
  "notes": "any additional notes for the Kealee payments team"
}`;

// ─── Input builder ────────────────────────────────────────────────────────────

function buildPaymentsAgentPrompt(state: KealeeState): string {
  const paymentContext = (state as Record<string, unknown> & {
    milestoneContext?: {
      milestoneId?: string;
      milestoneTitle?: string;
      milestoneAmount?: number;
      milestoneStatus?: string;
      evidenceCount?: number;
      evidenceTypes?: string[];
      contractorPayoutsEnabled?: boolean;
      hasDisputes?: boolean;
      dependencies?: string[];
    };
  }).milestoneContext ?? {};

  return `Evaluate this milestone payout request.

PROJECT CONTEXT:
Project ID: ${state.projectId ?? "NOT PROVIDED"}
Address: ${state.address ?? "NOT PROVIDED"}
Project type: ${state.projectType ?? "NOT PROVIDED"}

MILESTONE DETAILS:
Milestone ID: ${paymentContext.milestoneId ?? "NOT PROVIDED"}
Milestone title: ${paymentContext.milestoneTitle ?? "NOT PROVIDED"}
Requested payout amount: ${paymentContext.milestoneAmount ? `$${paymentContext.milestoneAmount.toLocaleString()}` : "NOT PROVIDED"}
Milestone status: ${paymentContext.milestoneStatus ?? "UNKNOWN"}

EVIDENCE:
Evidence items submitted: ${paymentContext.evidenceCount ?? 0}
Evidence types: ${(paymentContext.evidenceTypes ?? []).join(", ") || "NONE"}

CONTRACTOR STATUS:
Contractor payout-enabled: ${paymentContext.contractorPayoutsEnabled ? "YES" : "NO"}

DEPENDENCIES:
Outstanding dependencies: ${(paymentContext.dependencies ?? []).length > 0 ? (paymentContext.dependencies ?? []).join(", ") : "NONE"}

DISPUTES / HOLDS:
Active disputes or holds: ${paymentContext.hasDisputes ? "YES" : "NO"}

READINESS FLAGS:
Payout ready flag: ${state.readiness.payoutReady ? "YES" : "NO"}

INSTRUCTIONS:
- Evaluate each condition explicitly (milestone status, evidence, dependencies, contractor account, disputes)
- decision APPROVE: only when all 5 conditions pass
- decision HOLD: when conditions are not yet met but fixable
- decision REJECT: when there is a fundamental blocker (dispute, status=REJECTED, contractor account disabled)
- Evidence adequacy: SUFFICIENT = 3+ items including at least one photo or inspection report
- Always determine lien waiver requirement (conditional if payment not yet made, unconditional if project complete)
- Output ONLY the JSON object, no preamble`;
}

// ─── Agent runner ─────────────────────────────────────────────────────────────

export interface PaymentsAgentResult {
  success: boolean;
  report: PaymentDecisionReport | null;
  rawText: string;
  error?: string;
  decision: "APPROVE" | "HOLD" | "REJECT" | "UNKNOWN";
}

export interface PaymentDecisionReport {
  decision: "APPROVE" | "HOLD" | "REJECT";
  decisionReason: string;
  milestoneId: string;
  milestoneTitle: string;
  conditionsEvaluated: Array<{
    condition: string;
    status: "PASSED" | "FAILED" | "WARNING" | "UNKNOWN";
    detail: string;
  }>;
  evidenceAssessment: {
    evidenceCount: number;
    evidenceTypes: string[];
    adequacy: "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT";
    missingEvidence: string[];
  };
  riskFlags: Array<{
    severity: "HIGH" | "MEDIUM" | "LOW";
    flag: string;
    recommendation: string;
  }>;
  payoutAmount: number | null;
  payoutCurrency: string;
  holdReasons: string[];
  requiredActions: Array<{
    action: string;
    owner: "OWNER" | "CONTRACTOR" | "KEALEE" | "INSPECTOR";
    urgency: "IMMEDIATE" | "WITHIN_24H" | "WITHIN_WEEK";
  }>;
  lienWaiverRequired: boolean;
  lienWaiverType: "conditional" | "unconditional" | null;
  approvedBy: null;
  notes: string;
}

const claude = new ClaudeProvider("claude-sonnet-4-6");

export async function runPaymentsAgent(
  state: KealeeState,
): Promise<PaymentsAgentResult> {
  if (!claude.isAvailable()) {
    const report = buildFallbackPaymentDecision(state);
    return {
      success:  true,
      report,
      rawText:  JSON.stringify(report),
      decision: report.decision,
    };
  }

  const prompt = buildPaymentsAgentPrompt(state);

  try {
    const result = await claude.generateText({
      systemPrompt: PAYMENTS_AGENT_SYSTEM_PROMPT,
      prompt,
      maxTokens:    2000,
      temperature:  0.1,  // very low temperature — payment decisions must be deterministic
      projectId:    state.projectId,
      taskId:       `payment_decision_${state.threadId}`,
    });

    const report = parseAgentOutput<PaymentDecisionReport>(result.text);

    if (!report) {
      const fallback = buildFallbackPaymentDecision(state);
      return {
        success:  false,
        report:   fallback,
        rawText:  result.text,
        error:    "Failed to parse payments agent output — fallback HOLD issued",
        decision: "HOLD",
      };
    }

    // Safety rule: if readiness.payoutReady is false, never approve
    if (!state.readiness.payoutReady && report.decision === "APPROVE") {
      report.decision = "HOLD";
      report.decisionReason = "Payout readiness flag is not set. " + report.decisionReason;
      report.holdReasons = [
        "System readiness flag not set — requires ops review before release.",
        ...(report.holdReasons ?? []),
      ];
    }

    return {
      success:  true,
      report,
      rawText:  result.text,
      decision: report.decision,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const fallback = buildFallbackPaymentDecision(state);
    return {
      success:  false,
      report:   fallback,
      rawText:  "",
      error:    `Payments agent call failed: ${msg}`,
      decision: "HOLD",
    };
  }
}

// ─── Fallback decision ────────────────────────────────────────────────────────

function buildFallbackPaymentDecision(state: KealeeState): PaymentDecisionReport {
  return {
    decision:       "HOLD",
    decisionReason: "Automated validation unavailable. Manual review required before any payout is released.",
    milestoneId:    "unknown",
    milestoneTitle: "Pending confirmation",
    conditionsEvaluated: [
      { condition: "Automated validation system", status: "UNKNOWN", detail: "Payment agent unavailable — defaulting to HOLD." },
    ],
    evidenceAssessment: {
      evidenceCount:   0,
      evidenceTypes:   [],
      adequacy:        "INSUFFICIENT",
      missingEvidence: ["Unable to assess — manual review required"],
    },
    riskFlags: [
      { severity: "HIGH", flag: "Automated validation unavailable", recommendation: "Kealee ops team must manually review before release." },
    ],
    payoutAmount:       null,
    payoutCurrency:     "USD",
    holdReasons:        ["Payment agent unavailable — manual ops review required"],
    requiredActions: [
      { action: "Kealee ops team to manually review milestone evidence", owner: "KEALEE", urgency: "WITHIN_24H" },
    ],
    lienWaiverRequired: true,
    lienWaiverType:     "conditional",
    approvedBy:         null,
    notes:              "Fallback decision issued. No payment was released. Kealee ops team must review.",
  };
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

function parseAgentOutput<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {}
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
  } catch {}
  return null;
}
