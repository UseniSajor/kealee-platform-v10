/**
 * graphs/delivery.ts
 *
 * Delivery Subgraph
 *
 * Executes product delivery workflows post-purchase:
 * - Design concept generation (DesignBot)
 * - Cost estimation (EstimateBot)
 * - Permit case creation (PermitBot)
 * - Architect handoff routing
 * - Human review routing
 * - Deliverables packaging
 * - Next-step recommendation
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState, ProductSKU } from "../state/kealee-state";
import { generateConceptTool } from "../tools/concept";
import { estimateBuildCostTool } from "../tools/estimate-build-cost";
import { createPermitCaseTool } from "../tools/permit-case";
import { updateProjectRecordTool } from "../tools/project-record";
import { sendEmailNotificationTool } from "../tools/notifications";
import {
  recommendNextProduct,
  requiresArchitectHandoff,
  isConceptProduct,
  isPermitProduct,
  RULE_CONCEPT_NOT_PERMIT_READY,
} from "../rules/business-rules";
import { emitEvent, buildEvent } from "../events/contracts";

// ─── DesignBot node ───────────────────────────────────────────────────────────

async function designBot(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!state.projectId) {
    return { blockers: [...state.blockers, "Project ID required before concept generation."] };
  }

  const result = await generateConceptTool.invoke({
    projectId: state.projectId,
    projectType: state.projectType ?? "general",
    style: state.stylePreferences?.join(", "),
    budget: state.budgetMax,
    scopeSummary: state.scopeSummary,
  });
  const r = result as { conceptId?: string; status?: string; warning?: string };

  await emitEvent(
    buildEvent("orchestrator.agent.started", state.threadId, {
      agentRole: "DesignBot",
      taskId: r.conceptId,
    }, { projectId: state.projectId })
  );

  return {
    readiness: { ...state.readiness, conceptReady: false }, // set true when delivered
    toolResults: [
      { tool: "generate_concept", success: true, data: result, calledAt: new Date().toISOString() },
    ],
    finalOutput: {
      ...state.finalOutput,
      concept: {
        conceptId: r.conceptId,
        status: r.status,
        disclaimer: RULE_CONCEPT_NOT_PERMIT_READY,
      },
    },
  };
}

// ─── EstimateBot node ─────────────────────────────────────────────────────────

async function estimateBot(state: KealeeState): Promise<Partial<KealeeState>> {
  const stateCode = state.jurisdiction?.split(",").pop()?.trim().substring(0, 2) ?? "DEFAULT";
  const area = 1500; // default sqft — would come from concept output in production

  const result = await estimateBuildCostTool.invoke({
    projectType: state.projectType ?? "general",
    areaSqFt: area,
    quality: "mid",
    stateCode,
  });
  const r = result as {
    estimatedLow?: number;
    estimatedHigh?: number;
    disclaimer?: string;
  };

  await emitEvent(
    buildEvent("orchestrator.deliverable.generated", state.threadId, {
      type: "cost_estimate",
      productSku: state.currentProductSku ?? "",
      summary: `Estimate: $${r.estimatedLow?.toLocaleString()} – $${r.estimatedHigh?.toLocaleString()}`,
    }, { projectId: state.projectId })
  );

  return {
    readiness: { ...state.readiness, estimateReady: true },
    budgetMin: r.estimatedLow,
    budgetMax: r.estimatedHigh,
    toolResults: [
      { tool: "estimate_build_cost", success: true, data: result, calledAt: new Date().toISOString() },
    ],
    finalOutput: {
      ...state.finalOutput,
      estimate: { low: r.estimatedLow, high: r.estimatedHigh, disclaimer: r.disclaimer },
    },
  };
}

// ─── PermitBot node ───────────────────────────────────────────────────────────

async function permitBot(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!state.projectId || !state.jurisdiction) {
    return {
      blockers: [...state.blockers, "Project ID and jurisdiction required for permit case creation."],
    };
  }

  const result = await createPermitCaseTool.invoke({
    projectId: state.projectId,
    jurisdiction: state.jurisdiction,
    permitType: state.currentProductSku ?? "PERMIT_PACKAGE",
    scopeSummary: state.scopeSummary,
    budgetEstimate: state.budgetMax,
    userId: state.userId,
  });
  const r = result as { permitCaseId?: string; status?: string; error?: string };

  if (r.error) {
    return { blockers: [...state.blockers, `Permit case failed: ${r.error}`] };
  }

  return {
    readiness: { ...state.readiness, permitReady: true },
    toolResults: [
      { tool: "create_permit_case", success: true, data: result, calledAt: new Date().toISOString() },
    ],
    finalOutput: {
      ...state.finalOutput,
      permit: { caseId: r.permitCaseId, status: r.status },
    },
  };
}

// ─── Architect handoff router ─────────────────────────────────────────────────

async function architectHandoffRouter(state: KealeeState): Promise<Partial<KealeeState>> {
  if (!requiresArchitectHandoff(state)) return {};

  await emitEvent(
    buildEvent("orchestrator.escalation.architect", state.threadId, {
      agentRole: "ArchitectHandoffRouter",
      reason: "Project requires architect review — complexity score or type triggers escalation.",
    }, { projectId: state.projectId, userId: state.userId })
  );

  return {
    phase: "readiness_review" as const,
    blockers: [
      ...state.blockers,
      "This project requires a licensed architect. Please see the Architect VIP service.",
    ],
    finalOutput: {
      ...state.finalOutput,
      architectRequired: true,
      nextAction: "ARCHITECT_VIP",
    },
  };
}

// ─── Human review router ──────────────────────────────────────────────────────

async function humanReviewRouter(state: KealeeState): Promise<Partial<KealeeState>> {
  const needsReview =
    (state.complexityScore ?? 0) >= 90 ||
    state.risks.length >= 3;

  if (!needsReview) return {};

  await emitEvent(
    buildEvent("orchestrator.escalation.human_review", state.threadId, {
      agentRole: "HumanReviewRouter",
      reason: "High complexity or risk flags require human review before proceeding.",
    }, { projectId: state.projectId })
  );

  return {
    blockers: [
      ...state.blockers,
      "Project flagged for human review before continuing. Kealee ops team will be in touch.",
    ],
  };
}

// ─── Package deliverables ─────────────────────────────────────────────────────

async function packageDeliverables(state: KealeeState): Promise<Partial<KealeeState>> {
  if (state.projectId) {
    await updateProjectRecordTool.invoke({
      projectId: state.projectId,
      updates: {
        conceptReady: state.readiness.conceptReady,
        estimateReady: state.readiness.estimateReady,
        permitReady: state.readiness.permitReady,
        lastDeliveryAt: new Date().toISOString(),
      },
    });
  }
  return { phase: "readiness_review" as const };
}

// ─── Recommend next step ──────────────────────────────────────────────────────

async function recommendNextStep(state: KealeeState): Promise<Partial<KealeeState>> {
  const recommended = recommendNextProduct(state);
  return { recommendedNextProduct: recommended };
}

// ─── Routing functions ────────────────────────────────────────────────────────

function routeByProductSku(state: KealeeState): "design_bot" | "estimate_bot" | "permit_bot" | "architect_handoff" {
  const sku = state.currentProductSku;
  if (!sku) return "architect_handoff";
  if (isConceptProduct(sku)) return "design_bot";
  if (isPermitProduct(sku)) return "permit_bot";
  if (sku === "ESTIMATE_DETAILED" || sku === "ESTIMATE_CERTIFIED") return "estimate_bot";
  return "architect_handoff";
}

function afterArchitectRouter(state: KealeeState): "package_deliverables" | typeof END {
  if (state.blockers.some((b) => b.includes("architect"))) return END;
  return "package_deliverables";
}

// ─── Build graph ──────────────────────────────────────────────────────────────

export function buildDeliveryGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("design_bot",            designBot)
    .addNode("estimate_bot",          estimateBot)
    .addNode("permit_bot",            permitBot)
    .addNode("architect_handoff",     architectHandoffRouter)
    .addNode("human_review_router",   humanReviewRouter)
    .addNode("package_deliverables",  packageDeliverables)
    .addNode("recommend_next_step",   recommendNextStep)
    .addConditionalEdges("__start__", routeByProductSku, {
      design_bot:        "design_bot",
      estimate_bot:      "estimate_bot",
      permit_bot:        "permit_bot",
      architect_handoff: "architect_handoff",
    })
    .addEdge("design_bot",     "human_review_router")
    .addEdge("estimate_bot",   "human_review_router")
    .addEdge("permit_bot",     "human_review_router")
    .addEdge("human_review_router", "architect_handoff")
    .addConditionalEdges("architect_handoff", afterArchitectRouter, {
      package_deliverables: "package_deliverables",
      [END]: END,
    })
    .addEdge("package_deliverables", "recommend_next_step")
    .addEdge("recommend_next_step",  END);

  return graph.compile();
}

export const deliveryGraph = buildDeliveryGraph();
