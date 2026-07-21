/**
 * @kealee/core — Workflow Integration Adapters
 *
 * Thin, typed wrappers that map domain-specific workflow data to
 * WorkflowOrchestrationContext and invoke decideOrchestration().
 *
 * Each adapter:
 *   1. Accepts workflow-specific parameters
 *   2. Builds the standardized WorkflowOrchestrationContext
 *   3. Calls decideOrchestration()
 *   4. Returns the full result plus a convenience `shouldProceed` boolean
 *
 * Usage in worker processors, bot handlers, or API modules:
 *
 *   import { orchestrateCaptureAnalysis } from "@kealee/core/integration";
 *   const result = orchestrateCaptureAnalysis({ projectId, captureQualityScore: 0.82 });
 *   if (!result.shouldProceed) { ... pause or escalate ... }
 */

import { decideOrchestration } from "../orchestration/decision-engine";
import type {
  WorkflowOrchestrationContext,
  WorkflowOrchestrationResult,
} from "../orchestration/types";

// ─── Shared adapter result ────────────────────────────────────────────────────

export interface AdapterResult extends WorkflowOrchestrationResult {
  /** True if the workflow should auto-proceed (AUTO_EXECUTE decision) */
  shouldProceed: boolean;
  /** True if the workflow is paused for human review */
  requiresGate: boolean;
  /** The full orchestration context that was evaluated */
  context: WorkflowOrchestrationContext;
}

function toAdapterResult(
  result: WorkflowOrchestrationResult,
  context: WorkflowOrchestrationContext,
): AdapterResult {
  return {
    ...result,
    shouldProceed: result.decision === "AUTO_EXECUTE",
    requiresGate: result.decision === "REQUIRE_APPROVAL",
    context,
  };
}

// ─── 1. Capture Analysis ──────────────────────────────────────────────────────

export interface CaptureAnalysisParams {
  projectId: string;
  captureQualityScore: number; // 0–1: SmartScan / asset quality rating
  assetCount?: number; // number of uploaded assets
  hasVoiceNotes?: boolean;
  dcsScore?: number; // data completeness score 0–1
  projectType?: string;
}

/**
 * Orchestrate a CAPTURE_ANALYSIS workflow step.
 * Called before running AI vision analysis on a capture session.
 */
export function orchestrateCaptureAnalysis(params: CaptureAnalysisParams): AdapterResult {
  const context: WorkflowOrchestrationContext = {
    projectId: params.projectId,
    projectType: params.projectType,
    workflowType: "CAPTURE_ANALYSIS",
    captureQualityScore: params.captureQualityScore,
    dcsScore: params.dcsScore,
    confidenceSignals: {
      ...(params.assetCount !== undefined && { asset_count: Math.min(params.assetCount / 10, 1) }),
      ...(params.hasVoiceNotes !== undefined && { voice_notes: params.hasVoiceNotes ? 0.8 : 0.5 }),
    },
    dataCompletenessScore: params.dcsScore,
  };
  return toAdapterResult(decideOrchestration(context), context);
}

// ─── 2. Pre-Design ───────────────────────────────────────────────────────────

export interface PreDesignParams {
  projectId: string;
  projectType: string;
  dcsScore: number;
  complexityScore?: number;
  requiresArchitect?: boolean;
  budgetEstimate?: number;
  userInputsComplete?: boolean;
  systemsImpacted?: string[];
}

/**
 * Orchestrate a PRE_DESIGN workflow step.
 * Called before generating a pre-design concept package.
 */
export function orchestratePreDesign(params: PreDesignParams): AdapterResult {
  const context: WorkflowOrchestrationContext = {
    projectId: params.projectId,
    projectType: params.projectType,
    workflowType: "PRE_DESIGN",
    dcsScore: params.dcsScore,
    complexityScore: params.complexityScore,
    dataCompletenessScore: params.dcsScore,
    requiresArchitect: params.requiresArchitect,
    budgetEstimate: params.budgetEstimate,
    userInputsComplete: params.userInputsComplete,
    systemsImpacted: params.systemsImpacted,
  };
  return toAdapterResult(decideOrchestration(context), context);
}

// ─── 3. Estimate ─────────────────────────────────────────────────────────────

export interface EstimateParams {
  projectId: string;
  budgetEstimate: number;
  dcsScore?: number;
  systemsImpacted?: string[];
  projectType?: string;
}

/**
 * Orchestrate an ESTIMATE workflow step.
 * Called before generating or releasing a cost estimate.
 */
export function orchestrateEstimate(params: EstimateParams): AdapterResult {
  const context: WorkflowOrchestrationContext = {
    projectId: params.projectId,
    projectType: params.projectType,
    workflowType: "ESTIMATE",
    dcsScore: params.dcsScore,
    dataCompletenessScore: params.dcsScore,
    budgetEstimate: params.budgetEstimate,
    systemsImpacted: params.systemsImpacted,
  };
  return toAdapterResult(decideOrchestration(context), context);
}

// ─── 4. Permit Prep ───────────────────────────────────────────────────────────

export interface PermitPrepParams {
  projectId: string;
  permitComplexity: "LOW" | "MEDIUM" | "HIGH";
  requiresArchitect?: boolean;
  systemsImpacted?: string[];
  dcsScore?: number;
  budgetEstimate?: number;
  projectType?: string;
}

/**
 * Orchestrate a PERMIT_PREP workflow step.
 * Called before submitting or preparing a permit application.
 * Note: PERMIT_PREP never auto-executes by design (always REQUIRE_APPROVAL minimum).
 */
export function orchestratePermitPrep(params: PermitPrepParams): AdapterResult {
  const context: WorkflowOrchestrationContext = {
    projectId: params.projectId,
    projectType: params.projectType,
    workflowType: "PERMIT_PREP",
    permitComplexity: params.permitComplexity,
    requiresArchitect: params.requiresArchitect,
    systemsImpacted: params.systemsImpacted,
    dcsScore: params.dcsScore,
    dataCompletenessScore: params.dcsScore,
    budgetEstimate: params.budgetEstimate,
  };
  return toAdapterResult(decideOrchestration(context), context);
}

// ─── 5. Contractor Match ──────────────────────────────────────────────────────

export interface ContractorMatchParams {
  projectId: string;
  budgetEstimate: number;
  systemsImpacted?: string[];
  dcsScore?: number;
  projectType?: string;
  requiresArchitect?: boolean;
}

/**
 * Orchestrate a CONTRACTOR_MATCH workflow step.
 * Called before running contractor matching or releasing bid packages.
 */
export function orchestrateContractorMatch(params: ContractorMatchParams): AdapterResult {
  const context: WorkflowOrchestrationContext = {
    projectId: params.projectId,
    projectType: params.projectType,
    workflowType: "CONTRACTOR_MATCH",
    budgetEstimate: params.budgetEstimate,
    systemsImpacted: params.systemsImpacted,
    dcsScore: params.dcsScore,
    dataCompletenessScore: params.dcsScore,
    requiresArchitect: params.requiresArchitect,
  };
  return toAdapterResult(decideOrchestration(context), context);
}

// ─── 6. PM Automation ────────────────────────────────────────────────────────

export interface PmAutomationParams {
  projectId: string;
  phase: string;
  dcsScore?: number;
  riskSignals?: Record<string, number>;
  budgetEstimate?: number;
  systemsImpacted?: string[];
  projectType?: string;
}

/**
 * Orchestrate a PM_AUTOMATION workflow step.
 * Called before automated PM actions (milestone advancement, schedule updates, etc.).
 */
export function orchestratePmAutomation(params: PmAutomationParams): AdapterResult {
  const context: WorkflowOrchestrationContext = {
    projectId: params.projectId,
    projectType: params.projectType,
    phase: params.phase,
    workflowType: "PM_AUTOMATION",
    dcsScore: params.dcsScore,
    dataCompletenessScore: params.dcsScore,
    riskSignals: params.riskSignals,
    budgetEstimate: params.budgetEstimate,
    systemsImpacted: params.systemsImpacted,
  };
  return toAdapterResult(decideOrchestration(context), context);
}

// ─── 7. Payment Recommendation ───────────────────────────────────────────────

export interface PaymentRecommendationParams {
  projectId: string;
  amount: number; // payment amount in USD
  requiresArchitect?: boolean;
  systemsImpacted?: string[];
  dcsScore?: number;
  projectType?: string;
}

/**
 * Orchestrate a PAYMENT_RECOMMENDATION workflow step.
 * Called before releasing or recommending a payment.
 * Note: CHANGE_ORDER payments always require REQUIRE_APPROVAL minimum.
 */
export function orchestratePaymentRecommendation(params: PaymentRecommendationParams): AdapterResult {
  const context: WorkflowOrchestrationContext = {
    projectId: params.projectId,
    projectType: params.projectType,
    workflowType: "PAYMENT_RECOMMENDATION",
    budgetEstimate: params.amount,
    requiresArchitect: params.requiresArchitect,
    systemsImpacted: params.systemsImpacted,
    dcsScore: params.dcsScore,
    dataCompletenessScore: params.dcsScore,
  };
  return toAdapterResult(decideOrchestration(context), context);
}

// ─── 8. Change Order ─────────────────────────────────────────────────────────

export interface ChangeOrderParams {
  projectId: string;
  changeAmount: number; // change order dollar value
  systemsImpacted?: string[];
  dcsScore?: number;
  projectType?: string;
}

/**
 * Orchestrate a CHANGE_ORDER workflow step.
 * Change orders always require at minimum REQUIRE_APPROVAL.
 */
export function orchestrateChangeOrder(params: ChangeOrderParams): AdapterResult {
  const context: WorkflowOrchestrationContext = {
    projectId: params.projectId,
    projectType: params.projectType,
    workflowType: "CHANGE_ORDER",
    budgetEstimate: params.changeAmount,
    systemsImpacted: params.systemsImpacted,
    dcsScore: params.dcsScore,
    dataCompletenessScore: params.dcsScore,
  };
  return toAdapterResult(decideOrchestration(context), context);
}
