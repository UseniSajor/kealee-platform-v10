/**
 * @kealee/core/orchestration
 *
 * Canonical orchestration engine for KeaCore.
 * Re-exports all public types, engines, and platform-facing functions.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  // Decision
  DecisionOutcome,
  RiskLevel,
  AuthorityLevel,
  ProjectPhase,
  ActionType,
  WorkflowType,
  ApprovalGateType,
  ReasonCode,

  // Contexts
  OrchestrationContext,
  WorkflowOrchestrationContext,

  // Results
  ConfidenceProfile,
  RiskProfile,
  AuthorityProfile,
  NormalizedDecision,
  OrchestrationResult,
  WorkflowOrchestrationResult,

  // Phase governance
  PhaseGateResult,
  PhaseGateChecklistItem,

  // Audit
  AiActionRecord,
} from "./types";

// ─── Config ───────────────────────────────────────────────────────────────────
export {
  DECISION_THRESHOLDS,
  CONFIDENCE_THRESHOLDS,
  RISK_THRESHOLDS,
  PAYMENT_THRESHOLDS,
  WORKFLOW_OVERRIDES,
  PROJECT_TYPE_RISK_MULTIPLIER,
  PERMIT_COMPLEXITY_RISK,
  SYSTEM_IMPACT_RISK,
  CAPTURE_QUALITY,
  DCS_THRESHOLDS,
} from "./orchestration-config";

// ─── Confidence engine ────────────────────────────────────────────────────────
export { ConfidenceEngine, computeConfidenceScore, explainConfidence } from "./confidence-engine";

// ─── Risk engine ──────────────────────────────────────────────────────────────
export { RiskEngine, computeRiskScore, explainRisk } from "./risk-engine";

// ─── Authority engine ─────────────────────────────────────────────────────────
export { AuthorityEngine, determineApprovalGate, canAutoExecute } from "./authority-engine";

// ─── Decision engine ──────────────────────────────────────────────────────────
export { DecisionEngine, decisionEngine, decideOrchestration } from "./decision-engine";

// ─── Workflow governor ────────────────────────────────────────────────────────
export {
  WorkflowGovernor,
  workflowGovernor,
  evaluateAndAdvance,
  maybeDispatchNextStep,
  createApprovalGateIfNeeded,
  createEscalationIfNeeded,
} from "./workflow-governor";

// ─── Action log ───────────────────────────────────────────────────────────────
export { AiActionLog, aiActionLog } from "./action-log";
