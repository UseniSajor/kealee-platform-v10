/**
 * graphs/sales-intake.ts
 *
 * Sales Intake Subgraph
 *
 * Handles public funnel: classify → collect intake → qualify → recommend → checkout
 *
 * Goal: surface the single best next product for the user's current state.
 * Never shows the full catalog. Never routes to checkout before qualifying.
 */

import { StateGraph, END } from "@langchain/langgraph";
import { KealeeStateAnnotation } from "../state/kealee-state";
import type { KealeeState } from "../state/kealee-state";
import {
  recommendNextProduct,
  deriveUpsellCandidates,
  detectBlockers,
  deriveContractorReadiness,
} from "../rules/business-rules";
import { createProjectRecordTool } from "../tools/project-record";
import { emitEvent, buildEvent } from "../events/contracts";

// ─── Node: classify role ──────────────────────────────────────────────────────

async function classifyRole(state: KealeeState): Promise<Partial<KealeeState>> {
  if (state.role !== "unknown") return {};

  // Try to infer role from existing signals
  let role = state.role;
  const intent = state.intent;

  if (intent === "contractor_growth" || intent === "find_contractor") role = "contractor";
  else if (intent === "land_analysis") role = "land_owner";
  else if (intent === "developer_pipeline") role = "developer";
  else if (intent === "start_project" || intent === "get_concept" || intent === "get_permit") {
    role = "homeowner";
  }

  return role !== "unknown" ? { role } : {};
}

// ─── Node: classify intent ────────────────────────────────────────────────────

async function classifyIntent(state: KealeeState): Promise<Partial<KealeeState>> {
  if (state.intent !== "unknown") return {};
  // Without LLM call — infer from phase and available signals
  const intent = state.phase === "discovery" ? "browse" : state.intent;
  return { intent };
}

// ─── Node: collect project intake ─────────────────────────────────────────────

async function collectProjectIntake(state: KealeeState): Promise<Partial<KealeeState>> {
  const blockers = detectBlockers(state);
  return {
    blockers,
    phase: blockers.length > 0 ? ("intake" as const) : state.phase,
  };
}

// ─── Node: qualify project ────────────────────────────────────────────────────

async function qualifyProject(state: KealeeState): Promise<Partial<KealeeState>> {
  // Derive readiness flags
  const contractorReady = deriveContractorReadiness(state);

  return {
    readiness: {
      ...state.readiness,
      contractorReady,
    },
  };
}

// ─── Node: recommend product ──────────────────────────────────────────────────

async function recommendProduct(state: KealeeState): Promise<Partial<KealeeState>> {
  const recommended = recommendNextProduct(state);
  const upsells = deriveUpsellCandidates(state);

  await emitEvent(
    buildEvent("orchestrator.route.decided", state.threadId, {
      fromPhase: state.phase,
      toSubgraph: "sales_intake",
      reason: `Recommending ${recommended?.sku ?? "none"} for ${state.role} with intent ${state.intent}`,
    }, { userId: state.userId, projectId: state.projectId })
  );

  return {
    recommendedNextProduct: recommended,
    upsellCandidates: upsells,
    phase: "product_selection" as const,
  };
}

// ─── Node: create checkout session ────────────────────────────────────────────

async function createCheckoutSession(state: KealeeState): Promise<Partial<KealeeState>> {
  const sku = state.currentProductSku;
  if (!sku) return { blockers: [...state.blockers, "No product selected for checkout."] };

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://kealee.com";
  const successUrl = `${baseUrl}/checkout/success?sku=${sku}&threadId=${state.threadId}`;
  const cancelUrl = `${baseUrl}/intake?step=product`;

  // Import lazily to avoid circular issues
  const { createCheckoutSessionTool } = await import("../tools/checkout");
  const result = await createCheckoutSessionTool.invoke({
    productSku: sku,
    userId: state.userId,
    projectId: state.projectId,
    successUrl,
    cancelUrl,
    metadata: { threadId: state.threadId, role: state.role },
  });
  const r = result as { checkoutUrl?: string; sessionId?: string; error?: string };

  if (r.error) {
    return {
      blockers: [...state.blockers, `Checkout failed: ${r.error}`],
      paymentStatus: "failed",
    };
  }

  await emitEvent(
    buildEvent("orchestrator.checkout.created", state.threadId, {
      productSku: sku,
      checkoutUrl: r.checkoutUrl ?? "",
      sessionId: r.sessionId,
      userId: state.userId,
    }, { userId: state.userId, projectId: state.projectId })
  );

  return {
    checkoutUrl: r.checkoutUrl,
    paymentStatus: "pending",
    phase: "checkout" as const,
  };
}

// ─── Node: post-checkout activation ───────────────────────────────────────────

async function postCheckoutActivation(state: KealeeState): Promise<Partial<KealeeState>> {
  if (state.paymentStatus !== "completed") return {};

  // Ensure project record exists
  if (!state.projectId && state.userId) {
    const result = await createProjectRecordTool.invoke({
      userId: state.userId,
      orgId: state.orgId,
      address: state.address,
      projectType: state.projectType,
      scopeSummary: state.scopeSummary,
      budgetMin: state.budgetMin,
      budgetMax: state.budgetMax,
    });
    const r = result as { projectId?: string; error?: string };
    if (r.projectId) {
      await emitEvent(
        buildEvent("orchestrator.purchase.completed", state.threadId, {
          productSku: state.currentProductSku ?? "",
        }, { userId: state.userId, projectId: r.projectId })
      );
      return {
        projectId: r.projectId,
        purchasedProducts: [...state.purchasedProducts, state.currentProductSku!],
        phase: "delivery" as const,
      };
    }
  }

  return {
    purchasedProducts: state.currentProductSku
      ? [...state.purchasedProducts, state.currentProductSku]
      : state.purchasedProducts,
    phase: "delivery" as const,
  };
}

// ─── Routing ──────────────────────────────────────────────────────────────────

function afterQualifyRouter(
  state: KealeeState
): "recommend_product" | "collect_project_intake" {
  if (state.blockers.length > 0) return "collect_project_intake";
  return "recommend_product";
}

function afterRecommendRouter(
  state: KealeeState
): "create_checkout_session" | typeof END {
  if (!state.currentProductSku) return END; // user must select from recommendation first
  return "create_checkout_session";
}

// ─── Build graph ──────────────────────────────────────────────────────────────

export function buildSalesIntakeGraph() {
  const graph = new StateGraph(KealeeStateAnnotation)
    .addNode("classify_role",           classifyRole)
    .addNode("classify_intent",         classifyIntent)
    .addNode("collect_project_intake",  collectProjectIntake)
    .addNode("qualify_project",         qualifyProject)
    .addNode("recommend_product",       recommendProduct)
    .addNode("create_checkout_session", createCheckoutSession)
    .addNode("post_checkout_activation",postCheckoutActivation)
    .addEdge("__start__",              "classify_role")
    .addEdge("classify_role",           "classify_intent")
    .addEdge("classify_intent",         "collect_project_intake")
    .addEdge("collect_project_intake",  "qualify_project")
    .addConditionalEdges("qualify_project", afterQualifyRouter, {
      recommend_product: "recommend_product",
      collect_project_intake: "collect_project_intake",
    })
    .addConditionalEdges("recommend_product", afterRecommendRouter, {
      create_checkout_session: "create_checkout_session",
      [END]: END,
    })
    .addEdge("create_checkout_session", "post_checkout_activation")
    .addEdge("post_checkout_activation", END);

  return graph.compile();
}

export const salesIntakeGraph = buildSalesIntakeGraph();
