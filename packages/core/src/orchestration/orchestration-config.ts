/**
 * orchestration-config.ts
 *
 * Centralized thresholds and configuration for the KeaCore orchestration engine.
 * All magic numbers live here — never scattered across engine files.
 *
 * Override behavior via environment variables where marked.
 */

// ─── Decision thresholds ──────────────────────────────────────────────────────

export const DECISION_THRESHOLDS = {
  /**
   * Confidence at or above this level + risk at or below riskAutoExecute
   * → AUTO_EXECUTE
   */
  confidenceAutoExecute: 0.85,

  /**
   * Confidence below this level → ESCALATE regardless of risk
   */
  confidenceEscalate: 0.60,

  /**
   * Risk at or below this level + confidence ok → AUTO_EXECUTE
   */
  riskAutoExecute: 0.30,

  /**
   * Risk above this level → ESCALATE
   */
  riskEscalate: 0.60,
} as const;

// ─── Confidence dimension thresholds ─────────────────────────────────────────

export const CONFIDENCE_THRESHOLDS = {
  /** Intent / workflow classification must be reliable */
  intent_classification: 0.75,
  /** Did we find enough context for a grounded answer? */
  retrieval_sufficiency: 0.60,
  /** Is the AI-generated summary coherent? */
  internal_summary: 0.70,
  /** Service/workflow recommendation quality */
  recommendation: 0.65,
  /** Multimodal interpretation (vision models) */
  multimodal_interpretation: 0.60,
  /** Data completeness — does the project have enough info? */
  data_completeness: 0.65,
} as const;

// ─── Risk level thresholds ────────────────────────────────────────────────────

export const RISK_THRESHOLDS = {
  critical: 0.75,
  high: 0.50,
  medium: 0.25,
  // below medium = LOW
} as const;

// ─── Payment authority thresholds (USD) ──────────────────────────────────────

export const PAYMENT_THRESHOLDS = {
  /** Auto-recommend is allowed below this amount */
  autoRecommendMax: 5_000,
  /** Operator approval required above this amount */
  operatorApprovalMin: 5_000,
  /** Admin approval required above this amount */
  adminApprovalMin: 50_000,
} as const;

// ─── Workflow-specific overrides ──────────────────────────────────────────────

/**
 * Per-workflow confidence and risk threshold overrides.
 * If not specified, falls back to DECISION_THRESHOLDS.
 */
export const WORKFLOW_OVERRIDES: Partial<
  Record<
    string,
    { confidenceAutoExecute?: number; riskAutoExecute?: number }
  >
> = {
  CAPTURE_ANALYSIS:        { confidenceAutoExecute: 0.80, riskAutoExecute: 0.35 },
  PRE_DESIGN:              { confidenceAutoExecute: 0.85, riskAutoExecute: 0.30 },
  ESTIMATE:                { confidenceAutoExecute: 0.80, riskAutoExecute: 0.40 },
  PERMIT_PREP:             { confidenceAutoExecute: 0.90, riskAutoExecute: 0.25 },
  CONTRACTOR_MATCH:        { confidenceAutoExecute: 0.80, riskAutoExecute: 0.35 },
  PM_AUTOMATION:           { confidenceAutoExecute: 0.75, riskAutoExecute: 0.40 },
  PAYMENT_RECOMMENDATION:  { confidenceAutoExecute: 0.85, riskAutoExecute: 0.25 },
  CHANGE_ORDER:            { confidenceAutoExecute: 0.95, riskAutoExecute: 0.15 }, // very strict
};

// ─── Project-type risk multipliers ───────────────────────────────────────────

/**
 * Risk score multiplier applied based on project type.
 * Residential single-family is the baseline (1.0).
 */
export const PROJECT_TYPE_RISK_MULTIPLIER: Record<string, number> = {
  residential_single_family: 1.0,
  residential_adu:           1.1,
  residential_multifamily:   1.3,
  commercial:                1.5,
  mixed_use:                 1.6,
  enterprise:                1.8,
  industrial:                1.7,
};

// ─── Permit complexity risk additions ────────────────────────────────────────

export const PERMIT_COMPLEXITY_RISK: Record<"LOW" | "MEDIUM" | "HIGH", number> = {
  LOW: 0.10,
  MEDIUM: 0.20,
  HIGH: 0.35,
};

// ─── Systems impact risk additions ───────────────────────────────────────────

/**
 * Additional risk score per impacted system.
 * Additive: a project touching structural + hvac adds 0.15 + 0.10 = 0.25.
 */
export const SYSTEM_IMPACT_RISK: Record<string, number> = {
  structural:  0.15,
  hvac:        0.10,
  plumbing:    0.10,
  electrical:  0.10,
  foundation:  0.20,
  roofing:     0.08,
  fire_suppression: 0.12,
};

// ─── Capture quality thresholds ───────────────────────────────────────────────

export const CAPTURE_QUALITY = {
  /** Score below this → LOW_CAPTURE_QUALITY reason code added */
  acceptableMin: 0.50,
  /** Score at or above this → high-quality capture bonus */
  highQualityMin: 0.80,
} as const;

// ─── DCS (Data Completeness Score) thresholds ────────────────────────────────

export const DCS_THRESHOLDS = {
  complete: 0.85,
  acceptable: 0.60,
  poor: 0.40,
} as const;
