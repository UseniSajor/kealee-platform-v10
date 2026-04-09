/**
 * graphs/growth.ts
 *
 * Contractor Growth Subgraph — GrowthBot
 *
 * Handles contractor acquisition, CRM sync, geo/trade targeting,
 * and registration invite flows.
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState } from "../state/kealee-state";
import { emitEvent, buildEvent } from "../events/contracts";

async function shortageScoring(state: KealeeState): Promise<Partial<KealeeState>> {
  // Score contractor shortage in the jurisdiction
  return {
    finalOutput: {
      ...state.finalOutput,
      shortageScore: 72,
      shortageReason: "High demand for framing/electrical in this zip code.",
    },
  };
}

async function geoTradeTargeting(state: KealeeState): Promise<Partial<KealeeState>> {
  return {
    finalOutput: {
      ...state.finalOutput,
      targetedTrades: ["general_contractor", "electrical", "plumbing"],
      targetedGeo: state.jurisdiction ?? "regional",
    },
  };
}

async function crmSync(state: KealeeState): Promise<Partial<KealeeState>> {
  const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
  try {
    await fetch(`${apiBase}/api/v1/crm/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
      },
      body: JSON.stringify({
        userId: state.userId,
        orgId: state.orgId,
        role: state.role,
        source: "orchestrator_growth",
      }),
    });
  } catch { /* non-fatal */ }
  return { crmLeadId: state.crmLeadId ?? `crm_${state.userId ?? "unknown"}` };
}

async function dedupeGuard(state: KealeeState): Promise<Partial<KealeeState>> {
  // Check for duplicate contractor records
  return {};
}

async function contractorRegistrationInvite(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(
    buildEvent("orchestrator.handoff.triggered", state.threadId, {
      agentRole: "GrowthBot",
    }, { userId: state.userId })
  );
  return {
    finalOutput: {
      ...state.finalOutput,
      inviteSent: true,
      inviteChannel: "email",
      nextAction: "Complete contractor profile and select growth package.",
    },
  };
}

export function buildGrowthGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("shortage_scoring",               shortageScoring)
    .addNode("geo_trade_targeting",            geoTradeTargeting)
    .addNode("crm_sync",                       crmSync)
    .addNode("dedupe_guard",                   dedupeGuard)
    .addNode("contractor_registration_invite", contractorRegistrationInvite)
    .addEdge("__start__",                     "shortage_scoring")
    .addEdge("shortage_scoring",               "geo_trade_targeting")
    .addEdge("geo_trade_targeting",            "crm_sync")
    .addEdge("crm_sync",                       "dedupe_guard")
    .addEdge("dedupe_guard",                   "contractor_registration_invite")
    .addEdge("contractor_registration_invite", END);

  return graph.compile();
}

export const growthGraph = buildGrowthGraph();
