/**
 * graphs/marketplace.ts
 *
 * Marketplace Subgraph
 *
 * Routes contractor matching for owner-side requests.
 * Preserves contractor-side growth/acquisition functionality.
 *
 * HARD RULE: contractor_profile_load only proceeds if contractorReady = true.
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState } from "../state/kealee-state";
import { rankContractorsTool, assignLeadTool } from "../tools/contractor-ranking";
import { sendEmailNotificationTool } from "../tools/notifications";
import { isContractorMatchAllowed } from "../rules/business-rules";
import { emitEvent, buildEvent } from "../events/contracts";

// ─── Node: contractor eligibility check ───────────────────────────────────────

async function contractorEligibilityCheck(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!isContractorMatchAllowed(state.readiness)) {
    return {
      blockers: [
        ...state.blockers,
        "Contractor matching requires: concept, estimate, and permit to be complete or waived. " +
        "Complete the required steps before requesting contractor matching.",
      ],
      phase: "readiness_review" as const,
    };
  }
  return {};
}

// ─── Node: contractor ranker ──────────────────────────────────────────────────

async function contractorRanker(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!state.projectId || !state.jurisdiction) {
    return { blockers: [...state.blockers, "Project ID and jurisdiction required for contractor ranking."] };
  }

  const result = await rankContractorsTool.invoke({
    projectId: state.projectId,
    projectType: state.projectType ?? "general",
    jurisdiction: state.jurisdiction,
    budgetMin: state.budgetMin,
    budgetMax: state.budgetMax,
    limit: 5,
  });

  await emitEvent(
    buildEvent("orchestrator.agent.started", state.threadId, {
      agentRole: "ContractorMatchBot",
    }, { projectId: state.projectId })
  );

  return {
    toolResults: [
      { tool: "rank_contractors", success: true, data: result, calledAt: new Date().toISOString() },
    ],
    finalOutput: { ...state.finalOutput, rankedContractors: result },
  };
}

// ─── Node: lead assignment ────────────────────────────────────────────────────

async function leadAssignment(state: KealeeState): Promise<Partial<KealeeState>> {
  // Auto-assignment only when top contractor is clearly qualified
  // In practice, this requires an owner selection — stub for now
  return {
    assignmentStatus: "pending_owner_selection",
    phase: "contractor_match" as const,
  };
}

// ─── Node: bid invite ─────────────────────────────────────────────────────────

async function bidInvite(state: KealeeState): Promise<Partial<KealeeState>> {
  const contractors = (state.finalOutput?.rankedContractors as unknown[]) ?? [];
  if (!Array.isArray(contractors) || contractors.length === 0) return {};

  // Send invitations to top 3 ranked contractors
  // TODO: loop through and call assignLeadTool for each
  return {
    finalOutput: {
      ...state.finalOutput,
      bidInvitesSent: contractors.length,
    },
  };
}

// ─── Node: owner match summary ────────────────────────────────────────────────

async function ownerMatchSummary(state: KealeeState): Promise<Partial<KealeeState>> {
  return {
    readiness: { ...state.readiness, contractorReady: true },
    finalOutput: {
      ...state.finalOutput,
      matchSummary: {
        status: "matches_ready",
        count: ((state.finalOutput?.rankedContractors as unknown[]) ?? []).length,
        nextAction: "Review contractor profiles and select your preferred match.",
      },
    },
  };
}

// ─── Routing ──────────────────────────────────────────────────────────────────

function afterEligibilityCheck(
  state: KealeeState
): "contractor_ranker" | typeof END {
  if (state.blockers.some((b) => b.includes("Contractor matching requires"))) return END;
  return "contractor_ranker";
}

// ─── Build graph ──────────────────────────────────────────────────────────────

export function buildMarketplaceGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("contractor_eligibility_check", contractorEligibilityCheck)
    .addNode("contractor_ranker",            contractorRanker)
    .addNode("lead_assignment",              leadAssignment)
    .addNode("bid_invite",                   bidInvite)
    .addNode("owner_match_summary",          ownerMatchSummary)
    .addEdge("__start__",                   "contractor_eligibility_check")
    .addConditionalEdges("contractor_eligibility_check", afterEligibilityCheck, {
      contractor_ranker: "contractor_ranker",
      [END]: END,
    })
    .addEdge("contractor_ranker",  "lead_assignment")
    .addEdge("lead_assignment",    "bid_invite")
    .addEdge("bid_invite",         "owner_match_summary")
    .addEdge("owner_match_summary", END);

  return graph.compile();
}

export const marketplaceGraph = buildMarketplaceGraph();
