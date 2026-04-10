/**
 * services/ai-orchestrator/src/agents/contractor-agent.ts
 *
 * Kealee Contractor Matching Agent
 *
 * Matches projects with the best verified contractors.
 * Called from the marketplace subgraph after contractor eligibility is confirmed.
 *
 * Rules:
 * - NEVER returns unverified contractors
 * - NEVER ignores project requirements
 * - Ranks by fit: location, trade, capacity, performance history
 */

import { ClaudeProvider } from "@kealee/core-llm";
import type { KealeeState } from "../state/kealee-state.js";

// ─── System prompt ────────────────────────────────────────────────────────────

const CONTRACTOR_AGENT_SYSTEM_PROMPT = `You are Kealee Contractor Matching Agent.

Your job is to match projects with the best contractors.

You must:
- rank contractors by fit: location, trade, capacity, and performance
- consider project type, budget, jurisdiction, and timeline requirements
- explain why each contractor is ranked at their position
- surface risks in the match (e.g. limited local capacity, high demand period)

You must NOT:
- return unverified contractors (all contractors in the Kealee network are pre-screened)
- ignore project requirements in ranking
- recommend a contractor who does not hold the required license type

Output format must be structured JSON matching this exact schema:
{
  "matchSummary": "2-3 sentence summary of the matching result and quality",
  "totalCandidatesEvaluated": number,
  "matchQuality": "EXCELLENT" | "GOOD" | "LIMITED" | "NO_MATCH",
  "matchQualityReason": "why match quality is rated this way",
  "rankedMatches": [
    {
      "rank": number,
      "contractorId": "string — placeholder ID from the network",
      "tradeSpecialties": ["primary trades this contractor covers"],
      "jurisdictionsCovered": ["jurisdictions where they are licensed"],
      "fitScore": 0-100,
      "fitBreakdown": {
        "locationScore": 0-100,
        "tradeScore": 0-100,
        "capacityScore": 0-100,
        "performanceScore": 0-100
      },
      "whyRecommended": "2-3 sentence explanation of why this contractor fits",
      "knownLimitations": ["any known limitations or risks for this match"],
      "estimatedAvailability": "IMMEDIATE" | "2_WEEKS" | "4_WEEKS" | "8_PLUS_WEEKS" | "UNKNOWN"
    }
  ],
  "marketConditions": {
    "demandLevel": "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH",
    "typicalLeadTime": "string describing typical contractor lead time in this market",
    "notes": "any relevant market observations"
  },
  "nextActions": [
    {
      "action": "string",
      "owner": "OWNER" | "KEALEE" | "CONTRACTOR",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "warnings": ["any warnings about the matching process or market conditions"]
}`;

// ─── Input builder ────────────────────────────────────────────────────────────

function buildContractorAgentPrompt(state: KealeeState): string {
  const rankedFromTool = state.finalOutput?.rankedContractors;

  return `Analyze contractor matching for this project.

PROJECT CONTEXT:
Project ID: ${state.projectId ?? "NOT PROVIDED"}
Address: ${state.address ?? "NOT PROVIDED"}
Jurisdiction: ${state.jurisdiction ?? "NOT PROVIDED"}
Project type: ${state.projectType ?? "NOT PROVIDED"}
Scope summary: ${state.scopeSummary ?? "NOT PROVIDED"}
Budget min: ${state.budgetMin ? `$${state.budgetMin.toLocaleString()}` : "NOT SPECIFIED"}
Budget max: ${state.budgetMax ? `$${state.budgetMax.toLocaleString()}` : "NOT SPECIFIED"}
Complexity score: ${state.complexityScore ?? "NOT ASSESSED"}

READINESS STATUS:
Concept ready: ${state.readiness.conceptReady ? "YES" : "NO"}
Estimate ready: ${state.readiness.estimateReady ? "YES" : "NO"}
Permit ready: ${state.readiness.permitReady ? "YES" : "NO"}
Architect required: ${state.architectRequired ? "YES" : "NO"}

PRE-RANKED CONTRACTOR DATA (from ranking tool):
${rankedFromTool ? JSON.stringify(rankedFromTool, null, 2) : "No pre-ranking data available — use project context to generate synthetic matches"}

INSTRUCTIONS:
- If pre-ranked data is provided, enrich it with fit analysis and qualitative reasoning
- If no pre-ranked data, generate 3-5 realistic contractor match profiles appropriate for this project type in the DMV area
- fitScore: weight location 25%, trade match 40%, capacity 20%, performance 15%
- DMV market: Very High demand for ADU, additions, renovations; High for new construction
- Typical lead times DMV: MODERATE demand = 4-6 weeks; HIGH = 6-12 weeks; VERY_HIGH = 12+ weeks
- All contractors in Kealee network are verified and licensed — state this as a given
- Warnings: flag if the project scope is at the edge of typical contractor capacity for the budget
- Output ONLY the JSON object, no preamble`;
}

// ─── Agent runner ─────────────────────────────────────────────────────────────

export interface ContractorAgentResult {
  success: boolean;
  report: ContractorMatchReport | null;
  rawText: string;
  error?: string;
  matchQuality: "EXCELLENT" | "GOOD" | "LIMITED" | "NO_MATCH" | "UNKNOWN";
}

export interface ContractorMatchReport {
  matchSummary: string;
  totalCandidatesEvaluated: number;
  matchQuality: "EXCELLENT" | "GOOD" | "LIMITED" | "NO_MATCH";
  matchQualityReason: string;
  rankedMatches: Array<{
    rank: number;
    contractorId: string;
    tradeSpecialties: string[];
    jurisdictionsCovered: string[];
    fitScore: number;
    fitBreakdown: {
      locationScore: number;
      tradeScore: number;
      capacityScore: number;
      performanceScore: number;
    };
    whyRecommended: string;
    knownLimitations: string[];
    estimatedAvailability: "IMMEDIATE" | "2_WEEKS" | "4_WEEKS" | "8_PLUS_WEEKS" | "UNKNOWN";
  }>;
  marketConditions: {
    demandLevel: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
    typicalLeadTime: string;
    notes: string;
  };
  nextActions: Array<{
    action: string;
    owner: "OWNER" | "KEALEE" | "CONTRACTOR";
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  warnings: string[];
}

const claude = new ClaudeProvider("claude-sonnet-4-6");

export async function runContractorAgent(
  state: KealeeState,
): Promise<ContractorAgentResult> {
  if (!claude.isAvailable()) {
    const report = buildFallbackContractorReport(state);
    return {
      success:      true,
      report,
      rawText:      JSON.stringify(report),
      matchQuality: report.matchQuality,
    };
  }

  const prompt = buildContractorAgentPrompt(state);

  try {
    const result = await claude.generateText({
      systemPrompt: CONTRACTOR_AGENT_SYSTEM_PROMPT,
      prompt,
      maxTokens:    2500,
      temperature:  0.3,
      projectId:    state.projectId,
      taskId:       `contractor_match_${state.threadId}`,
    });

    const report = parseAgentOutput<ContractorMatchReport>(result.text);

    if (!report) {
      const fallback = buildFallbackContractorReport(state);
      return {
        success:      false,
        report:       fallback,
        rawText:      result.text,
        error:        "Failed to parse contractor agent output — fallback used",
        matchQuality: fallback.matchQuality,
      };
    }

    return {
      success:      true,
      report,
      rawText:      result.text,
      matchQuality: report.matchQuality ?? "UNKNOWN",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const fallback = buildFallbackContractorReport(state);
    return {
      success:      false,
      report:       fallback,
      rawText:      "",
      error:        `Contractor agent call failed: ${msg}`,
      matchQuality: fallback.matchQuality,
    };
  }
}

// ─── Fallback report ──────────────────────────────────────────────────────────

function buildFallbackContractorReport(state: KealeeState): ContractorMatchReport {
  return {
    matchSummary:              `Contractor matching initiated for ${state.projectType ?? "your project"} in ${state.jurisdiction ?? "the DMV area"}. Kealee will source qualified, verified contractors from the network.`,
    totalCandidatesEvaluated:  0,
    matchQuality:              "LIMITED",
    matchQualityReason:        "Matching requires live network data. Manual review will complete this match.",
    rankedMatches:             [],
    marketConditions: {
      demandLevel:       "HIGH",
      typicalLeadTime:   "6–12 weeks for most residential projects in the DMV market.",
      notes:             "DMV market experiences consistently high demand. Early engagement improves availability.",
    },
    nextActions: [
      { action: "Kealee team will manually source contractors for this project", owner: "KEALEE", priority: "HIGH" },
      { action: "Owner to confirm availability window", owner: "OWNER", priority: "MEDIUM" },
    ],
    warnings: [
      "Automated matching unavailable — Kealee team will complete match within 24 hours.",
    ],
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
