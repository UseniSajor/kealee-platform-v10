/**
 * graphs/developer.ts
 *
 * Developer Workflow Subgraph
 *
 * Handles developer-specific flows: pipeline tracking, feasibility, capital stack,
 * multifamily routing, and ops services.
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState } from "../state/kealee-state";
import { recommendNextProduct } from "../rules/business-rules";

async function loadDeveloperContext(state: KealeeState): Promise<Partial<KealeeState>> {
  // Load developer-specific context: pipeline entries, feasibility studies, capital stack
  return { role: "developer" as const };
}

async function assessFeasibility(state: KealeeState): Promise<Partial<KealeeState>> {
  return {
    finalOutput: {
      ...state.finalOutput,
      feasibilityStatus: state.readiness.landReady ? "complete" : "pending",
    },
  };
}

async function capitalStackRouter(state: KealeeState): Promise<Partial<KealeeState>> {
  return {
    finalOutput: {
      ...state.finalOutput,
      capitalStack: "placeholder — connect to services/os-feas capital stack module",
    },
  };
}

async function developerRecommendNextStep(state: KealeeState): Promise<Partial<KealeeState>> {
  const recommended = recommendNextProduct(state);
  return { recommendedNextProduct: recommended };
}

export function buildDeveloperGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("load_developer_context",      loadDeveloperContext)
    .addNode("assess_feasibility",          assessFeasibility)
    .addNode("capital_stack_router",        capitalStackRouter)
    .addNode("developer_recommend_next_step", developerRecommendNextStep)
    .addEdge("__start__",                  "load_developer_context")
    .addEdge("load_developer_context",      "assess_feasibility")
    .addEdge("assess_feasibility",          "capital_stack_router")
    .addEdge("capital_stack_router",        "developer_recommend_next_step")
    .addEdge("developer_recommend_next_step", END);

  return graph.compile();
}

export const developerGraph = buildDeveloperGraph();
