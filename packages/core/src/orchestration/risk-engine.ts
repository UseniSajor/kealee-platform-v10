/**
 * RiskEngine
 *
 * Produces a RiskProfile for the current orchestration context.
 * Evaluates five risk categories: financial, structural, regulatory,
 * data quality, and operational. Produces a composite risk score
 * and maps it to a RiskLevel.
 */

import type {
  OrchestrationContext,
  RiskLevel,
  RiskProfile,
  WorkflowOrchestrationContext,
} from "./types";
import {
  RISK_THRESHOLDS,
  PERMIT_COMPLEXITY_RISK,
  SYSTEM_IMPACT_RISK,
  PROJECT_TYPE_RISK_MULTIPLIER,
  CAPTURE_QUALITY,
} from "./orchestration-config";

// ─── Risk score → level mapping ───────────────────────────────────────────────

function scoreToLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.critical) return "CRITICAL";
  if (score >= RISK_THRESHOLDS.high) return "HIGH";
  if (score >= RISK_THRESHOLDS.medium) return "MEDIUM";
  return "LOW";
}

// ─── Blocking flags ───────────────────────────────────────────────────────────
// If any of these appear in context.riskFlags the outcome MUST be BLOCK.

const ABSOLUTE_BLOCKERS = [
  "unlicensed_contractor",
  "active_litigation",
  "lien_on_property",
  "fraud_signal",
  "identity_mismatch",
  "suspended_account",
];

// ─── Engine ───────────────────────────────────────────────────────────────────

export class RiskEngine {
  assess(context: OrchestrationContext): RiskProfile {
    const financial = scoreFinancialRisk(context);
    const structural = scoreStructuralRisk(context);
    const regulatory = scoreRegulatoryRisk(context);
    const dataQuality = scoreDataQualityRisk(context);
    const operational = scoreOperationalRisk(context);

    // Composite — financial and structural are highest-weight for this platform
    const score = weightedAverage([
      { score: financial, weight: 0.30 },
      { score: structural, weight: 0.25 },
      { score: regulatory, weight: 0.20 },
      { score: dataQuality, weight: 0.15 },
      { score: operational, weight: 0.10 },
    ]);

    const level = scoreToLevel(score);
    const flags = collectFlags(context, { financial, structural, regulatory, dataQuality, operational });
    const blockingFlags = flags.filter((f) => ABSOLUTE_BLOCKERS.includes(f));
    const mitigations = buildMitigations(flags, context);

    return {
      level,
      score: Math.round(score * 1000) / 1000,
      flags,
      categories: { financial, structural, regulatory, dataQuality, operational },
      mitigations,
      blockingFlags,
    };
  }
}

// ─── Category scorers ─────────────────────────────────────────────────────────

function scoreFinancialRisk(ctx: OrchestrationContext): number {
  let score = 0.10; // baseline

  // High-value actions carry inherent risk
  if (ctx.action === "release_payment") score += 0.40;
  if (ctx.action === "create_checkout") score += 0.20;
  if (ctx.action === "approve_bid") score += 0.25;

  // Budget size
  const budgetMax = ctx.budgetMax ?? parseBudgetMax(ctx.facts["budgetRange"]);
  if (budgetMax !== undefined) {
    if (budgetMax > 1_000_000) score += 0.30;
    else if (budgetMax > 500_000) score += 0.20;
    else if (budgetMax > 100_000) score += 0.10;
  }

  // Risk flags from session memory
  if (ctx.riskFlags.some((f) => f.includes("budget_exceeded") || f.includes("cost_overrun"))) score += 0.20;
  if (ctx.riskFlags.some((f) => f.includes("payment"))) score += 0.10;

  return clamp(score);
}

function scoreStructuralRisk(ctx: OrchestrationContext): number {
  let score = 0.05;

  if (ctx.requiresStructuralWork) score += 0.35;

  const intent = ctx.normalizedIntent ?? "";
  if (intent === "build_new") score += 0.30;
  if (intent === "developer_deal") score += 0.25;
  if (intent === "renovate") score += 0.15;

  const scope = String(ctx.facts["scopeSummary"] ?? "").toLowerCase();
  if (scope.includes("foundation") || scope.includes("load-bearing") || scope.includes("structural")) score += 0.20;
  if (scope.includes("addition") || scope.includes("adu") || scope.includes("second story")) score += 0.15;

  return clamp(score);
}

function scoreRegulatoryRisk(ctx: OrchestrationContext): number {
  let score = 0.05;

  if (ctx.requiresPermit) score += 0.25;
  if (ctx.hoaReviewRequired) score += 0.10;
  if (ctx.action === "submit_permit") score += 0.20;

  const intent = ctx.normalizedIntent ?? "";
  if (intent === "permit_only") score += 0.30;

  // Jurisdiction complexity
  const jurisdiction = String(ctx.facts["jurisdictionCode"] ?? "");
  const complexJurisdictions = ["dc", "arlington_va", "montgomery_md"];
  if (complexJurisdictions.includes(jurisdiction)) score += 0.15;
  if (!jurisdiction) score += 0.10; // unknown jurisdiction = higher regulatory uncertainty

  return clamp(score);
}

function scoreDataQualityRisk(ctx: OrchestrationContext): number {
  let score = 0.05;

  // Missing critical fields
  const facts = ctx.facts;
  if (!facts["address"] || String(facts["address"]).trim() === "") score += 0.25;
  if (!facts["projectType"] || String(facts["projectType"]).trim() === "") score += 0.15;
  if (!facts["scopeSummary"] || String(facts["scopeSummary"]).trim() === "") score += 0.20;
  if (!ctx.userId && !ctx.orgId) score += 0.10; // anonymous session

  // Low AI confidence signals uncertain data interpretation
  if (ctx.aiConfidence !== undefined && ctx.aiConfidence < 0.50) score += 0.20;
  if (ctx.fallbackUsed) score += 0.10;

  return clamp(score);
}

function scoreOperationalRisk(ctx: OrchestrationContext): number {
  let score = 0.05;

  // Retry count indicates previous failures
  if ((ctx.retryCount ?? 0) >= 2) score += 0.20;
  if ((ctx.retryCount ?? 0) >= 3) score += 0.15; // cumulative

  // Agent delegation is inherently less predictable
  if (ctx.action === "agent_delegation") score += 0.15;
  if (ctx.action === "external_api_call") score += 0.10;

  // Risk flags
  if (ctx.riskFlags.length > 3) score += 0.15;
  if (ctx.riskFlags.some((f) => f.includes("timeout") || f.includes("error"))) score += 0.15;

  return clamp(score);
}

// ─── Flag collection ──────────────────────────────────────────────────────────

function collectFlags(
  ctx: OrchestrationContext,
  scores: { financial: number; structural: number; regulatory: number; dataQuality: number; operational: number },
): string[] {
  const flags: string[] = [...ctx.riskFlags];

  if (scores.financial >= 0.50) flags.push("high_financial_risk");
  if (scores.structural >= 0.50) flags.push("high_structural_risk");
  if (scores.regulatory >= 0.50) flags.push("high_regulatory_risk");
  if (scores.dataQuality >= 0.50) flags.push("poor_data_quality");
  if (scores.operational >= 0.50) flags.push("high_operational_risk");

  if (!ctx.facts["address"]) flags.push("missing_address");
  if (!ctx.normalizedIntent || ctx.normalizedIntent === "unknown") flags.push("unclear_intent");
  if (ctx.requiresStructuralWork) flags.push("structural_scope");
  if (ctx.requiresPermit) flags.push("permit_required");

  // Deduplicate
  return [...new Set(flags)];
}

// ─── Mitigation builder ───────────────────────────────────────────────────────

function buildMitigations(flags: string[], ctx: OrchestrationContext): string[] {
  const m: string[] = [];

  if (flags.includes("missing_address")) m.push("Request property address before proceeding");
  if (flags.includes("unclear_intent")) m.push("Clarify project intent with the homeowner before executing");
  if (flags.includes("structural_scope")) m.push("Require licensed structural engineer review before permit submission");
  if (flags.includes("permit_required")) m.push("Confirm permit requirements with local jurisdiction before commitment");
  if (flags.includes("high_financial_risk")) m.push("Require operator review before any payment action");
  if (flags.includes("poor_data_quality")) m.push("Collect missing project details before running analysis");
  if (ctx.hoaReviewRequired) m.push("Submit HOA review request before construction phase");
  if ((ctx.retryCount ?? 0) >= 2) m.push("Investigate failure root cause before retrying again");

  return m;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(score: number): number {
  return Math.min(1.0, Math.max(0.0, score));
}

function weightedAverage(items: Array<{ score: number; weight: number }>): number {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const weighted = items.reduce((s, i) => s + i.score * i.weight, 0);
  return weighted / totalWeight;
}

function parseBudgetMax(raw: unknown): number | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.toLowerCase().replace(/[,$]/g, "");
  const match = s.match(/(\d+(?:\.\d+)?)\s*[mk]?/);
  if (!match) return undefined;
  const num = parseFloat(match[1]);
  if (s.includes("m")) return num * 1_000_000;
  if (s.includes("k")) return num * 1_000;
  return num;
}

// ─── Platform-facing functions ────────────────────────────────────────────────

/**
 * Compute a 0–1 risk score from a WorkflowOrchestrationContext.
 * Deterministic, auditable, no opaque ML scoring.
 */
export function computeRiskScore(ctx: WorkflowOrchestrationContext): number {
  let score = 0.05; // baseline

  // Project type multiplier
  const typeMultiplier = PROJECT_TYPE_RISK_MULTIPLIER[ctx.projectType ?? ""] ?? 1.0;

  // Budget
  const budget = ctx.budgetEstimate ?? 0;
  if (budget > 1_000_000) score += 0.25;
  else if (budget > 500_000) score += 0.18;
  else if (budget > 100_000) score += 0.10;

  // Permit complexity
  if (ctx.permitComplexity) {
    score += PERMIT_COMPLEXITY_RISK[ctx.permitComplexity];
  }

  // Systems impacted
  if (ctx.systemsImpacted) {
    for (const system of ctx.systemsImpacted) {
      score += SYSTEM_IMPACT_RISK[system.toLowerCase()] ?? 0.05;
    }
  }

  // Architect requirement
  if (ctx.requiresArchitect) score += 0.10;

  // Low capture quality → higher uncertainty risk
  if (ctx.captureQualityScore !== undefined && ctx.captureQualityScore < CAPTURE_QUALITY.acceptableMin) {
    score += 0.15;
  }

  // DCS low → higher risk from unknown factors
  const dcs = ctx.dcsScore ?? ctx.dataCompletenessScore;
  if (dcs !== undefined && dcs < 0.50) score += 0.15;

  // Risk signals from context
  if (ctx.riskSignals) {
    const signalValues = Object.values(ctx.riskSignals);
    if (signalValues.length > 0) {
      const avgSignal = signalValues.reduce((a, b) => a + b, 0) / signalValues.length;
      score += avgSignal * 0.20;
    }
  }

  // Workflow type inherent risk
  const workflowBaseRisk: Partial<Record<string, number>> = {
    CAPTURE_ANALYSIS:        0.05,
    PRE_DESIGN:              0.05,
    ESTIMATE:                0.08,
    PERMIT_PREP:             0.15,
    CONTRACTOR_MATCH:        0.10,
    PM_AUTOMATION:           0.08,
    PAYMENT_RECOMMENDATION:  0.15,
    CHANGE_ORDER:            0.25,
  };
  score += workflowBaseRisk[ctx.workflowType] ?? 0.05;

  // Apply project type multiplier (cap at 1.0)
  return clamp(score * typeMultiplier);
}

/**
 * Explain the risk breakdown for a WorkflowOrchestrationContext.
 */
export function explainRisk(ctx: WorkflowOrchestrationContext): {
  score: number;
  factors: string[];
} {
  const score = computeRiskScore(ctx);
  const factors: string[] = [];

  if (ctx.budgetEstimate && ctx.budgetEstimate > 500_000) {
    factors.push(`High budget estimate ($${(ctx.budgetEstimate / 1_000).toFixed(0)}k)`);
  }

  if (ctx.permitComplexity === "HIGH") {
    factors.push("High permit complexity — multiple permits or specialized review likely");
  } else if (ctx.permitComplexity === "MEDIUM") {
    factors.push("Medium permit complexity");
  }

  if (ctx.systemsImpacted?.includes("structural")) {
    factors.push("Structural systems impacted — requires licensed structural review");
  }
  if (ctx.systemsImpacted?.length && ctx.systemsImpacted.length > 2) {
    factors.push(`Multiple systems impacted: ${ctx.systemsImpacted.join(", ")}`);
  }

  if (ctx.requiresArchitect) {
    factors.push("Architect required for this scope");
  }

  if (ctx.captureQualityScore !== undefined && ctx.captureQualityScore < CAPTURE_QUALITY.acceptableMin) {
    factors.push(`Low capture quality increases uncertainty risk`);
  }

  if (ctx.workflowType === "CHANGE_ORDER") {
    factors.push("Change orders carry inherent contractual risk");
  }
  if (ctx.workflowType === "PAYMENT_RECOMMENDATION") {
    factors.push("Payment workflows require authority validation");
  }

  const typeMultiplier = PROJECT_TYPE_RISK_MULTIPLIER[ctx.projectType ?? ""] ?? 1.0;
  if (typeMultiplier > 1.2) {
    factors.push(`Project type '${ctx.projectType}' carries elevated risk (${typeMultiplier}x multiplier)`);
  }

  if (factors.length === 0) factors.push("Risk factors within acceptable range");

  return { score, factors };
}
