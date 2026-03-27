/**
 * DecisionEngine
 *
 * The canonical decision-making orchestrator for KeaCore.
 * Combines confidence, risk, and authority assessments into a
 * single NormalizedDecision with one of four outcomes:
 *
 *   AUTO_EXECUTE     — proceed immediately
 *   REQUIRE_APPROVAL — pause for operator approval gate
 *   ESCALATE         — hand off to a specialist / admin
 *   BLOCK            — hard stop, do not proceed
 *
 * Decision matrix:
 *   ┌──────────────────────┬──────────────────────────────────────────────┐
 *   │ Condition            │ Outcome                                      │
 *   ├──────────────────────┼──────────────────────────────────────────────┤
 *   │ Blocking risk flag   │ BLOCK                                        │
 *   │ Confidence → block   │ BLOCK (if critical risk) / ESCALATE (else)   │
 *   │ CRITICAL risk        │ ESCALATE                                     │
 *   │ Authority insuff.    │ REQUIRE_APPROVAL                             │
 *   │ HIGH risk            │ REQUIRE_APPROVAL                             │
 *   │ MEDIUM risk + warn   │ REQUIRE_APPROVAL                             │
 *   │ All others           │ AUTO_EXECUTE                                 │
 *   └──────────────────────┴──────────────────────────────────────────────┘
 */

import { customAlphabet } from "nanoid";

import { ConfidenceEngine, computeConfidenceScore, explainConfidence } from "./confidence-engine";
import { RiskEngine, computeRiskScore, explainRisk } from "./risk-engine";
import { AuthorityEngine, canAutoExecute, determineApprovalGate } from "./authority-engine";
import { aiActionLog } from "./action-log";
import { DECISION_THRESHOLDS, WORKFLOW_OVERRIDES } from "./orchestration-config";
import type {
  NormalizedDecision,
  OrchestrationContext,
  DecisionOutcome,
  ReasonCode,
  WorkflowOrchestrationContext,
  WorkflowOrchestrationResult,
} from "./types";

const alpha = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
const createId = (prefix: string) => `${prefix}_${alpha()}`;

// ─── Engine ───────────────────────────────────────────────────────────────────

export class DecisionEngine {
  private confidence: ConfidenceEngine;
  private risk: RiskEngine;
  private authority: AuthorityEngine;

  constructor() {
    this.confidence = new ConfidenceEngine();
    this.risk = new RiskEngine();
    this.authority = new AuthorityEngine();
  }

  /**
   * Evaluate the orchestration context and return a NormalizedDecision.
   * Every call is recorded in the AI action log.
   */
  decide(context: OrchestrationContext): NormalizedDecision {
    const confidenceProfile = this.confidence.assess(context);
    const riskProfile = this.risk.assess(context);
    const authorityProfile = this.authority.resolve(context, riskProfile);

    const warnings: string[] = [
      ...riskProfile.mitigations,
      ...(confidenceProfile.recommendation === "warn"
        ? [`Low confidence on dimension '${confidenceProfile.weakestDimension}' (${(confidenceProfile.overall * 100).toFixed(0)}%)`]
        : []),
    ];

    const { outcome, reasoning, approvalGateId, escalationReason, blockReason } =
      this.computeOutcome(context, confidenceProfile, riskProfile, authorityProfile);

    const decision: NormalizedDecision = {
      decisionId: createId("dec"),
      outcome,
      riskLevel: riskProfile.level,
      requiredAuthority: authorityProfile.requiredLevel,
      confidence: confidenceProfile,
      risk: riskProfile,
      authority: authorityProfile,
      reasoning,
      warnings,
      approvalGateId,
      escalationReason,
      blockReason,
      decidedAt: new Date().toISOString(),
    };

    // Always record in action log
    aiActionLog.record({
      sessionId: context.sessionId,
      taskId: context.taskId,
      projectId: context.projectId,
      actionType: context.action,
      actionTarget: context.actionTarget,
      outcome,
      riskLevel: riskProfile.level,
      confidence: confidenceProfile.overall,
      reasoning,
      warnings,
      engineResults: {
        confidenceScore: confidenceProfile.overall,
        riskScore: riskProfile.score,
        authorityRequired: authorityProfile.requiredLevel,
        authorityHeld: authorityProfile.currentLevel,
      },
    });

    return decision;
  }

  // ─── Decision matrix ───────────────────────────────────────────────────────

  private computeOutcome(
    context: OrchestrationContext,
    confidenceProfile: ReturnType<ConfidenceEngine["assess"]>,
    riskProfile: ReturnType<RiskEngine["assess"]>,
    authorityProfile: ReturnType<AuthorityEngine["resolve"]>,
  ): {
    outcome: DecisionOutcome;
    reasoning: string;
    approvalGateId?: string;
    escalationReason?: string;
    blockReason?: string;
  } {
    // ── 1. Hard block: absolute blocking flags ─────────────────────────────
    if (riskProfile.blockingFlags.length > 0) {
      return {
        outcome: "BLOCK",
        reasoning: `Hard block: blocking risk flags detected — ${riskProfile.blockingFlags.join(", ")}.`,
        blockReason: `Blocking flags present: ${riskProfile.blockingFlags.join(", ")}`,
      };
    }

    // ── 2. Confidence-driven block ─────────────────────────────────────────
    if (confidenceProfile.recommendation === "block") {
      if (riskProfile.level === "CRITICAL" || riskProfile.level === "HIGH") {
        return {
          outcome: "BLOCK",
          reasoning:
            `Confidence too low (${(confidenceProfile.overall * 100).toFixed(0)}%) and risk is ${riskProfile.level}. ` +
            `Weakest dimension: ${confidenceProfile.weakestDimension}.`,
          blockReason: `Insufficient confidence for ${riskProfile.level} risk action.`,
        };
      }
      return {
        outcome: "ESCALATE",
        reasoning:
          `Confidence too low (${(confidenceProfile.overall * 100).toFixed(0)}%) to proceed autonomously. ` +
          `Escalating for human review. Weakest dimension: ${confidenceProfile.weakestDimension}.`,
        escalationReason: `Confidence score ${(confidenceProfile.overall * 100).toFixed(0)}% below safe threshold for autonomous execution.`,
      };
    }

    // ── 3. Critical risk → escalate ────────────────────────────────────────
    if (riskProfile.level === "CRITICAL") {
      return {
        outcome: "ESCALATE",
        reasoning:
          `CRITICAL risk level for action '${context.action}'. ` +
          `Risk score: ${(riskProfile.score * 100).toFixed(0)}%. Flags: ${riskProfile.flags.slice(0, 3).join(", ")}.`,
        escalationReason: `Critical risk threshold exceeded for '${context.action}'.`,
      };
    }

    // ── 4. Authority insufficient → require approval ───────────────────────
    if (!authorityProfile.sufficient) {
      const gateId = createId("gate");
      return {
        outcome: "REQUIRE_APPROVAL",
        reasoning:
          `Action '${context.action}' requires ${authorityProfile.requiredLevel} authority ` +
          `but session holds ${authorityProfile.currentLevel}. Pausing for operator review.`,
        approvalGateId: gateId,
      };
    }

    // ── 5. High risk → require approval ───────────────────────────────────
    if (riskProfile.level === "HIGH") {
      const gateId = createId("gate");
      return {
        outcome: "REQUIRE_APPROVAL",
        reasoning:
          `HIGH risk action '${context.action}' requires operator confirmation. ` +
          `Risk score: ${(riskProfile.score * 100).toFixed(0)}%.`,
        approvalGateId: gateId,
      };
    }

    // ── 6. Medium risk + low confidence warning → require approval ─────────
    if (riskProfile.level === "MEDIUM" && confidenceProfile.recommendation === "warn") {
      const gateId = createId("gate");
      return {
        outcome: "REQUIRE_APPROVAL",
        reasoning:
          `MEDIUM risk combined with low confidence (${(confidenceProfile.overall * 100).toFixed(0)}%) — ` +
          `requesting operator confirmation before proceeding with '${context.action}'.`,
        approvalGateId: gateId,
      };
    }

    // ── 7. Auto-execute ────────────────────────────────────────────────────
    return {
      outcome: "AUTO_EXECUTE",
      reasoning:
        `All checks passed for action '${context.action}'. ` +
        `Risk: ${riskProfile.level}, Confidence: ${(confidenceProfile.overall * 100).toFixed(0)}%, ` +
        `Authority: ${authorityProfile.currentLevel} ≥ ${authorityProfile.requiredLevel}.`,
    };
  }
}

/** Singleton instance */
export const decisionEngine = new DecisionEngine();

// ─── Platform-facing function ─────────────────────────────────────────────────

/**
 * Primary platform API: evaluate a workflow context and return a full
 * orchestration result with confidence, risk, decision, and reason codes.
 *
 * This is the main entry point for cross-module workflow governance.
 *
 * Baseline logic (from config):
 * - confidence >= 0.85 AND risk <= 0.30 AND authority allows → AUTO_EXECUTE
 * - confidence < 0.60 OR risk > 0.60                         → ESCALATE
 * - otherwise                                                 → REQUIRE_APPROVAL
 */
export function decideOrchestration(
  ctx: WorkflowOrchestrationContext,
): WorkflowOrchestrationResult {
  const confidenceScore = computeConfidenceScore(ctx);
  const riskScore = computeRiskScore(ctx);
  const reasonCodes: ReasonCode[] = [];

  // Collect reason codes
  const { factors: confidenceFactors } = explainConfidence(ctx);
  const { factors: riskFactors } = explainRisk(ctx);

  if (ctx.captureQualityScore !== undefined && ctx.captureQualityScore < 0.50) {
    reasonCodes.push("LOW_CAPTURE_QUALITY");
  }
  if (ctx.permitComplexity === "HIGH") {
    reasonCodes.push("HIGH_PERMIT_COMPLEXITY");
  }
  if (ctx.requiresArchitect) {
    reasonCodes.push("ARCHITECT_REQUIRED");
  }
  if (ctx.budgetEstimate && ctx.budgetEstimate > 500_000) {
    reasonCodes.push("HIGH_BUDGET");
  }
  if (ctx.systemsImpacted && ctx.systemsImpacted.length > 0) {
    reasonCodes.push("SYSTEMS_IMPACTED");
  }
  const dcs = ctx.dcsScore ?? ctx.dataCompletenessScore;
  if (dcs !== undefined && dcs < 0.60) {
    reasonCodes.push("LOW_DATA_COMPLETENESS");
  }
  if (ctx.workflowType === "PAYMENT_RECOMMENDATION") {
    reasonCodes.push("PAYMENT_AUTHORITY_REQUIRED");
  }
  if (ctx.workflowType === "CHANGE_ORDER") {
    reasonCodes.push("CHANGE_ORDER_GATE");
  }
  if (ctx.requiresArchitect && ctx.systemsImpacted?.includes("structural")) {
    reasonCodes.push("STRUCTURAL_REVIEW_REQUIRED");
  }

  // Resolve thresholds (workflow-specific overrides if present)
  const overrides = WORKFLOW_OVERRIDES[ctx.workflowType] ?? {};
  const confAutoThreshold = overrides.confidenceAutoExecute ?? DECISION_THRESHOLDS.confidenceAutoExecute;
  const riskAutoThreshold = overrides.riskAutoExecute ?? DECISION_THRESHOLDS.riskAutoExecute;

  // Determine decision
  let decision: DecisionOutcome;
  let nextAction: string | undefined;

  const autoExecuteAllowed = canAutoExecute(ctx, confidenceScore, riskScore);

  if (autoExecuteAllowed && confidenceScore >= confAutoThreshold && riskScore <= riskAutoThreshold) {
    decision = "AUTO_EXECUTE";
    reasonCodes.push("AUTO_EXECUTE_APPROVED");
    reasonCodes.push("CONFIDENCE_MEETS_THRESHOLD");
    reasonCodes.push("RISK_WITHIN_TOLERANCE");
    nextAction = resolveNextAction(ctx, "AUTO_EXECUTE");
  } else if (confidenceScore < DECISION_THRESHOLDS.confidenceEscalate || riskScore > DECISION_THRESHOLDS.riskEscalate) {
    decision = "ESCALATE";
    reasonCodes.push("LOW_CONFIDENCE_SCORE");
    if (riskScore > DECISION_THRESHOLDS.riskEscalate) reasonCodes.push("HIGH_RISK_SCORE");
    nextAction = "escalate_to_human_review";
  } else {
    decision = "REQUIRE_APPROVAL";
    nextAction = resolveNextAction(ctx, "REQUIRE_APPROVAL");
  }

  const requiredApprovalGate = determineApprovalGate(ctx, decision, riskScore);

  // Log to action log
  const sessionId = ctx.projectId; // best available identifier for workflow context
  aiActionLog.record({
    sessionId,
    projectId: ctx.projectId,
    actionType: "tool_execution", // generic for workflow decisions
    actionTarget: ctx.workflowType,
    outcome: decision,
    riskLevel: riskScore >= 0.75 ? "CRITICAL" : riskScore >= 0.50 ? "HIGH" : riskScore >= 0.25 ? "MEDIUM" : "LOW",
    confidence: confidenceScore,
    reasoning: [
      ...confidenceFactors.slice(0, 2),
      ...riskFactors.slice(0, 2),
    ].join("; "),
    warnings: [],
    engineResults: {
      confidenceScore,
      riskScore,
    },
    metadata: {
      workflowType: ctx.workflowType,
      reasonCodes,
    },
  });

  return {
    decision,
    confidenceScore: Math.round(confidenceScore * 1000) / 1000,
    riskScore: Math.round(riskScore * 1000) / 1000,
    reasonCodes: [...new Set(reasonCodes)], // deduplicate
    requiredApprovalGate,
    nextAction,
    metadata: {
      confidenceFactors,
      riskFactors,
      thresholdsUsed: {
        confidenceAutoExecute: confAutoThreshold,
        riskAutoExecute: riskAutoThreshold,
      },
    },
  };
}

// ─── Next action resolver ─────────────────────────────────────────────────────

function resolveNextAction(ctx: WorkflowOrchestrationContext, decision: DecisionOutcome): string {
  if (decision === "AUTO_EXECUTE") {
    const autoActions: Partial<Record<string, string>> = {
      CAPTURE_ANALYSIS:        "dispatch_capture_analysis_job",
      PRE_DESIGN:              "dispatch_pre_design_generation",
      ESTIMATE:                "dispatch_estimate_generation",
      PERMIT_PREP:             "generate_permit_checklist",
      CONTRACTOR_MATCH:        "dispatch_contractor_ranking",
      PM_AUTOMATION:           "dispatch_milestone_creation",
      PAYMENT_RECOMMENDATION:  "generate_payment_recommendation",
      CHANGE_ORDER:            "create_change_order_draft",
    };
    return autoActions[ctx.workflowType] ?? "dispatch_workflow_step";
  }
  return "create_approval_gate";
}
