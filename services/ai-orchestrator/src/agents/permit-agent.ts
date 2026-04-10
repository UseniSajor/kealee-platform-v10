/**
 * services/ai-orchestrator/src/agents/permit-agent.ts
 *
 * Kealee Permit Agent
 *
 * Determines the permit path and executes permit workflows.
 * Called from the delivery subgraph when the product is a permit package.
 *
 * Rules:
 * - NEVER guarantees permit approval
 * - NEVER skips required documents
 * - Always recommends the correct Kealee permit service tier
 * - Flags all blockers explicitly
 */

import { ClaudeProvider } from "@kealee/core-llm";
import type { KealeeState } from "../state/kealee-state.js";
import { RULE_PERMIT_EXECUTION } from "../rules/business-rules.js";
import { buildRAGContext } from "../retrieval/rag-retriever.js";

// ─── System prompt ────────────────────────────────────────────────────────────

const PERMIT_AGENT_SYSTEM_PROMPT = `You are Kealee Permit Agent.

Your job is to determine the permit path and execute permit workflows.

You must:
- identify required permits for the project type and jurisdiction
- identify missing documents the owner must provide
- estimate realistic processing timeline
- flag all blockers explicitly

You must NOT:
- guarantee permit approval
- skip required documents
- provide jurisdiction-specific legal interpretations

Always recommend the correct permit service tier.

Output format must be structured JSON matching this exact schema:
{
  "permitSummary": "2-3 sentence plain-language description of the permit path",
  "jurisdiction": "string — confirmed jurisdiction",
  "permitRequired": true | false,
  "permitTypes": [
    {
      "type": "string — permit category (e.g. Building Permit, Zoning Approval, Trade Permit)",
      "required": true | false,
      "reason": "why this permit is required or not"
    }
  ],
  "requiredDocuments": [
    {
      "document": "string — document name",
      "status": "required" | "likely_required" | "optional",
      "ownerAction": "what the owner must do to obtain or provide this document"
    }
  ],
  "missingDocuments": ["list of documents not yet provided that are required"],
  "blockers": [
    {
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "description": "string",
      "resolution": "what must happen to unblock"
    }
  ],
  "timeline": {
    "estimatedWeeks": number | null,
    "phases": [
      {
        "phase": "string — phase name",
        "durationWeeks": number,
        "description": "what happens in this phase"
      }
    ],
    "factors": ["factors that could affect the timeline"]
  },
  "complexity": "SIMPLE" | "MODERATE" | "COMPLEX",
  "recommendedServiceTier": "PERMIT_SIMPLE" | "PERMIT_PACKAGE" | "PERMIT_COORDINATION" | "PERMIT_EXPEDITING",
  "tierReason": "why this service tier is recommended",
  "nextActions": [
    {
      "action": "string — specific action",
      "owner": "OWNER" | "KEALEE" | "CONTRACTOR" | "JURISDICTION",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "warnings": ["critical warnings the owner must know"],
  "disclaimer": "Permit approvals are issued solely by the relevant jurisdiction. Kealee coordinates the process but cannot guarantee approval timelines or outcomes."
}`;

// ─── Input builder ────────────────────────────────────────────────────────────

function buildPermitAgentPrompt(state: KealeeState): string {
  const hasConcept    = Boolean(state.finalOutput?.concept);
  const hasEstimate   = state.readiness.estimateReady;
  const hasArchPlans  = state.architectRequired === false;

  const missingDocs: string[] = [];
  if (!hasConcept)   missingDocs.push("design concept or drawings");
  if (!hasEstimate)  missingDocs.push("cost estimate");

  return `Analyze the permit path for this project.

PROJECT CONTEXT:
Address: ${state.address ?? "NOT PROVIDED"}
Jurisdiction: ${state.jurisdiction ?? "NOT PROVIDED"}
Project type: ${state.projectType ?? "NOT PROVIDED"}
Scope summary: ${state.scopeSummary ?? "NOT PROVIDED"}
Budget: ${state.budgetMax ? `$${state.budgetMax.toLocaleString()}` : "NOT SPECIFIED"}
Complexity score: ${state.complexityScore ?? "NOT ASSESSED"}

READINESS STATUS:
Concept ready: ${hasConcept ? "YES" : "NO"}
Estimate ready: ${hasEstimate ? "YES" : "NO"}
Architect required: ${state.architectRequired ? "YES" : state.architectRequired === false ? "NO" : "NOT DETERMINED"}
Architect plans available: ${hasArchPlans ? "YES" : "UNKNOWN"}

ZONING CONTEXT:
${state.landAnalysis?.zoning ? `Zoning: ${state.landAnalysis.zoning}` : "Zoning: NOT AVAILABLE"}
${state.landAnalysis?.overlays?.length ? `Active overlays: ${state.landAnalysis.overlays.join(", ")}` : "No overlays on record"}

CURRENT PRODUCT SKU:
${state.currentProductSku ?? "PERMIT_PACKAGE"}

${missingDocs.length > 0 ? `MISSING FROM OWNER:
The following items are not yet provided: ${missingDocs.join(", ")}
Include these in missingDocuments and blockers if required for permit submission.` : ""}

INSTRUCTIONS:
- Identify ALL permit types required for this project type in this jurisdiction
- For DMV area: DC uses DCRA, Montgomery County uses their e-permits portal, Fairfax County uses CSS, Arlington uses Online Building Center
- Complexity SIMPLE: cosmetic/trade only; MODERATE: structural or addition; COMPLEX: new construction, ADU, historic district
- Timeline must account for jurisdiction processing time (DMV: 4-8 weeks simple, 8-24 weeks complex)
- recommendedServiceTier must be a real Kealee SKU
- Warnings: flag anything that could cause rejection (missing docs, historic overlays, zoning non-conformance)

REFERENCE DATA (from Kealee RAG — use to calibrate permit requirements and timelines):
${buildRAGContext({
    jurisdiction: state.jurisdiction,
    projectType:  state.projectType ?? undefined,
    stage:        "permit",
    topic:        "permit_process",
    k:            4,
  }).combined || "No reference data available for this jurisdiction."}

- Output ONLY the JSON object, no preamble`;
}

// ─── Agent runner ─────────────────────────────────────────────────────────────

export interface PermitAgentResult {
  success: boolean;
  report: PermitReport | null;
  rawText: string;
  error?: string;
  hasBlockers: boolean;
  recommendedTier: string;
}

export interface PermitReport {
  permitSummary: string;
  jurisdiction: string;
  permitRequired: boolean;
  permitTypes: Array<{
    type: string;
    required: boolean;
    reason: string;
  }>;
  requiredDocuments: Array<{
    document: string;
    status: "required" | "likely_required" | "optional";
    ownerAction: string;
  }>;
  missingDocuments: string[];
  blockers: Array<{
    severity: "HIGH" | "MEDIUM" | "LOW";
    description: string;
    resolution: string;
  }>;
  timeline: {
    estimatedWeeks: number | null;
    phases: Array<{
      phase: string;
      durationWeeks: number;
      description: string;
    }>;
    factors: string[];
  };
  complexity: "SIMPLE" | "MODERATE" | "COMPLEX";
  recommendedServiceTier: string;
  tierReason: string;
  nextActions: Array<{
    action: string;
    owner: "OWNER" | "KEALEE" | "CONTRACTOR" | "JURISDICTION";
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  warnings: string[];
  disclaimer: string;
}

const claude = new ClaudeProvider("claude-sonnet-4-6");

export async function runPermitAgent(
  state: KealeeState,
): Promise<PermitAgentResult> {
  const defaultTier = state.currentProductSku ?? "PERMIT_PACKAGE";

  if (!claude.isAvailable()) {
    const report = buildFallbackPermitReport(state);
    return {
      success:         true,
      report,
      rawText:         JSON.stringify(report),
      hasBlockers:     report.blockers.some((b) => b.severity === "HIGH"),
      recommendedTier: report.recommendedServiceTier,
    };
  }

  const prompt = buildPermitAgentPrompt(state);

  try {
    const result = await claude.generateText({
      systemPrompt: PERMIT_AGENT_SYSTEM_PROMPT,
      prompt,
      maxTokens:    2500,
      temperature:  0.2,
      projectId:    state.projectId,
      taskId:       `permit_analysis_${state.threadId}`,
    });

    const report = parseAgentOutput<PermitReport>(result.text);

    if (!report) {
      const fallback = buildFallbackPermitReport(state);
      return {
        success:         false,
        report:          fallback,
        rawText:         result.text,
        error:           "Failed to parse permit agent output — fallback used",
        hasBlockers:     fallback.blockers.some((b) => b.severity === "HIGH"),
        recommendedTier: fallback.recommendedServiceTier,
      };
    }

    // Always enforce disclaimer
    report.disclaimer = RULE_PERMIT_EXECUTION;

    const hasBlockers = (report.blockers ?? []).some((b) => b.severity === "HIGH");

    return {
      success:         true,
      report,
      rawText:         result.text,
      hasBlockers,
      recommendedTier: report.recommendedServiceTier ?? defaultTier,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const fallback = buildFallbackPermitReport(state);
    return {
      success:         false,
      report:          fallback,
      rawText:         "",
      error:           `Permit agent call failed: ${msg}`,
      hasBlockers:     fallback.blockers.some((b) => b.severity === "HIGH"),
      recommendedTier: fallback.recommendedServiceTier,
    };
  }
}

// ─── Fallback report ──────────────────────────────────────────────────────────

function buildFallbackPermitReport(state: KealeeState): PermitReport {
  const sku = state.currentProductSku ?? "PERMIT_PACKAGE";
  const isComplex = (state.complexityScore ?? 0) >= 60 || state.architectRequired;

  return {
    permitSummary:   `Permit analysis initiated for ${state.projectType ?? "your project"} in ${state.jurisdiction ?? "the provided jurisdiction"}. Full permit path will be confirmed after document review.`,
    jurisdiction:    state.jurisdiction ?? "To be confirmed",
    permitRequired:  true,
    permitTypes: [
      {
        type:     "Building Permit",
        required: true,
        reason:   "Required for most construction and renovation projects in DMV jurisdictions.",
      },
    ],
    requiredDocuments: [
      {
        document:    "Site plan or survey",
        status:      "required",
        ownerAction: "Obtain from surveyor or provide existing survey.",
      },
      {
        document:    "Scope of work description",
        status:      "required",
        ownerAction: "Provide detailed written description of all work to be performed.",
      },
    ],
    missingDocuments: ["site plan", "scope of work"],
    blockers: isComplex
      ? [{ severity: "MEDIUM", description: "Full document review required before permit submission.", resolution: "Provide all required documents to Kealee permit team." }]
      : [],
    timeline: {
      estimatedWeeks: isComplex ? 12 : 6,
      phases: [
        { phase: "Document preparation", durationWeeks: 2, description: "Gather and prepare all required permit documents." },
        { phase: "Jurisdiction submission", durationWeeks: isComplex ? 6 : 3, description: "Submit permit application to jurisdiction for review." },
        { phase: "Review and corrections", durationWeeks: isComplex ? 4 : 1, description: "Respond to any comments or corrections from reviewer." },
      ],
      factors: ["Jurisdiction review backlog", "Completeness of initial submission", "Zoning compliance"],
    },
    complexity:              isComplex ? "COMPLEX" : "MODERATE",
    recommendedServiceTier:  sku as string,
    tierReason:              "Based on project type and scope.",
    nextActions: [
      { action: "Provide site plan and survey", owner: "OWNER", priority: "HIGH" },
      { action: "Confirm jurisdiction and zoning compliance", owner: "KEALEE", priority: "HIGH" },
    ],
    warnings:    ["Permit approval timelines vary by jurisdiction and current processing volumes."],
    disclaimer:  RULE_PERMIT_EXECUTION,
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
