/**
 * graphs/support.ts
 *
 * Support Subgraph — role-aware support assistants
 *
 * Routes support requests to the appropriate KeaBot based on user role.
 * HARD RULE: if user is missing required intake data, redirect to structured workflow.
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState } from "../state/kealee-state";
import { supportNeedsWorkflowRedirect } from "../rules/business-rules";
import { emitEvent, buildEvent } from "../events/contracts";

// ─── Node: support triage ─────────────────────────────────────────────────────

async function supportTriage(state: KealeeState): Promise<Partial<KealeeState>> {
  if (supportNeedsWorkflowRedirect(state)) {
    return {
      finalOutput: {
        supportAction: "redirect_to_intake",
        message:
          "To help you best, please start by completing your project intake. " +
          "This gives our team the context needed to assist you.",
        redirectUrl: "/intake",
      },
      phase: "intake" as const,
    };
  }
  return {};
}

// ─── KeaBot dispatchers ───────────────────────────────────────────────────────

async function keaBotOwner(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(
    buildEvent("orchestrator.agent.started", state.threadId, {
      agentRole: "keabot-owner",
    }, { userId: state.userId, projectId: state.projectId })
  );
  return {
    finalOutput: {
      ...state.finalOutput,
      keabotRole: "keabot-owner",
      supportContext: "Homeowner support: project status, payments, contractor issues.",
    },
  };
}

async function keaBotContractor(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(
    buildEvent("orchestrator.agent.started", state.threadId, {
      agentRole: "keabot-gc",
    }, { userId: state.userId })
  );
  return {
    finalOutput: {
      ...state.finalOutput,
      keabotRole: "keabot-gc",
      supportContext: "Contractor support: leads, bids, payments, credentials.",
    },
  };
}

async function keaBotDeveloper(state: KealeeState): Promise<Partial<KealeeState>> {
  return {
    finalOutput: {
      ...state.finalOutput,
      keabotRole: "keabot-developer",
      supportContext: "Developer support: pipeline, feasibility, capital stack.",
    },
  };
}

async function keaBotMarketplace(state: KealeeState): Promise<Partial<KealeeState>> {
  return {
    finalOutput: {
      ...state.finalOutput,
      keabotRole: "keabot-marketplace",
      supportContext: "Marketplace support: matching, bids, profiles.",
    },
  };
}

// ─── Node: create ticket or escalate ──────────────────────────────────────────

async function createTicketOrEscalate(state: KealeeState): Promise<Partial<KealeeState>> {
  const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiBase}/api/v1/support/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
      },
      body: JSON.stringify({
        userId: state.userId,
        projectId: state.projectId,
        role: state.role,
        summary: "Support request from orchestrator",
        context: state.finalOutput,
        source: "orchestrator",
      }),
    });
    const data = res.ok ? ((await res.json()) as { ticketId?: string }) : {};
    await emitEvent(
      buildEvent("orchestrator.escalation.support", state.threadId, {
        agentRole: "SupportBot",
        output: data,
      }, { userId: state.userId })
    );
    return {
      finalOutput: { ...state.finalOutput, ticketId: data.ticketId, ticketCreated: true },
    };
  } catch {
    return {
      finalOutput: { ...state.finalOutput, ticketCreated: false },
    };
  }
}

// ─── Routing ──────────────────────────────────────────────────────────────────

function triageRouter(
  state: KealeeState
): "keabot_owner" | "keabot_contractor" | "keabot_developer" | "keabot_marketplace" | typeof END {
  if (state.phase === "intake") return END; // redirect happened
  switch (state.role) {
    case "homeowner":  return "keabot_owner";
    case "contractor": return "keabot_contractor";
    case "developer":  return "keabot_developer";
    default:           return "keabot_marketplace";
  }
}

// ─── Build graph ──────────────────────────────────────────────────────────────

export function buildSupportGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("support_triage",          supportTriage)
    .addNode("keabot_owner",            keaBotOwner)
    .addNode("keabot_contractor",       keaBotContractor)
    .addNode("keabot_developer",        keaBotDeveloper)
    .addNode("keabot_marketplace",      keaBotMarketplace)
    .addNode("create_ticket_or_escalate", createTicketOrEscalate)
    .addEdge("__start__",              "support_triage")
    .addConditionalEdges("support_triage", triageRouter, {
      keabot_owner:        "keabot_owner",
      keabot_contractor:   "keabot_contractor",
      keabot_developer:    "keabot_developer",
      keabot_marketplace:  "keabot_marketplace",
      [END]: END,
    })
    .addEdge("keabot_owner",       "create_ticket_or_escalate")
    .addEdge("keabot_contractor",  "create_ticket_or_escalate")
    .addEdge("keabot_developer",   "create_ticket_or_escalate")
    .addEdge("keabot_marketplace", "create_ticket_or_escalate")
    .addEdge("create_ticket_or_escalate", END);

  return graph.compile();
}

export const supportGraph = buildSupportGraph();
