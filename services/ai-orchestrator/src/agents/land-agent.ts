/**
 * services/ai-orchestrator/src/agents/land-agent.ts
 *
 * Kealee Land Analysis Agent
 *
 * Analyzes a parcel of land and produces a structured buildability and cost
 * assessment. Called from the land-feasibility subgraph after parcel and zoning
 * data has been collected.
 *
 * Rules:
 * - Returns structured JSON always
 * - Never guarantees permit approval
 * - Never fabricates zoning data — marks as LOW confidence when unknown
 * - Flags risks explicitly
 * - Recommends the next Kealee product, not a generic action
 */

import { ClaudeProvider } from "@kealee/core-llm";
import type { KealeeState } from "../state/kealee-state.js";
import { buildRAGContext } from "../retrieval/rag-retriever.js";

// ─── System prompt ────────────────────────────────────────────────────────────

const LAND_AGENT_SYSTEM_PROMPT = `You are Kealee Land Analysis Agent.

Your job is to determine what can be built on a parcel of land and provide a realistic buildability and cost assessment.

You must:
- analyze zoning and constraints
- estimate buildable area
- identify risks and blockers
- provide a rough cost range
- recommend the next step

You must NOT:
- guarantee permit approval
- fabricate zoning data
- provide exact engineered specs

If data is missing:
- return best estimate
- mark confidence level LOW

Output format must be structured JSON matching this exact schema:
{
  "summary": "1-2 sentence plain-language summary of what can be built",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidenceReason": "why confidence is at this level",
  "zoning": {
    "classification": "string or null",
    "allowedUses": ["..."],
    "restrictions": ["..."],
    "overlays": ["..."]
  },
  "buildableArea": {
    "estimatedSqFt": number | null,
    "maxHeight": number | null,
    "maxUnits": number | null,
    "notes": "string"
  },
  "risks": [
    { "severity": "HIGH" | "MEDIUM" | "LOW", "description": "string" }
  ],
  "blockers": ["string"],
  "costEstimate": {
    "low": number | null,
    "high": number | null,
    "basis": "string explaining what the estimate covers",
    "confidence": "HIGH" | "MEDIUM" | "LOW"
  },
  "permitPath": {
    "likely": "string describing likely permit type",
    "complexity": "SIMPLE" | "MODERATE" | "COMPLEX",
    "estimatedWeeks": number | null
  },
  "nextStep": {
    "productSku": "DESIGN_CONCEPT_VALIDATION" | "DESIGN_ADVANCED" | "DESIGN_FULL" | "PERMIT_SIMPLE" | "PERMIT_PACKAGE" | "ARCHITECT_VIP" | null,
    "reason": "string"
  },
  "disclaimer": "AI concept packages are planning tools only. They are not permit-ready stamped construction documents."
}`;

// ─── Input builder ────────────────────────────────────────────────────────────

function buildLandAgentPrompt(state: KealeeState): string {
  const la = state.landAnalysis ?? {};

  const zoningData = la.zoning
    ? `Zoning: ${la.zoning}`
    : "Zoning: NOT AVAILABLE — mark confidence LOW";

  const setbackData = la.setbacks
    ? `Setbacks: front=${la.setbacks.front ?? "unknown"}ft, rear=${la.setbacks.rear ?? "unknown"}ft, sides=${la.setbacks.left ?? "unknown"}/${la.setbacks.right ?? "unknown"}ft`
    : "Setbacks: NOT AVAILABLE";

  const overlayData =
    (la.overlays ?? []).length > 0
      ? `Active overlays: ${la.overlays!.join(", ")}`
      : "No overlays detected";

  const allowedUsesData =
    (la.allowedUses ?? []).length > 0
      ? `Allowed uses: ${la.allowedUses!.join(", ")}`
      : "Allowed uses: NOT AVAILABLE";

  const costData =
    la.estimatedBuildCostLow && la.estimatedBuildCostHigh
      ? `Preliminary cost estimate: $${la.estimatedBuildCostLow.toLocaleString()} – $${la.estimatedBuildCostHigh.toLocaleString()}`
      : "Cost estimate: NOT YET CALCULATED — derive from project type and area";

  const areaData =
    la.buildableAreaSqFt
      ? `Computed buildable area: ${la.buildableAreaSqFt.toLocaleString()} sq ft`
      : "Buildable area: NOT CALCULATED";

  return `Analyze this land parcel and produce a structured assessment.

PARCEL DATA:
Address: ${state.address ?? "NOT PROVIDED"}
Parcel ID: ${la.parcelId ?? "NOT PROVIDED"}
Jurisdiction: ${state.jurisdiction ?? la.jurisdiction ?? "NOT PROVIDED"}

ZONING DATA:
${zoningData}
${setbackData}
${overlayData}
${allowedUsesData}

SIZE / AREA:
${areaData}
Max units estimated: ${la.maxUnits ?? "UNKNOWN"}

COST DATA:
${costData}

EXISTING RISK FLAGS:
${(la.riskFlags ?? []).length > 0 ? la.riskFlags!.join("\n") : "None pre-identified"}

PROJECT INTENT:
Type: ${state.projectType ?? "Not specified"}
Intended use: ${(state as Record<string, unknown> & { extra?: { intendedUse?: string } }).extra?.intendedUse ?? "Not specified"}
Budget: ${state.budgetMax ? `$${state.budgetMax.toLocaleString()}` : "Not specified"}

PRODUCT PURCHASED:
${state.currentProductSku ?? "LAND_FEASIBILITY_BASIC"}

REFERENCE DATA (from Kealee RAG — use to calibrate your output):
${buildRAGContext({
    jurisdiction: state.jurisdiction ?? la.jurisdiction,
    projectType:  state.projectType ?? undefined,
    stage:        "land_analysis",
    topic:        "zoning_authority",
    k:            3,
  }).combined || "No reference data available for this jurisdiction."}

INSTRUCTIONS:
- If any zoning field is null or missing, mark confidence LOW for that section
- Do not invent specific zoning codes — describe the gap instead
- Cost range should reflect ${state.projectType ?? "general construction"} in ${state.jurisdiction ?? "the DMV area"}
- Next step must be a real Kealee product, not "hire an architect" generically
- Output ONLY the JSON object, no preamble or explanation`;
}

// ─── Agent runner ─────────────────────────────────────────────────────────────

export interface LandAnalysisAgentResult {
  success: boolean;
  report: LandAnalysisReport | null;
  rawText: string;
  error?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface LandAnalysisReport {
  summary: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  confidenceReason: string;
  zoning: {
    classification: string | null;
    allowedUses: string[];
    restrictions: string[];
    overlays: string[];
  };
  buildableArea: {
    estimatedSqFt: number | null;
    maxHeight: number | null;
    maxUnits: number | null;
    notes: string;
  };
  risks: Array<{ severity: "HIGH" | "MEDIUM" | "LOW"; description: string }>;
  blockers: string[];
  costEstimate: {
    low: number | null;
    high: number | null;
    basis: string;
    confidence: "HIGH" | "MEDIUM" | "LOW";
  };
  permitPath: {
    likely: string;
    complexity: "SIMPLE" | "MODERATE" | "COMPLEX";
    estimatedWeeks: number | null;
  };
  nextStep: {
    productSku: string | null;
    reason: string;
  };
  disclaimer: string;
}

const claude = new ClaudeProvider("claude-sonnet-4-6");

export async function runLandAnalysisAgent(
  state: KealeeState,
): Promise<LandAnalysisAgentResult> {
  if (!claude.isAvailable()) {
    // Return a structured stub when Claude is not configured
    const report = buildFallbackReport(state);
    return { success: true, report, rawText: JSON.stringify(report), confidence: "LOW" };
  }

  const prompt = buildLandAgentPrompt(state);

  try {
    const result = await claude.generateText({
      systemPrompt: LAND_AGENT_SYSTEM_PROMPT,
      prompt,
      maxTokens: 2048,
      temperature: 0.2,
      projectId: state.projectId,
      taskId:    `land_analysis_${state.threadId}`,
    });

    const report = parseAgentOutput<LandAnalysisReport>(result.text);

    if (!report) {
      return {
        success: false,
        report: buildFallbackReport(state),
        rawText: result.text,
        error:   "Failed to parse agent output as JSON — fallback report used",
        confidence: "LOW",
      };
    }

    return {
      success:    true,
      report,
      rawText:    result.text,
      confidence: report.confidence ?? "MEDIUM",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success:    false,
      report:     buildFallbackReport(state),
      rawText:    "",
      error:      `Land agent call failed: ${msg}`,
      confidence: "LOW",
    };
  }
}

// ─── Fallback report (used when Claude is unavailable) ────────────────────────

function buildFallbackReport(state: KealeeState): LandAnalysisReport {
  const la = state.landAnalysis ?? {};
  return {
    summary: `Land analysis initiated for ${state.address ?? "the provided address"}. Zoning verification is pending — confidence is LOW until real data is confirmed.`,
    confidence: "LOW",
    confidenceReason: "Zoning data not yet retrieved from jurisdiction source.",
    zoning: {
      classification: la.zoning ?? null,
      allowedUses: la.allowedUses ?? [],
      restrictions: [],
      overlays: la.overlays ?? [],
    },
    buildableArea: {
      estimatedSqFt: la.buildableAreaSqFt ?? null,
      maxHeight: null,
      maxUnits: la.maxUnits ?? 1,
      notes: "Estimate pending full zoning lookup.",
    },
    risks: [
      { severity: "MEDIUM", description: "Zoning data requires manual verification with jurisdiction." },
    ],
    blockers: [],
    costEstimate: {
      low: la.estimatedBuildCostLow ?? null,
      high: la.estimatedBuildCostHigh ?? null,
      basis: "Preliminary estimate. Final range requires scope confirmation.",
      confidence: "LOW",
    },
    permitPath: {
      likely: "Permit type to be determined after zoning confirmation.",
      complexity: "MODERATE",
      estimatedWeeks: null,
    },
    nextStep: {
      productSku: "DESIGN_CONCEPT_VALIDATION",
      reason: "A concept review will define scope and validate zoning before full design investment.",
    },
    disclaimer: "AI concept packages are planning tools only. They are not permit-ready stamped construction documents.",
  };
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

function parseAgentOutput<T>(raw: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(raw) as T;
  } catch {}
  try {
    // Extract JSON block from surrounding text
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
  } catch {}
  return null;
}
