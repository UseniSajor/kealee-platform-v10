/**
 * graphs/construction.ts
 *
 * Construction Execution Subgraph
 *
 * Manages the active build phase:
 * milestone planning → payment/escrow → project monitoring
 * → inspection readiness → payout readiness → closeout routing
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState } from "../state/kealee-state";
import { emitEvent, buildEvent } from "../events/contracts";

// ─── Node: create milestone plan ──────────────────────────────────────────────

async function createMilestonePlan(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!state.projectId) {
    return { blockers: [...state.blockers, "Project ID required to create milestone plan."] };
  }

  const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiBase}/api/v1/projects/${state.projectId}/milestones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
      },
      body: JSON.stringify({
        projectType: state.projectType,
        budgetMin: state.budgetMin,
        budgetMax: state.budgetMax,
        source: "orchestrator",
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { milestones?: unknown[] };
      return {
        finalOutput: {
          ...state.finalOutput,
          milestones: data.milestones,
        },
        phase: "construction" as const,
      };
    }
  } catch {
    // Non-fatal — continue
  }

  return { phase: "construction" as const };
}

// ─── Node: initialize payment and escrow ──────────────────────────────────────

async function initializePaymentAndEscrow(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!state.projectId) return {};

  await emitEvent(
    buildEvent("orchestrator.sla.started", state.threadId, {
      agentRole: "PaymentEscrow",
    }, { projectId: state.projectId })
  );

  const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiBase}/api/v1/escrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
      },
      body: JSON.stringify({ projectId: state.projectId }),
    });
    if (res.ok) {
      const data = (await res.json()) as { escrowId?: string };
      return {
        finalOutput: { ...state.finalOutput, escrowId: data.escrowId },
        readiness: { ...state.readiness, constructionReady: true },
      };
    }
  } catch {
    // Non-fatal
  }

  return { readiness: { ...state.readiness, constructionReady: true } };
}

// ─── Node: project monitor ────────────────────────────────────────────────────

async function projectMonitor(state: KealeeState): Promise<Partial<KealeeState>> {
  // Polling check for project health — would be triggered by worker on schedule
  return {
    finalOutput: {
      ...state.finalOutput,
      monitorStatus: "active",
      lastChecked: new Date().toISOString(),
    },
  };
}

// ─── Node: inspection readiness ───────────────────────────────────────────────

async function inspectionReadiness(state: KealeeState): Promise<Partial<KealeeState>> {
  // Check if inspection is ready to be scheduled
  return {
    finalOutput: {
      ...state.finalOutput,
      inspectionStatus: "pending_milestone_completion",
    },
  };
}

// ─── Node: payout readiness ───────────────────────────────────────────────────

async function payoutReadiness(state: KealeeState): Promise<Partial<KealeeState>> {
  // Check if milestone evidence has been accepted for payout release
  return {
    readiness: { ...state.readiness, payoutReady: false }, // set true by evidence gate
    finalOutput: {
      ...state.finalOutput,
      payoutStatus: "awaiting_milestone_evidence",
    },
  };
}

// ─── Node: closeout router ────────────────────────────────────────────────────

async function closeoutRouter(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!state.readiness.payoutReady) {
    return { phase: "construction" as const };
  }

  await emitEvent(
    buildEvent("orchestrator.sla.completed", state.threadId, {
      agentRole: "CloseoutRouter",
    }, { projectId: state.projectId })
  );

  return {
    phase: "closeout" as const,
    finalOutput: {
      ...state.finalOutput,
      closeoutStatus: "ready",
    },
  };
}

// ─── Routing ──────────────────────────────────────────────────────────────────

function constructionReadyRouter(
  state: KealeeState
): "initialize_payment_and_escrow" | typeof END {
  if (!state.readiness.constructionReady && state.phase !== "construction") return END;
  return "initialize_payment_and_escrow";
}

// ─── Build graph ──────────────────────────────────────────────────────────────

export function buildConstructionGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("create_milestone_plan",       createMilestonePlan)
    .addNode("initialize_payment_and_escrow", initializePaymentAndEscrow)
    .addNode("project_monitor",             projectMonitor)
    .addNode("inspection_readiness",        inspectionReadiness)
    .addNode("payout_readiness",            payoutReadiness)
    .addNode("closeout_router",             closeoutRouter)
    .addEdge("__start__",                  "create_milestone_plan")
    .addConditionalEdges("create_milestone_plan", constructionReadyRouter, {
      initialize_payment_and_escrow: "initialize_payment_and_escrow",
      [END]: END,
    })
    .addEdge("initialize_payment_and_escrow", "project_monitor")
    .addEdge("project_monitor",             "inspection_readiness")
    .addEdge("inspection_readiness",        "payout_readiness")
    .addEdge("payout_readiness",            "closeout_router")
    .addEdge("closeout_router",             END);

  return graph.compile();
}

export const constructionGraph = buildConstructionGraph();
