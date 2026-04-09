/**
 * graphs/supervisor.ts
 *
 * Top-level Supervisor Graph for the Kealee Platform.
 *
 * Responsibilities:
 * 1. Load project/user context
 * 2. Classify role and intent if missing
 * 3. Route to the appropriate subgraph using EXPLICIT business rules
 * 4. Never relies solely on a free-form LLM loop for business decisions
 *
 * Routing is driven by:
 * - role, intent, phase
 * - readiness flags
 * - payment_status
 * - permit_required, architect_required
 * - blockers
 *
 * Subgraphs are invoked as compiled LangGraph graphs via addNode().
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState } from "../state/kealee-state";
import { routeToSubgraph, type SubgraphName } from "../routing/supervisor-routing";
import { detectBlockers } from "../rules/business-rules";
import { getCheckpointer, buildThreadConfig } from "../memory/checkpointer";
import { emitEvent, buildEvent } from "../events/contracts";

// Subgraph imports
import { salesIntakeGraph }      from "./sales-intake";
import { landFeasibilityGraph }  from "./land-feasibility";
import { deliveryGraph }         from "./delivery";
import { marketplaceGraph }      from "./marketplace";
import { constructionGraph }     from "./construction";
import { supportGraph }          from "./support";
import { growthGraph }           from "./growth";
import { developerGraph }        from "./developer";

// ─── Node: load context ───────────────────────────────────────────────────────

async function loadContext(state: KealeeState): Promise<Partial<KealeeState>> {
  // Refresh derived readiness flags
  const blockers = detectBlockers(state);
  return { blockers };
}

// ─── Node: route decision ─────────────────────────────────────────────────────

async function routeDecision(state: KealeeState): Promise<Partial<KealeeState>> {
  // This is a pure pass-through — the routing happens via conditional edge
  return {};
}

// ─── Node wrappers for subgraphs ──────────────────────────────────────────────
// Each wrapper invokes the compiled subgraph and merges state

async function runSalesIntake(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(buildEvent("orchestrator.subgraph.started", state.threadId, { subgraph: "sales_intake" }, { projectId: state.projectId }));
  const result = await salesIntakeGraph.invoke(state, buildThreadConfig(`${state.threadId}_sales`));
  await emitEvent(buildEvent("orchestrator.subgraph.completed", state.threadId, { subgraph: "sales_intake" }, { projectId: state.projectId }));
  return result;
}

async function runLandFeasibility(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(buildEvent("orchestrator.subgraph.started", state.threadId, { subgraph: "land_feasibility" }, { projectId: state.projectId }));
  const result = await landFeasibilityGraph.invoke(state, buildThreadConfig(`${state.threadId}_land`));
  await emitEvent(buildEvent("orchestrator.subgraph.completed", state.threadId, { subgraph: "land_feasibility" }, { projectId: state.projectId }));
  return result;
}

async function runDelivery(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(buildEvent("orchestrator.subgraph.started", state.threadId, { subgraph: "delivery" }, { projectId: state.projectId }));
  const result = await deliveryGraph.invoke(state, buildThreadConfig(`${state.threadId}_delivery`));
  await emitEvent(buildEvent("orchestrator.subgraph.completed", state.threadId, { subgraph: "delivery" }, { projectId: state.projectId }));
  return result;
}

async function runMarketplace(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(buildEvent("orchestrator.subgraph.started", state.threadId, { subgraph: "marketplace" }, { projectId: state.projectId }));
  const result = await marketplaceGraph.invoke(state, buildThreadConfig(`${state.threadId}_marketplace`));
  await emitEvent(buildEvent("orchestrator.subgraph.completed", state.threadId, { subgraph: "marketplace" }, { projectId: state.projectId }));
  return result;
}

async function runConstruction(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(buildEvent("orchestrator.subgraph.started", state.threadId, { subgraph: "construction" }, { projectId: state.projectId }));
  const result = await constructionGraph.invoke(state, buildThreadConfig(`${state.threadId}_construction`));
  await emitEvent(buildEvent("orchestrator.subgraph.completed", state.threadId, { subgraph: "construction" }, { projectId: state.projectId }));
  return result;
}

async function runSupport(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(buildEvent("orchestrator.subgraph.started", state.threadId, { subgraph: "support" }, { projectId: state.projectId }));
  const result = await supportGraph.invoke(state, buildThreadConfig(`${state.threadId}_support`));
  await emitEvent(buildEvent("orchestrator.subgraph.completed", state.threadId, { subgraph: "support" }, { projectId: state.projectId }));
  return result;
}

async function runGrowth(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(buildEvent("orchestrator.subgraph.started", state.threadId, { subgraph: "growth" }, { projectId: state.projectId }));
  const result = await growthGraph.invoke(state, buildThreadConfig(`${state.threadId}_growth`));
  await emitEvent(buildEvent("orchestrator.subgraph.completed", state.threadId, { subgraph: "growth" }, { projectId: state.projectId }));
  return result;
}

async function runDeveloper(state: KealeeState): Promise<Partial<KealeeState>> {
  await emitEvent(buildEvent("orchestrator.subgraph.started", state.threadId, { subgraph: "developer" }, { projectId: state.projectId }));
  const result = await developerGraph.invoke(state, buildThreadConfig(`${state.threadId}_developer`));
  await emitEvent(buildEvent("orchestrator.subgraph.completed", state.threadId, { subgraph: "developer" }, { projectId: state.projectId }));
  return result;
}

// ─── Supervisor routing edge ──────────────────────────────────────────────────

function supervisorConditionalRoute(state: KealeeState): SubgraphName {
  const dest = routeToSubgraph(state);

  // Emit route decision event
  void emitEvent(
    buildEvent("orchestrator.route.decided", state.threadId, {
      fromPhase: state.phase,
      toSubgraph: dest,
      reason: `Routing ${state.role}/${state.intent} → ${dest}`,
    }, { userId: state.userId, projectId: state.projectId })
  );

  return dest;
}

// ─── Build supervisor graph ───────────────────────────────────────────────────

export function buildSupervisorGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("load_context",    loadContext)
    .addNode("route_decision",  routeDecision)
    // Subgraph nodes
    .addNode("sales_intake",    runSalesIntake)
    .addNode("land_feasibility",runLandFeasibility)
    .addNode("delivery",        runDelivery)
    .addNode("marketplace",     runMarketplace)
    .addNode("construction",    runConstruction)
    .addNode("support",         runSupport)
    .addNode("growth",          runGrowth)
    .addNode("developer",       runDeveloper)
    // Edges
    .addEdge("__start__",       "load_context")
    .addEdge("load_context",    "route_decision")
    .addConditionalEdges("route_decision", supervisorConditionalRoute, {
      sales_intake:    "sales_intake",
      land_feasibility:"land_feasibility",
      delivery:        "delivery",
      marketplace:     "marketplace",
      construction:    "construction",
      support:         "support",
      growth:          "growth",
      developer:       "developer",
      end:             END,
    })
    // All subgraphs terminate to END after completion
    .addEdge("sales_intake",    END)
    .addEdge("land_feasibility",END)
    .addEdge("delivery",        END)
    .addEdge("marketplace",     END)
    .addEdge("construction",    END)
    .addEdge("support",         END)
    .addEdge("growth",          END)
    .addEdge("developer",       END);

  return graph.compile({ checkpointer: getCheckpointer() });
}

export const supervisorGraph = buildSupervisorGraph();

// ─── Public run API ───────────────────────────────────────────────────────────

export interface OrchestratorRunInput {
  threadId: string;
  userId?: string;
  orgId?: string;
  role?: KealeeState["role"];
  intent?: KealeeState["intent"];
  phase?: KealeeState["phase"];
  projectId?: string;
  address?: string;
  projectType?: string;
  currentProductSku?: KealeeState["currentProductSku"];
  paymentStatus?: KealeeState["paymentStatus"];
  /** Partial readiness overrides */
  readiness?: Partial<KealeeState["readiness"]>;
  /** Any additional state fields to inject */
  extra?: Partial<KealeeState>;
}

export interface OrchestratorRunResult {
  threadId: string;
  phase: KealeeState["phase"];
  recommendedNextProduct: KealeeState["recommendedNextProduct"];
  upsellCandidates: KealeeState["upsellCandidates"];
  checkoutUrl?: string;
  readiness: KealeeState["readiness"];
  landAnalysis?: KealeeState["landAnalysis"];
  blockers: KealeeState["blockers"];
  risks: KealeeState["risks"];
  finalOutput?: KealeeState["finalOutput"];
  activeSubgraph?: string;
  routeReason?: string;
}

export async function runOrchestrator(
  input: OrchestratorRunInput
): Promise<OrchestratorRunResult> {
  const initialState: Partial<KealeeState> = {
    threadId: input.threadId,
    userId: input.userId,
    orgId: input.orgId,
    role: input.role ?? "unknown",
    intent: input.intent ?? "unknown",
    phase: input.phase ?? "discovery",
    projectId: input.projectId,
    address: input.address,
    projectType: input.projectType,
    currentProductSku: input.currentProductSku,
    paymentStatus: input.paymentStatus ?? "none",
    ...(input.readiness
      ? {
          readiness: {
            landReady: false,
            conceptReady: false,
            estimateReady: false,
            permitReady: false,
            contractorReady: false,
            constructionReady: false,
            payoutReady: false,
            ...input.readiness,
          },
        }
      : {}),
    ...input.extra,
  };

  const result = await supervisorGraph.invoke(
    initialState,
    buildThreadConfig(input.threadId)
  );

  return {
    threadId: result.threadId ?? input.threadId,
    phase: result.phase,
    recommendedNextProduct: result.recommendedNextProduct,
    upsellCandidates: result.upsellCandidates ?? [],
    checkoutUrl: result.checkoutUrl,
    readiness: result.readiness,
    landAnalysis: result.landAnalysis,
    blockers: result.blockers ?? [],
    risks: result.risks ?? [],
    finalOutput: result.finalOutput,
    activeSubgraph: result.activeSubgraph,
    routeReason: result.routeReason,
  };
}
