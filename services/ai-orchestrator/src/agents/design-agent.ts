/**
 * services/ai-orchestrator/src/agents/design-agent.ts
 *
 * Kealee Design Agent
 *
 * Generates conceptual project designs and validates feasibility.
 * Called from the delivery subgraph when the product is a concept package.
 *
 * Rules:
 * - NEVER claims designs are permit-ready
 * - NEVER replaces licensed architect documents
 * - Always includes design summary, feasibility notes, and next recommended step
 * - Flags if an architect handoff is required
 */

import { ClaudeProvider } from "@kealee/core-llm";
import type { KealeeState } from "../state/kealee-state.js";
import { requiresArchitectHandoff, RULE_CONCEPT_NOT_PERMIT_READY } from "../rules/business-rules.js";

// ─── System prompt ────────────────────────────────────────────────────────────

const DESIGN_AGENT_SYSTEM_PROMPT = `You are Kealee Design Agent.

You generate conceptual project designs and validate feasibility.

You must:
- interpret user intent
- generate layout ideas
- estimate scale and complexity
- flag permit requirements

You must NOT:
- claim designs are permit-ready
- replace licensed architect documents

Always include:
- design summary
- feasibility notes
- next recommended step

Output format must be structured JSON matching this exact schema:
{
  "designSummary": "2-3 sentence description of the conceptual design direction",
  "projectScale": "SMALL" | "MEDIUM" | "LARGE" | "COMPLEX",
  "complexityScore": 0-100,
  "spatialConcepts": [
    {
      "option": number,
      "description": "brief description of this layout option",
      "tradeoffs": "key tradeoffs vs other options"
    }
  ],
  "materialDirection": "brief description of material and finish direction",
  "feasibility": {
    "score": 0-100,
    "notes": "key feasibility considerations",
    "constraints": ["list of known constraints"],
    "assumptions": ["list of assumptions made due to missing data"]
  },
  "permitRequirements": {
    "permitRequired": true | false,
    "permitType": "string describing likely permit type",
    "architectRequired": true | false,
    "architectReason": "why architect is required, or null if not required",
    "stampedPlansRequired": true | false
  },
  "costDirection": {
    "lowEstimate": number | null,
    "highEstimate": number | null,
    "costDrivers": ["key cost drivers for this project"]
  },
  "nextStep": {
    "productSku": "PERMIT_SIMPLE" | "PERMIT_PACKAGE" | "PERMIT_COORDINATION" | "ESTIMATE_DETAILED" | "ARCHITECT_VIP" | "PM_ADVISORY" | null,
    "reason": "string"
  },
  "warnings": ["any critical warnings the owner must know"],
  "disclaimer": "AI concept packages are design intent visualizations only. They are NOT permit-ready stamped construction documents. If stamped drawings are required for your permit, you will need a licensed architect or engineer."
}`;

// ─── Input builder ────────────────────────────────────────────────────────────

function buildDesignAgentPrompt(state: KealeeState): string {
  const hasAddress   = Boolean(state.address);
  const hasType      = Boolean(state.projectType);
  const hasScope     = Boolean(state.scopeSummary);
  const hasBudget    = Boolean(state.budgetMax);
  const hasStyle     = (state.stylePreferences ?? []).length > 0;
  const hasJurisdiction = Boolean(state.jurisdiction);

  const missingFields: string[] = [];
  if (!hasAddress)      missingFields.push("address");
  if (!hasType)         missingFields.push("projectType");
  if (!hasScope)        missingFields.push("scopeSummary");
  if (!hasBudget)       missingFields.push("budget");
  if (!hasJurisdiction) missingFields.push("jurisdiction");

  return `Generate a conceptual design assessment for this project.

PROJECT CONTEXT:
Address: ${state.address ?? "NOT PROVIDED"}
Jurisdiction: ${state.jurisdiction ?? "NOT PROVIDED"}
Project type: ${state.projectType ?? "NOT PROVIDED"}
Scope summary: ${state.scopeSummary ?? "NOT PROVIDED"}
Style preferences: ${hasStyle ? state.stylePreferences!.join(", ") : "NOT SPECIFIED"}
Budget: ${hasBudget ? `$${state.budgetMax!.toLocaleString()}` : "NOT SPECIFIED"}
Square footage target: ${(state as Record<string, unknown>).squareFootageTarget ? `${((state as Record<string, unknown>).squareFootageTarget as number).toLocaleString()} sq ft` : "NOT SPECIFIED"}

ZONING CONTEXT:
${state.landAnalysis?.zoning ? `Zoning: ${state.landAnalysis.zoning}` : "Zoning: NOT AVAILABLE — note in feasibility constraints"}
${state.landAnalysis?.overlays?.length ? `Active overlays: ${state.landAnalysis.overlays.join(", ")}` : ""}
${state.landAnalysis?.buildableAreaSqFt ? `Buildable area: ${state.landAnalysis.buildableAreaSqFt.toLocaleString()} sq ft` : ""}

EXISTING CONCEPT (if any):
${state.finalOutput?.concept ? JSON.stringify(state.finalOutput.concept) : "No prior concept"}

PRODUCT TIER:
${state.currentProductSku ?? "DESIGN_CONCEPT_VALIDATION"}

${missingFields.length > 0 ? `MISSING DATA:
The following fields are not available: ${missingFields.join(", ")}
For each missing field, make a reasonable assumption and list it in the assumptions array.` : ""}

INSTRUCTIONS:
- Generate 2–3 distinct spatial concept options (unless scope is very simple, then 1–2)
- Complexity score: 0=cosmetic refresh, 100=custom structural architecture required
- If complexityScore >= 80, set architectRequired=true in permitRequirements
- If project involves structural changes, flag stampedPlansRequired=true
- Cost estimates in USD for ${state.jurisdiction ?? "the DMV area"}
- Next step must be a real Kealee product
- Warnings: flag anything the owner MUST know (code restrictions, historic district, structural limits)
- Output ONLY the JSON object, no preamble`;
}

// ─── Agent runner ─────────────────────────────────────────────────────────────

export interface DesignAgentResult {
  success: boolean;
  report: DesignReport | null;
  rawText: string;
  error?: string;
  architectHandoffRequired: boolean;
}

export interface DesignReport {
  designSummary: string;
  projectScale: "SMALL" | "MEDIUM" | "LARGE" | "COMPLEX";
  complexityScore: number;
  spatialConcepts: Array<{
    option: number;
    description: string;
    tradeoffs: string;
  }>;
  materialDirection: string;
  feasibility: {
    score: number;
    notes: string;
    constraints: string[];
    assumptions: string[];
  };
  permitRequirements: {
    permitRequired: boolean;
    permitType: string;
    architectRequired: boolean;
    architectReason: string | null;
    stampedPlansRequired: boolean;
  };
  costDirection: {
    lowEstimate: number | null;
    highEstimate: number | null;
    costDrivers: string[];
  };
  nextStep: {
    productSku: string | null;
    reason: string;
  };
  warnings: string[];
  disclaimer: string;
}

const claude = new ClaudeProvider("claude-sonnet-4-6");

export async function runDesignAgent(
  state: KealeeState,
): Promise<DesignAgentResult> {
  // Business rule check before calling model
  const needsArchitectNow = requiresArchitectHandoff(state);

  if (!claude.isAvailable()) {
    const report = buildFallbackDesignReport(state, needsArchitectNow);
    return {
      success:                  true,
      report,
      rawText:                  JSON.stringify(report),
      architectHandoffRequired: needsArchitectNow,
    };
  }

  const prompt = buildDesignAgentPrompt(state);

  try {
    const result = await claude.generateText({
      systemPrompt: DESIGN_AGENT_SYSTEM_PROMPT,
      prompt,
      maxTokens:    3000,
      temperature:  0.4,  // slightly higher for creative concept generation
      projectId:    state.projectId,
      taskId:       `design_concept_${state.threadId}`,
    });

    const report = parseAgentOutput<DesignReport>(result.text);

    if (!report) {
      return {
        success:                  false,
        report:                   buildFallbackDesignReport(state, needsArchitectNow),
        rawText:                  result.text,
        error:                    "Failed to parse design agent output — fallback used",
        architectHandoffRequired: needsArchitectNow,
      };
    }

    // Enforce business rules on agent output regardless of what it said
    const architectRequired =
      needsArchitectNow ||
      report.permitRequirements?.architectRequired ||
      (report.complexityScore ?? 0) >= 80;

    if (architectRequired && report.permitRequirements) {
      report.permitRequirements.architectRequired = true;
    }

    // Ensure disclaimer is always present
    report.disclaimer = RULE_CONCEPT_NOT_PERMIT_READY;

    return {
      success:                  true,
      report,
      rawText:                  result.text,
      architectHandoffRequired: architectRequired,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success:                  false,
      report:                   buildFallbackDesignReport(state, needsArchitectNow),
      rawText:                  "",
      error:                    `Design agent call failed: ${msg}`,
      architectHandoffRequired: needsArchitectNow,
    };
  }
}

// ─── Fallback report ──────────────────────────────────────────────────────────

function buildFallbackDesignReport(
  state: KealeeState,
  architectRequired: boolean,
): DesignReport {
  return {
    designSummary:   `Concept initiated for ${state.projectType ?? "your project"} at ${state.address ?? "the provided address"}. Full concept will be delivered after review.`,
    projectScale:    "MEDIUM",
    complexityScore: 50,
    spatialConcepts: [
      {
        option:     1,
        description: `Standard ${state.projectType ?? "renovation"} layout optimized for the existing footprint.`,
        tradeoffs:   "Lowest cost and fastest permit path. Limited design flexibility.",
      },
    ],
    materialDirection: "Mid-range finishes appropriate for the project type and budget range.",
    feasibility: {
      score:       70,
      notes:       "Feasibility pending full scope confirmation and zoning review.",
      constraints: state.landAnalysis?.riskFlags ?? [],
      assumptions: ["Standard zoning requirements apply", "No structural changes required"],
    },
    permitRequirements: {
      permitRequired:      true,
      permitType:          "Building permit — type to be confirmed with jurisdiction",
      architectRequired,
      architectReason:     architectRequired ? "Project complexity or type requires licensed architect." : null,
      stampedPlansRequired: architectRequired,
    },
    costDirection: {
      lowEstimate:  state.budgetMin ?? null,
      highEstimate: state.budgetMax ?? null,
      costDrivers:  ["Labor", "Materials", "Permit fees", "Project management"],
    },
    nextStep: {
      productSku: architectRequired ? "ARCHITECT_VIP" : "PERMIT_PACKAGE",
      reason:     architectRequired
        ? "Licensed architect required before permit submission."
        : "Permit package is the next step after concept validation.",
    },
    warnings:   [],
    disclaimer: RULE_CONCEPT_NOT_PERMIT_READY,
  };
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

function parseAgentOutput<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {}
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as T;
  } catch {}
  return null;
}
