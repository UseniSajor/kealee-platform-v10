/**
 * AuthorityEngine
 *
 * Determines whether the current session context has sufficient authority
 * to proceed with an action, given the risk level.
 *
 * Authority hierarchy:
 *   AGENT    — AI may proceed autonomously (low-risk, well-covered actions)
 *   OPERATOR — human operator approval required (command-center review)
 *   ADMIN    — platform admin must approve (high-stakes financial / legal)
 */

import type {
  ActionType,
  ApprovalGateType,
  AuthorityLevel,
  AuthorityProfile,
  DecisionOutcome,
  OrchestrationContext,
  RiskLevel,
  RiskProfile,
  WorkflowOrchestrationContext,
  WorkflowType,
} from "./types";
import { DECISION_THRESHOLDS, PAYMENT_THRESHOLDS, WORKFLOW_OVERRIDES } from "./orchestration-config";

// ─── Authority requirement table ──────────────────────────────────────────────
// Specifies minimum required authority for each action × risk combination.

type AuthorityMatrix = {
  [action in ActionType]?: {
    LOW: AuthorityLevel;
    MEDIUM: AuthorityLevel;
    HIGH: AuthorityLevel;
    CRITICAL: AuthorityLevel;
  };
};

const ACTION_AUTHORITY_MATRIX: AuthorityMatrix = {
  intake_analysis:    { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "OPERATOR", CRITICAL: "OPERATOR" },
  create_project:     { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "OPERATOR", CRITICAL: "OPERATOR" },
  run_feasibility:    { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "OPERATOR", CRITICAL: "ADMIN"    },
  generate_concept:   { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "OPERATOR", CRITICAL: "OPERATOR" },
  create_estimate:    { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "OPERATOR", CRITICAL: "ADMIN"    },
  create_checkout:    { LOW: "AGENT",    MEDIUM: "OPERATOR", HIGH: "OPERATOR", CRITICAL: "ADMIN"    },
  submit_permit:      { LOW: "OPERATOR", MEDIUM: "OPERATOR", HIGH: "ADMIN",    CRITICAL: "ADMIN"    },
  approve_bid:        { LOW: "OPERATOR", MEDIUM: "OPERATOR", HIGH: "ADMIN",    CRITICAL: "ADMIN"    },
  release_payment:    { LOW: "OPERATOR", MEDIUM: "ADMIN",    HIGH: "ADMIN",    CRITICAL: "ADMIN"    },
  phase_transition:   { LOW: "AGENT",    MEDIUM: "OPERATOR", HIGH: "OPERATOR", CRITICAL: "ADMIN"    },
  escalate_to_human:  { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "AGENT",    CRITICAL: "AGENT"    },
  agent_delegation:   { LOW: "AGENT",    MEDIUM: "OPERATOR", HIGH: "OPERATOR", CRITICAL: "ADMIN"    },
  tool_execution:     { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "OPERATOR", CRITICAL: "OPERATOR" },
  capture_asset:      { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "AGENT",    CRITICAL: "OPERATOR" },
  send_notification:  { LOW: "AGENT",    MEDIUM: "AGENT",    HIGH: "OPERATOR", CRITICAL: "OPERATOR" },
  external_api_call:  { LOW: "AGENT",    MEDIUM: "OPERATOR", HIGH: "OPERATOR", CRITICAL: "ADMIN"    },
};

// Default for actions not in the matrix
const DEFAULT_AUTHORITY: Record<RiskLevel, AuthorityLevel> = {
  LOW: "AGENT",
  MEDIUM: "AGENT",
  HIGH: "OPERATOR",
  CRITICAL: "ADMIN",
};

// ─── Current authority from session mode ─────────────────────────────────────

function sessionModeToAuthority(mode: OrchestrationContext["mode"]): AuthorityLevel {
  switch (mode) {
    case "autonomous": return "AGENT";
    case "assisted":   return "OPERATOR"; // operator is present and reviewing
    case "operator":   return "OPERATOR";
    default:           return "AGENT";
  }
}

// ─── Engine ───────────────────────────────────────────────────────────────────

const AUTHORITY_RANK: Record<AuthorityLevel, number> = {
  AGENT: 0,
  OPERATOR: 1,
  ADMIN: 2,
};

export class AuthorityEngine {
  resolve(context: OrchestrationContext, risk: RiskProfile): AuthorityProfile {
    const requiredLevel = resolveRequired(context.action, risk.level);
    const currentLevel = resolveCurrentLevel(context);
    const sufficient = AUTHORITY_RANK[currentLevel] >= AUTHORITY_RANK[requiredLevel];

    const approvers = buildApprovers(requiredLevel, context);
    const reason = buildReason(context.action, risk.level, requiredLevel, sufficient);

    return { requiredLevel, currentLevel, sufficient, approvers, reason };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveRequired(action: ActionType, riskLevel: RiskLevel): AuthorityLevel {
  const row = ACTION_AUTHORITY_MATRIX[action];
  if (row) return row[riskLevel];
  return DEFAULT_AUTHORITY[riskLevel];
}

function resolveCurrentLevel(ctx: OrchestrationContext): AuthorityLevel {
  // Operator source portals always carry operator-level authority
  if (ctx.source === "command-center") return "OPERATOR";
  return sessionModeToAuthority(ctx.mode);
}

function buildApprovers(level: AuthorityLevel, _ctx: OrchestrationContext): string[] {
  switch (level) {
    case "AGENT":    return [];
    case "OPERATOR": return ["Platform Operator (command-center)"];
    case "ADMIN":    return ["Platform Admin", "Platform Operator (command-center)"];
    default:         return [];
  }
}

function buildReason(
  action: ActionType,
  riskLevel: RiskLevel,
  required: AuthorityLevel,
  sufficient: boolean,
): string {
  if (sufficient) {
    return `Action '${action}' at ${riskLevel} risk is within current authority.`;
  }
  return (
    `Action '${action}' at ${riskLevel} risk requires ${required} approval ` +
    `but the current session does not carry that authority.`
  );
}

// ─── Platform-facing functions ────────────────────────────────────────────────

/**
 * Workflow → approval gate type mapping.
 * Some workflows always require a gate regardless of risk score.
 */
const WORKFLOW_APPROVAL_GATE: Partial<Record<WorkflowType, ApprovalGateType>> = {
  PERMIT_PREP:            "PERMIT_SUBMISSION",
  PAYMENT_RECOMMENDATION: "PAYMENT_RELEASE",
  CHANGE_ORDER:           "CHANGE_ORDER_APPROVAL",
};

/**
 * Determine the required approval gate for a workflow decision, if any.
 * Returns undefined if no gate is needed (auto-execute is safe).
 */
export function determineApprovalGate(
  ctx: WorkflowOrchestrationContext,
  decision: DecisionOutcome,
  riskScore: number,
): ApprovalGateType | undefined {
  // CHANGE_ORDER always requires approval
  if (ctx.workflowType === "CHANGE_ORDER") return "CHANGE_ORDER_APPROVAL";

  // Auto-execute decisions don't need a gate
  if (decision === "AUTO_EXECUTE") return undefined;

  // Workflow-specific mandatory gates
  const workflowGate = WORKFLOW_APPROVAL_GATE[ctx.workflowType];
  if (workflowGate) return workflowGate;

  // Architect required
  if (ctx.requiresArchitect) return "ARCHITECT_VALIDATION";

  // High payment threshold
  const budget = ctx.budgetEstimate ?? 0;
  if (budget >= PAYMENT_THRESHOLDS.adminApprovalMin) return "PAYMENT_RELEASE";

  // High risk with financial or legal implications
  if (riskScore >= 0.60) return "DISPUTE_REVIEW";

  return undefined;
}

/**
 * Determine whether AI can auto-execute a workflow step without human approval.
 * Returns true only when confidence is high, risk is low, and no authority gate applies.
 */
export function canAutoExecute(
  ctx: WorkflowOrchestrationContext,
  confidenceScore: number,
  riskScore: number,
): boolean {
  // CHANGE_ORDER never auto-executes
  if (ctx.workflowType === "CHANGE_ORDER") return false;

  // Permit cannot auto-submit
  if (ctx.workflowType === "PERMIT_PREP") return false;

  // Payment above threshold never auto-executes
  if (
    ctx.workflowType === "PAYMENT_RECOMMENDATION" &&
    (ctx.budgetEstimate ?? 0) >= PAYMENT_THRESHOLDS.operatorApprovalMin
  ) return false;

  // Architect-required scope needs human validation
  if (ctx.requiresArchitect) return false;

  // Get workflow-specific or global thresholds
  const overrides = WORKFLOW_OVERRIDES[ctx.workflowType] ?? {};
  const confThreshold = overrides.confidenceAutoExecute ?? DECISION_THRESHOLDS.confidenceAutoExecute;
  const riskThreshold = overrides.riskAutoExecute ?? DECISION_THRESHOLDS.riskAutoExecute;

  return confidenceScore >= confThreshold && riskScore <= riskThreshold;
}
