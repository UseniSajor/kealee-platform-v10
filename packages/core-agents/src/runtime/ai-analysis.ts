/**
 * core-agents/runtime/ai-analysis.ts
 * AI analysis functions for intake, feasibility, and recommendation packages.
 *
 * ALWAYS routes through @kealee/core-ai-gateway, never calls providers directly.
 * Uses internal-first routing (Qwen → Claude fallback).
 *
 * For multimodal intakes (hasImages=true, hasPlans=true),
 * the gateway routes to Qwen3-VL automatically.
 */

import { NormalizedIntake } from "./intake-types";

// ─── Output types ─────────────────────────────────────────────────────────────

export interface IntakeAnalysisResult {
  summary: string;
  likelyProjectComplexity: "low" | "medium" | "high";
  missingCriticalFields: string[];
  riskFlags: string[];
  suggestedUpsells: string[];
  matchedIntent?: string;
  matchedWorkflow?: string;
  primaryService?: string;
  secondaryServices?: string[];
  jurisdictionCode?: string;
  requiresOperatorReview: boolean;
  disclaimers: string[];
  confidence: number;
  provider: string;
  fallbackUsed: boolean;
}

export interface FeasibilitySummaryResult {
  summary: string;
  viabilityScore: "low" | "medium" | "high";
  keyRisks: string[];
  recommendedNextSteps: string[];
  estimatedBudgetRange?: string;
  confidence: number;
  provider: string;
}

export interface RecommendationPackageResult {
  primaryRecommendation: {
    serviceCode: string;
    name: string;
    rationale: string;
    price?: string;
  };
  secondaryRecommendations: Array<{ serviceCode: string; name: string; rationale: string }>;
  operatorNote?: string;
  userSummary: string;
  confidence: number;
  provider: string;
}

// ─── Schema definitions for generateObject ───────────────────────────────────

const INTAKE_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    likelyProjectComplexity: { type: "string", enum: ["low", "medium", "high"] },
    missingCriticalFields: { type: "array", items: { type: "string" } },
    riskFlags: { type: "array", items: { type: "string" } },
    suggestedUpsells: { type: "array", items: { type: "string" } },
    matchedIntent: { type: "string" },
    matchedWorkflow: { type: "string" },
    primaryService: { type: "string" },
    secondaryServices: { type: "array", items: { type: "string" } },
    jurisdictionCode: { type: "string" },
    requiresOperatorReview: { type: "boolean" },
    disclaimers: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "likelyProjectComplexity", "missingCriticalFields", "riskFlags", "requiresOperatorReview"],
};

// ─── Analysis functions ───────────────────────────────────────────────────────

export async function analyzeIntakeContext(
  intake: NormalizedIntake,
  options?: {
    sessionId?: string;
    taskId?: string;
    imageUrl?: string; // for Qwen3-VL path
  },
): Promise<IntakeAnalysisResult> {
  // Lazy import to avoid circular dep and allow keacore to boot without gateway
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { aiGateway } = require("@kealee/core-ai-gateway") as {
    aiGateway: {
      generateObject: <T>(args: unknown) => Promise<{ object: T; confidence: number; provider: string; fallbackUsed: boolean }>;
    };
  };

  const systemPrompt = "You are KeaCore, the Kealee platform's AI intake analyst. Analyze project intake data and return a structured JSON analysis. Be concise and grounded.";

  const intakeText = intake.rawText ?? [
    intake.projectType && `Project type: ${intake.projectType}`,
    intake.address && `Address: ${intake.address}`,
    intake.scopeSummary && `Scope: ${intake.scopeSummary}`,
    intake.budgetRange && `Budget: ${intake.budgetRange}`,
    intake.hasPlans && "Has plans: yes",
    intake.hasImages && "Has images: yes",
  ].filter(Boolean).join("\n");

  const disclaimerNote = "All onsite services must be performed by licensed contractors. Kealee provides AI analysis, advisory, and matching only.";

  const prompt = `Analyze this project intake. Return JSON matching the provided schema.

PROJECT INTAKE:
${intakeText}

Always include this disclaimer in disclaimers array: "${disclaimerNote}"
If address is in a DMV jurisdiction (DC, MD suburbs, VA suburbs), identify jurisdictionCode.
If project requires permits, set requiresOperatorReview to true.`;

  interface AnalysisObject {
    summary?: string;
    likelyProjectComplexity?: string;
    missingCriticalFields?: string[];
    riskFlags?: string[];
    suggestedUpsells?: string[];
    matchedIntent?: string;
    matchedWorkflow?: string;
    primaryService?: string;
    secondaryServices?: string[];
    jurisdictionCode?: string;
    requiresOperatorReview?: boolean;
    disclaimers?: string[];
  }

  const result = await aiGateway.generateObject<AnalysisObject>({
    prompt,
    systemPrompt,
    schema: INTAKE_ANALYSIS_SCHEMA,
    routingContext: "intake_classification",
    intake,
    sessionId: options?.sessionId,
    taskId: options?.taskId,
    // Pass imageUrl for Qwen3-VL routing when user uploaded images
    ...(options?.imageUrl ? { imageUrl: options.imageUrl } : {}),
    maxTokens: 1024,
    temperature: 0.2,
  });

  const obj = result.object ?? {};

  return {
    summary: obj.summary ?? "Unable to analyze intake",
    likelyProjectComplexity: (obj.likelyProjectComplexity as "low" | "medium" | "high") ?? "medium",
    missingCriticalFields: obj.missingCriticalFields ?? [],
    riskFlags: obj.riskFlags ?? [],
    suggestedUpsells: obj.suggestedUpsells ?? [],
    matchedIntent: obj.matchedIntent,
    matchedWorkflow: obj.matchedWorkflow,
    primaryService: obj.primaryService,
    secondaryServices: obj.secondaryServices ?? [],
    jurisdictionCode: obj.jurisdictionCode ?? intake.jurisdictionCode,
    requiresOperatorReview: obj.requiresOperatorReview ?? false,
    disclaimers: obj.disclaimers ?? [disclaimerNote],
    confidence: result.confidence,
    provider: result.provider,
    fallbackUsed: result.fallbackUsed,
  };
}

export async function analyzeFeasibilitySummary(
  intake: NormalizedIntake,
  feasibilityData: Record<string, unknown>,
  options?: { sessionId?: string },
): Promise<FeasibilitySummaryResult> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { aiGateway } = require("@kealee/core-ai-gateway") as {
    aiGateway: {
      generateObject: <T>(args: unknown) => Promise<{ object: T; confidence: number; provider: string }>;
    };
  };

  const prompt = `Summarize this feasibility analysis for a homeowner.

INTAKE:
${intake.rawText ?? ""}

FEASIBILITY DATA:
${JSON.stringify(feasibilityData, null, 2)}

Return JSON: { "summary": "string", "viabilityScore": "low|medium|high", "keyRisks": [], "recommendedNextSteps": [], "estimatedBudgetRange": "string or null" }`;

  interface FeasibilityObject {
    summary?: string;
    viabilityScore?: string;
    keyRisks?: string[];
    recommendedNextSteps?: string[];
    estimatedBudgetRange?: string;
  }

  const result = await aiGateway.generateObject<FeasibilityObject>({
    prompt,
    schema: { type: "object", properties: { summary: { type: "string" }, viabilityScore: { type: "string" } }, required: ["summary", "viabilityScore"] },
    routingContext: "retrieval_summary",
    intake,
    sessionId: options?.sessionId,
    maxTokens: 512,
  });

  const obj = result.object ?? {};

  return {
    summary: obj.summary ?? "Feasibility analysis unavailable",
    viabilityScore: (obj.viabilityScore as "low" | "medium" | "high") ?? "medium",
    keyRisks: obj.keyRisks ?? [],
    recommendedNextSteps: obj.recommendedNextSteps ?? [],
    estimatedBudgetRange: obj.estimatedBudgetRange,
    confidence: result.confidence,
    provider: result.provider,
  };
}

export async function analyzeRecommendationPackage(
  intake: NormalizedIntake,
  analysisResult: IntakeAnalysisResult,
  options?: { sessionId?: string },
): Promise<RecommendationPackageResult> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { aiGateway } = require("@kealee/core-ai-gateway") as {
    aiGateway: {
      generateObject: <T>(args: unknown) => Promise<{ object: T; confidence: number; provider: string }>;
    };
  };

  const prompt = `Generate a service recommendation for this project.

ANALYSIS:
${JSON.stringify(analysisResult, null, 2)}

Return JSON with primaryRecommendation (serviceCode, name, rationale, price), secondaryRecommendations array, operatorNote (or null), userSummary.`;

  interface RecommendationObject {
    primaryRecommendation?: { serviceCode: string; name: string; rationale: string; price?: string };
    secondaryRecommendations?: Array<{ serviceCode: string; name: string; rationale: string }>;
    operatorNote?: string;
    userSummary?: string;
  }

  const result = await aiGateway.generateObject<RecommendationObject>({
    prompt,
    schema: { type: "object", properties: { primaryRecommendation: { type: "object" }, userSummary: { type: "string" } }, required: ["primaryRecommendation", "userSummary"] },
    routingContext: "service_recommendation",
    intake,
    sessionId: options?.sessionId,
    maxTokens: 512,
  });

  const obj = result.object ?? {};

  return {
    primaryRecommendation: obj.primaryRecommendation ?? {
      serviceCode: analysisResult.primaryService ?? "ai_concept_basic",
      name: "AI Concept Package",
      rationale: "Based on your project description",
      price: "$585",
    },
    secondaryRecommendations: obj.secondaryRecommendations ?? [],
    operatorNote: obj.operatorNote,
    userSummary: obj.userSummary ?? "Here are our recommendations based on your project.",
    confidence: result.confidence,
    provider: result.provider,
  };
}
