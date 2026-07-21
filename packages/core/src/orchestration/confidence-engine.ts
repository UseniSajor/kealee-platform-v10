/**
 * ConfidenceEngine
 *
 * Produces a ConfidenceProfile for the current orchestration context.
 * Extends the heuristic scoring from @kealee/core-llm/confidence
 * with orchestration-specific dimensions: data completeness,
 * jurisdiction coverage, budget clarity, and AI analysis quality.
 */

import type {
  ConfidenceProfile,
  OrchestrationContext,
  WorkflowOrchestrationContext,
} from "./types";
import {
  CONFIDENCE_THRESHOLDS,
  CAPTURE_QUALITY,
  DCS_THRESHOLDS,
} from "./orchestration-config";

// ─── Thresholds ────────────────────────────────────────────────────────────────

const THRESHOLDS = {
  proceed: CONFIDENCE_THRESHOLDS.data_completeness,
  warn: 0.45,
} as const;

// ─── Engine ───────────────────────────────────────────────────────────────────

export class ConfidenceEngine {
  /**
   * Assess confidence for the given orchestration context.
   * All dimensions score 0–1. Higher = more confident.
   */
  assess(context: OrchestrationContext): ConfidenceProfile {
    const dataCompleteness = scoreDataCompleteness(context);
    const aiAnalysisScore = context.aiConfidence ?? 0.50;
    const intentClassification = scoreIntentClassification(context);
    const jurisdictionCoverage = scoreJurisdictionCoverage(context);
    const budgetClarity = scoreBudgetClarity(context);
    const retrievalSufficiency = scoreRetrievalSufficiency(context);

    // Weighted overall (data quality + AI confidence carry the most weight)
    const overall = weightedAverage([
      { score: dataCompleteness, weight: 0.30 },
      { score: aiAnalysisScore, weight: 0.30 },
      { score: intentClassification, weight: 0.15 },
      { score: jurisdictionCoverage, weight: 0.10 },
      { score: budgetClarity, weight: 0.10 },
      { score: retrievalSufficiency, weight: 0.05 },
    ]);

    const weakestDimension = findWeakest({
      data_completeness: dataCompleteness,
      ai_analysis: aiAnalysisScore,
      intent_classification: intentClassification,
      jurisdiction_coverage: jurisdictionCoverage,
      budget_clarity: budgetClarity,
      retrieval_sufficiency: retrievalSufficiency,
    });

    const recommendation: ConfidenceProfile["recommendation"] =
      overall >= THRESHOLDS.proceed ? "proceed"
      : overall >= THRESHOLDS.warn ? "warn"
      : "block";

    return {
      overall,
      dataCompleteness,
      aiAnalysisScore,
      intentClassification,
      jurisdictionCoverage,
      budgetClarity,
      retrievalSufficiency,
      weakestDimension,
      recommendation,
    };
  }
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function scoreDataCompleteness(ctx: OrchestrationContext): number {
  const facts = ctx.facts;
  const required = ["address", "projectType", "scopeSummary"];
  const optional = ["budgetRange", "stylePreferences", "timeline", "userId"];

  const requiredScore = required.filter((k) => {
    const v = facts[k];
    return v !== undefined && v !== null && String(v).trim() !== "";
  }).length / required.length;

  const optionalScore = optional.filter((k) => {
    const v = facts[k];
    return v !== undefined && v !== null && String(v).trim() !== "";
  }).length / optional.length;

  // Required fields carry 75% of the completeness score
  return requiredScore * 0.75 + optionalScore * 0.25;
}

function scoreIntentClassification(ctx: OrchestrationContext): number {
  if (!ctx.normalizedIntent || ctx.normalizedIntent === "unknown") return 0.30;
  // Has a normalized intent → solid classification
  const highConfidenceIntents = [
    "build_new", "renovate", "permit_only", "design_concept",
    "feasibility", "contractor_match", "developer_deal",
  ];
  return highConfidenceIntents.includes(ctx.normalizedIntent) ? 0.90 : 0.55;
}

function scoreJurisdictionCoverage(ctx: OrchestrationContext): number {
  const jurisdictionCode = ctx.facts["jurisdictionCode"];
  if (!jurisdictionCode) return 0.40; // address present but no jurisdiction resolved
  const wellCoveredJurisdictions = [
    "dc", "montgomery_md", "prince_georges_md",
    "fairfax_va", "arlington_va", "alexandria_va", "loudoun_va",
  ];
  return wellCoveredJurisdictions.includes(String(jurisdictionCode)) ? 0.90 : 0.60;
}

function scoreBudgetClarity(ctx: OrchestrationContext): number {
  if (ctx.budgetMin !== undefined && ctx.budgetMax !== undefined) return 0.90;
  const budgetRange = ctx.facts["budgetRange"];
  if (!budgetRange) return 0.20;
  const s = String(budgetRange).toLowerCase();
  if (s === "unknown" || s === "unsure" || s === "tbd") return 0.25;
  return 0.70; // has a range string
}

function scoreRetrievalSufficiency(ctx: OrchestrationContext): number {
  // Infer from context — if we have a normalizedIntent + jurisdiction we likely
  // retrieved enough seed context. Otherwise neutral.
  if (ctx.normalizedIntent && ctx.normalizedIntent !== "unknown" && ctx.facts["jurisdictionCode"]) {
    return 0.80;
  }
  if (ctx.normalizedIntent && ctx.normalizedIntent !== "unknown") return 0.60;
  return 0.40;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function weightedAverage(items: Array<{ score: number; weight: number }>): number {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const weighted = items.reduce((s, i) => s + i.score * i.weight, 0);
  return Math.round((weighted / totalWeight) * 1000) / 1000;
}

function findWeakest(scores: Record<string, number>): string {
  let weakest = "";
  let lowestScore = Infinity;
  for (const [dim, score] of Object.entries(scores)) {
    if (score < lowestScore) {
      lowestScore = score;
      weakest = dim;
    }
  }
  return weakest;
}

// ─── Platform-facing functions ────────────────────────────────────────────────
// These work with WorkflowOrchestrationContext for cross-module governance.

/**
 * Compute a single 0–1 confidence score from a WorkflowOrchestrationContext.
 * Aggregates capture quality, DCS, AI signals, and workflow-specific factors.
 */
export function computeConfidenceScore(ctx: WorkflowOrchestrationContext): number {
  const factors: Array<{ score: number; weight: number }> = [];

  // Capture quality (SmartScan / capture pipeline)
  const captureScore = ctx.captureQualityScore ?? 0.50;
  factors.push({ score: captureScore, weight: 0.20 });

  // Data completeness (DCS)
  const dcs = ctx.dcsScore ?? ctx.dataCompletenessScore ?? 0.50;
  factors.push({ score: dcs, weight: 0.30 });

  // User input completeness
  const userInputs = ctx.userInputsComplete === true ? 0.90 : ctx.userInputsComplete === false ? 0.30 : 0.55;
  factors.push({ score: userInputs, weight: 0.15 });

  // AI / model confidence signals
  if (ctx.confidenceSignals && Object.keys(ctx.confidenceSignals).length > 0) {
    const signalValues = Object.values(ctx.confidenceSignals);
    const avgSignal = signalValues.reduce((a, b) => a + b, 0) / signalValues.length;
    factors.push({ score: avgSignal, weight: 0.25 });
  } else {
    factors.push({ score: 0.50, weight: 0.25 }); // neutral default
  }

  // Complexity — higher complexity slightly lowers confidence
  if (ctx.complexityScore !== undefined) {
    const complexityPenalty = 1 - ctx.complexityScore * 0.40;
    factors.push({ score: complexityPenalty, weight: 0.10 });
  }

  return Math.min(1, Math.max(0, weightedAverage(factors)));
}

/**
 * Explain the confidence breakdown for a WorkflowOrchestrationContext.
 * Returns a score and human-readable factor list.
 */
export function explainConfidence(ctx: WorkflowOrchestrationContext): {
  score: number;
  factors: string[];
} {
  const score = computeConfidenceScore(ctx);
  const factors: string[] = [];

  const capture = ctx.captureQualityScore ?? 0.50;
  if (capture < CAPTURE_QUALITY.acceptableMin) {
    factors.push(`Low capture quality (${(capture * 100).toFixed(0)}%) — SmartScan coverage insufficient`);
  } else if (capture >= CAPTURE_QUALITY.highQualityMin) {
    factors.push(`High capture quality (${(capture * 100).toFixed(0)}%)`);
  }

  const dcs = ctx.dcsScore ?? ctx.dataCompletenessScore ?? 0.50;
  if (dcs < DCS_THRESHOLDS.acceptable) {
    factors.push(`Low data completeness score (${(dcs * 100).toFixed(0)}%) — project data incomplete`);
  } else if (dcs >= DCS_THRESHOLDS.complete) {
    factors.push(`Data completeness meets threshold (${(dcs * 100).toFixed(0)}%)`);
  }

  if (ctx.userInputsComplete === false) {
    factors.push("User inputs are incomplete");
  }

  if (ctx.confidenceSignals) {
    const lowSignals = Object.entries(ctx.confidenceSignals).filter(([, v]) => v < 0.60);
    for (const [dim] of lowSignals) {
      factors.push(`Low AI confidence on '${dim}' dimension`);
    }
  }

  if (ctx.complexityScore !== undefined && ctx.complexityScore > 0.70) {
    factors.push(`High complexity score (${(ctx.complexityScore * 100).toFixed(0)}%) reduces confidence`);
  }

  if (factors.length === 0) factors.push("All confidence factors within acceptable range");

  return { score, factors };
}
