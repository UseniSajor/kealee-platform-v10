/**
 * @kealee/core — Orchestration Engine Types
 *
 * All shared types for the KeaCore decision-making layer.
 * Every engine (confidence, risk, authority, decision, workflow-governor)
 * operates on OrchestrationContext and emits a typed result.
 */

// ─── Decision outcome ─────────────────────────────────────────────────────────

/**
 * The four possible outcomes from the decision engine.
 *
 * AUTO_EXECUTE     — all checks pass; proceed immediately
 * REQUIRE_APPROVAL — proceed only after a human operator approves
 * ESCALATE         — route to admin / specialist; AI cannot resolve alone
 * BLOCK            — hard stop; action must not proceed
 */
export type DecisionOutcome = "AUTO_EXECUTE" | "REQUIRE_APPROVAL" | "ESCALATE" | "BLOCK";

// ─── Risk ─────────────────────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ─── Authority ────────────────────────────────────────────────────────────────

/**
 * Hierarchy of authority required to approve an action.
 * AGENT    — AI agent can proceed autonomously
 * OPERATOR — human operator approval required (command-center)
 * ADMIN    — platform admin must approve (rare, high-stakes)
 */
export type AuthorityLevel = "AGENT" | "OPERATOR" | "ADMIN";

// ─── Project phases ───────────────────────────────────────────────────────────

/** Generic lifecycle phases (property development) */
export type ProjectPhase =
  | "discovery"
  | "feasibility"
  | "design"
  | "permitting"
  | "procurement"
  | "construction"
  | "closeout";

/**
 * Kealee PM project phases — matches the platform's project lifecycle.
 * Used by the PM phase governor for project-level gate checks.
 */
export type PmProjectPhase =
  | "PRE_DESIGN"
  | "ARCHITECT"
  | "PERMIT"
  | "PRE_CONSTRUCTION"
  | "CONSTRUCTION"
  | "CLOSEOUT";

// ─── Action types ─────────────────────────────────────────────────────────────

/**
 * Canonical action types the orchestrator can evaluate.
 * Used to determine authority requirements and risk category.
 */
export type ActionType =
  | "intake_analysis"
  | "create_project"
  | "run_feasibility"
  | "generate_concept"
  | "create_estimate"
  | "create_checkout"
  | "submit_permit"
  | "approve_bid"
  | "release_payment"
  | "phase_transition"
  | "escalate_to_human"
  | "agent_delegation"
  | "tool_execution"
  | "capture_asset"
  | "send_notification"
  | "external_api_call";

// ─── Workflow types ────────────────────────────────────────────────────────────

/**
 * High-level workflow categories that KeaCore governs.
 * Used in the platform-facing orchestration facade.
 */
export type WorkflowType =
  | "CAPTURE_ANALYSIS"
  | "PRE_DESIGN"
  | "ESTIMATE"
  | "PERMIT_PREP"
  | "CONTRACTOR_MATCH"
  | "PM_AUTOMATION"
  | "PAYMENT_RECOMMENDATION"
  | "CHANGE_ORDER";

// ─── Approval gate types ───────────────────────────────────────────────────────

export type ApprovalGateType =
  | "ARCHITECT_VALIDATION"
  | "PERMIT_SUBMISSION"
  | "PAYMENT_RELEASE"
  | "CHANGE_ORDER_APPROVAL"
  | "DISPUTE_REVIEW";

// ─── Reason codes ──────────────────────────────────────────────────────────────

export type ReasonCode =
  | "LOW_CAPTURE_QUALITY"
  | "HIGH_PERMIT_COMPLEXITY"
  | "ARCHITECT_REQUIRED"
  | "HIGH_BUDGET"
  | "SYSTEMS_IMPACTED"
  | "LOW_DATA_COMPLETENESS"
  | "PAYMENT_AUTHORITY_REQUIRED"
  | "HIGH_RISK_SCORE"
  | "LOW_CONFIDENCE_SCORE"
  | "CHANGE_ORDER_GATE"
  | "STRUCTURAL_REVIEW_REQUIRED"
  | "DISPUTE_REQUIRES_HUMAN"
  | "PERMIT_SUBMISSION_BLOCKED"
  | "AUTO_EXECUTE_APPROVED"
  | "CONFIDENCE_MEETS_THRESHOLD"
  | "RISK_WITHIN_TOLERANCE";

// ─── Platform-level orchestration context ────────────────────────────────────

/**
 * Workflow-level context for the platform-facing `decideOrchestration()` API.
 * Used when KeaCore evaluates cross-module workflow steps (pre-design, permits, etc.)
 */
export interface WorkflowOrchestrationContext {
  projectId: string;
  projectType?: string;
  phase?: string;
  workflowType: WorkflowType;

  // Confidence signals
  captureQualityScore?: number; // 0–1 from SmartScan / capture pipeline
  dcsScore?: number; // Data Completeness Score 0–1
  complexityScore?: number; // 0–1 from DDTS / project profile
  confidenceSignals?: Record<string, number>; // dimension → score
  dataCompletenessScore?: number; // 0–1
  userInputsComplete?: boolean;

  // Risk signals
  riskSignals?: Record<string, number>; // dimension → score
  systemsImpacted?: string[]; // e.g. ["structural", "hvac", "plumbing", "electrical"]
  permitComplexity?: "LOW" | "MEDIUM" | "HIGH";
  budgetEstimate?: number; // in USD
  requiresArchitect?: boolean;
}

/**
 * Platform-level orchestration result returned by `decideOrchestration()`.
 */
export interface WorkflowOrchestrationResult {
  decision: DecisionOutcome;
  confidenceScore: number;
  riskScore: number;
  reasonCodes: ReasonCode[];
  requiredApprovalGate?: ApprovalGateType;
  nextAction?: string;
  metadata?: Record<string, unknown>;
}

// ─── Session-level orchestration context ──────────────────────────────────────

/**
 * Everything the engines need to make a decision.
 * Assembled by the orchestration facade from the active session.
 */
export interface OrchestrationContext {
  // Identity
  sessionId: string;
  taskId?: string;
  projectId?: string;
  orgId?: string;
  userId?: string;

  // Session classification
  source: "web" | "portal-owner" | "portal-developer" | "command-center" | "api";
  mode: "autonomous" | "assisted" | "operator";

  // What is being decided
  action: ActionType;
  actionTarget?: string; // tool name, agent role, endpoint
  actionInput?: Record<string, unknown>;

  // Session memory snapshot
  riskFlags: string[];
  facts: Record<string, unknown>;
  normalizedIntent?: string;
  currentPhase?: ProjectPhase;

  // AI analysis results (from prior LLM step)
  aiConfidence?: number;
  aiProvider?: string;
  fallbackUsed?: boolean;

  // Execution context
  stepId?: string;
  planId?: string;
  retryCount?: number;

  // Budget context (for financial risk scoring)
  budgetMin?: number;
  budgetMax?: number;

  // Structural / regulatory flags
  requiresStructuralWork?: boolean;
  requiresPermit?: boolean;
  hoaReviewRequired?: boolean;
}

// ─── Confidence profile ───────────────────────────────────────────────────────

export interface ConfidenceProfile {
  overall: number; // 0–1
  dataCompleteness: number; // 0–1
  aiAnalysisScore: number; // 0–1 (from prior AI step or 0.5 default)
  intentClassification?: number; // 0–1
  jurisdictionCoverage?: number; // 0–1
  budgetClarity?: number; // 0–1
  retrievalSufficiency?: number; // 0–1
  /** The lowest-scoring dimension driving the overall score */
  weakestDimension: string;
  /** Recommended action based on confidence thresholds */
  recommendation: "proceed" | "warn" | "block";
}

// ─── Risk profile ─────────────────────────────────────────────────────────────

export interface RiskProfile {
  level: RiskLevel;
  score: number; // 0–1 composite
  flags: string[]; // all risk flags (non-blocking + blocking)
  categories: {
    financial: number; // 0–1
    structural: number; // 0–1
    regulatory: number; // 0–1
    dataQuality: number; // 0–1
    operational: number; // 0–1
  };
  mitigations: string[]; // suggested mitigations to surface to operator
  blockingFlags: string[]; // flags that force BLOCK outcome
}

// ─── Authority profile ────────────────────────────────────────────────────────

export interface AuthorityProfile {
  requiredLevel: AuthorityLevel;
  currentLevel: AuthorityLevel;
  sufficient: boolean;
  approvers: string[]; // display names / role labels
  reason: string;
}

// ─── Normalized decision ──────────────────────────────────────────────────────

export interface NormalizedDecision {
  decisionId: string;
  outcome: DecisionOutcome;
  riskLevel: RiskLevel;
  requiredAuthority: AuthorityLevel;

  // Sub-engine results
  confidence: ConfidenceProfile;
  risk: RiskProfile;
  authority: AuthorityProfile;

  // Human-readable summary
  reasoning: string;
  warnings: string[];

  // Outcome-specific metadata
  approvalGateId?: string; // set when outcome === REQUIRE_APPROVAL
  escalationReason?: string; // set when outcome === ESCALATE
  blockReason?: string; // set when outcome === BLOCK

  decidedAt: string;
}

// ─── Phase gate result ────────────────────────────────────────────────────────

export interface PhaseGateChecklistItem {
  item: string;
  completed: boolean;
  blocker: boolean;
}

export interface PhaseGateResult {
  allowed: boolean;
  fromPhase: ProjectPhase;
  toPhase: ProjectPhase;
  blockers: string[];
  warnings: string[];
  requiredApprovals: string[];
  checklist: PhaseGateChecklistItem[];
  decidedAt: string;
}

/** Phase gate result for Kealee PM-specific phase transitions */
export interface PmPhaseGateResult {
  allowed: boolean;
  fromPhase: PmProjectPhase;
  toPhase: PmProjectPhase;
  blockers: string[];
  warnings: string[];
  requiredApprovals: string[];
  checklist: PhaseGateChecklistItem[];
  decidedAt: string;
}

// ─── AI action log ────────────────────────────────────────────────────────────

export interface AiActionRecord {
  id: string;
  sessionId: string;
  taskId?: string;
  projectId?: string;
  actionType: ActionType;
  actionTarget?: string;
  outcome: DecisionOutcome;
  riskLevel: RiskLevel;
  confidence: number;
  reasoning: string;
  warnings: string[];
  engineResults?: {
    confidenceScore?: number;
    riskScore?: number;
    authorityRequired?: AuthorityLevel;
    authorityHeld?: AuthorityLevel;
  };
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

// ─── Orchestration facade result ──────────────────────────────────────────────

export interface OrchestrationResult {
  decision: NormalizedDecision;
  /** True if the caller should immediately present an approval gate UI */
  requiresGate: boolean;
  /** Gate ID to reference in the approval flow */
  gateId?: string;
  /** True if the caller should proceed to execute the action */
  shouldExecute: boolean;
  /** Human-readable summary for logging / operator display */
  summary: string;
}
