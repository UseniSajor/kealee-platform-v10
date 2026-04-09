/**
 * @kealee/ai-orchestrator
 *
 * LangGraph-first orchestration layer for the Kealee Platform.
 *
 * Production entrypoint. Import this package from:
 * - services/api (POST /api/v1/orchestrate/run)
 * - services/worker (orchestration job processor)
 *
 * Architecture:
 * - Supervisor graph routes to specialized subgraphs based on explicit business rules
 * - No free-form agent looping for core business decisions
 * - State is persisted via LangGraph checkpointer (thread-level)
 * - Events are emitted for observability
 *
 * Kealee's LangGraph implementation:
 * - NOT a chatbot
 * - A stateful construction execution engine
 * - Business logic lives in rules/business-rules.ts and routing/supervisor-routing.ts
 * - Model routing is delegated to @kealee/core-llm (Qwen-first, Claude/GPT fallback)
 */

// ─── Public API ───────────────────────────────────────────────────────────────

export { runOrchestrator } from "./graphs/supervisor";
export type { OrchestratorRunInput, OrchestratorRunResult } from "./graphs/supervisor";

// ─── State types ──────────────────────────────────────────────────────────────

export type {
  KealeeState,
  KealeeStateUpdate,
  ProductSKU,
  KealeeRole,
  KealeePhase,
  KealeeIntent,
  PaymentStatus,
  LandAnalysis,
  ReadinessFlags,
  ProductRecommendation,
  ToolResult,
} from "./state/kealee-state";

// ─── Business rules ───────────────────────────────────────────────────────────

export {
  recommendNextProduct,
  deriveUpsellCandidates,
  detectBlockers,
  isContractorMatchAllowed,
  requiresArchitectHandoff,
  deriveContractorReadiness,
  isPMProductEligible,
  isEstimateProductEligible,
  PRODUCT_CATALOG,
  RULE_CONCEPT_NOT_PERMIT_READY,
  RULE_PERMIT_EXECUTION,
} from "./rules/business-rules";

// ─── Event contracts ──────────────────────────────────────────────────────────

export {
  emitEvent,
  onEvent,
  buildEvent,
} from "./events/contracts";
export type { KealeeEventType, KealeeEvent } from "./events/contracts";

// ─── Memory ───────────────────────────────────────────────────────────────────

export {
  saveOwnerPreferences,
  getOwnerPreferences,
  saveLandAnalysis,
  getLandAnalysis,
  saveJurisdictionPattern,
  getJurisdictionPattern,
} from "./memory/long-term";

// ─── Graphs (for advanced use) ────────────────────────────────────────────────

export { supervisorGraph }      from "./graphs/supervisor";
export { salesIntakeGraph }     from "./graphs/sales-intake";
export { landFeasibilityGraph } from "./graphs/land-feasibility";
export { deliveryGraph }        from "./graphs/delivery";
export { marketplaceGraph }     from "./graphs/marketplace";
export { constructionGraph }    from "./graphs/construction";
export { supportGraph }         from "./graphs/support";
export { growthGraph }          from "./graphs/growth";
export { developerGraph }       from "./graphs/developer";
