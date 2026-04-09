/**
 * supervisor-routing.ts
 *
 * Explicit, rule-driven routing logic for the top-level supervisor graph.
 *
 * Routing is based entirely on structured state fields — never on LLM output alone.
 * This prevents unpredictable routing caused by free-form AI decisions.
 */

import type { KealeeState } from "../state/kealee-state";
import {
  requiresArchitectHandoff,
  isContractorMatchAllowed,
  detectBlockers,
} from "../rules/business-rules";

// ─── Subgraph names ────────────────────────────────────────────────────────────

export type SubgraphName =
  | "sales_intake"
  | "land_feasibility"
  | "delivery"
  | "marketplace"
  | "construction"
  | "support"
  | "growth"
  | "developer"
  | "end";

// ─── Routing decision ─────────────────────────────────────────────────────────

export interface RoutingDecision {
  subgraph: SubgraphName;
  reason: string;
}

// ─── Supervisor routing function ──────────────────────────────────────────────

export function supervisorRoute(state: KealeeState): RoutingDecision {
  const { role, intent, phase, readiness, paymentStatus, blockers } = state;

  // ── 1. Support always takes precedence when intent = support_request
  if (intent === "support_request" || phase === "support") {
    return { subgraph: "support", reason: "User intent is support_request." };
  }

  // ── 2. Contractor-role users route to growth or marketplace
  if (role === "contractor") {
    if (intent === "start_project" || intent === "browse") {
      return { subgraph: "growth", reason: "Contractor role — routing to growth/acquisition." };
    }
    // Contractors looking at leads
    return { subgraph: "marketplace", reason: "Contractor role — routing to marketplace." };
  }

  // ── 3. Developer-role users route to developer subgraph
  if (role === "developer") {
    if (intent === "land_analysis") {
      return { subgraph: "land_feasibility", reason: "Developer land analysis intent." };
    }
    return { subgraph: "developer", reason: "Developer role — routing to developer workflow." };
  }

  // ── 4. Land analysis intent → land feasibility subgraph
  if (
    intent === "land_analysis" ||
    role === "land_owner" ||
    (state.currentProductSku === "LAND_FEASIBILITY_BASIC" ||
      state.currentProductSku === "LAND_FEASIBILITY_PRO")
  ) {
    return {
      subgraph: "land_feasibility",
      reason: "Land analysis intent or land product active — routing to land feasibility.",
    };
  }

  // ── 5. Construction phase → construction subgraph
  if (
    phase === "construction" ||
    readiness.constructionReady ||
    intent === "manage_construction"
  ) {
    return {
      subgraph: "construction",
      reason: "Project is in active construction phase.",
    };
  }

  // ── 6. Contractor matching — gated by readiness
  if (intent === "find_contractor") {
    if (!isContractorMatchAllowed(readiness)) {
      // Route back to intake to fill gaps
      return {
        subgraph: "sales_intake",
        reason: "Contractor match blocked — readiness check failed. Routing to intake to collect missing data.",
      };
    }
    return {
      subgraph: "marketplace",
      reason: "Contractor ready — routing to marketplace subgraph for matching.",
    };
  }

  // ── 7. Delivery subgraph — active product in delivery
  if (
    phase === "delivery" &&
    paymentStatus === "completed" &&
    state.currentProductSku !== undefined
  ) {
    return {
      subgraph: "delivery",
      reason: `Product ${state.currentProductSku} paid — routing to delivery execution.`,
    };
  }

  // ── 8. Architect handoff required → delivery will route to architect
  if (requiresArchitectHandoff(state) && !readiness.conceptReady) {
    return {
      subgraph: "delivery",
      reason: "Architect handoff required — routing to delivery with architect escalation node.",
    };
  }

  // ── 9. Readiness review phase — check what's next
  if (phase === "readiness_review") {
    if (readiness.contractorReady) {
      return { subgraph: "marketplace", reason: "Readiness review complete — contractor match ready." };
    }
    if (!readiness.conceptReady || !readiness.estimateReady || !readiness.permitReady) {
      return { subgraph: "delivery", reason: "Readiness review — still delivering products." };
    }
  }

  // ── 10. Checkout phase — post-checkout activation
  if (phase === "checkout" && paymentStatus === "completed") {
    return {
      subgraph: "delivery",
      reason: "Checkout completed — routing to delivery for post-purchase activation.",
    };
  }

  // ── 11. Default — send to sales intake to qualify and recommend
  return {
    subgraph: "sales_intake",
    reason: "No specific routing criteria matched — defaulting to sales intake.",
  };
}

// ─── Route termination check ──────────────────────────────────────────────────

export function shouldEnd(state: KealeeState): boolean {
  if (state.phase === "closeout" && state.readiness.payoutReady) return true;
  if (state.finalOutput !== undefined) return true;
  return false;
}

// ─── String router (for LangGraph conditional edges) ─────────────────────────

export function routeToSubgraph(state: KealeeState): SubgraphName {
  if (shouldEnd(state)) return "end";
  const decision = supervisorRoute(state);
  return decision.subgraph;
}
