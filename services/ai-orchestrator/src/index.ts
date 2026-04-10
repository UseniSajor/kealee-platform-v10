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

// ─── KeaBot adapter ───────────────────────────────────────────────────────────
//
// Used by LangGraph subgraph nodes to call domain KeaBots for LLM execution.

export { runKeaBotNode, runSubgraphBot, SUBGRAPH_BOT_MAP } from "./agents/bot-adapter";
export type { BotNodeResult } from "./agents/bot-adapter";

// ─── Domain agents ────────────────────────────────────────────────────────────

export { runLandAnalysisAgent } from "./agents/land-agent";
export type { LandAnalysisAgentResult, LandAnalysisReport } from "./agents/land-agent";

export { runDesignAgent } from "./agents/design-agent";
export type { DesignAgentResult, DesignReport } from "./agents/design-agent";

export { runPermitAgent } from "./agents/permit-agent";
export type { PermitAgentResult, PermitReport } from "./agents/permit-agent";

export { runContractorAgent } from "./agents/contractor-agent";
export type { ContractorAgentResult, ContractorMatchReport } from "./agents/contractor-agent";

export { runPaymentsAgent } from "./agents/payments-agent";
export type { PaymentsAgentResult, PaymentDecisionReport } from "./agents/payments-agent";

// ─── RAG Retrieval layer ──────────────────────────────────────────────────────

export {
  retrievePermitContext,
  retrieveCostContext,
  retrieveWorkflowContext,
  buildRAGContext,
  invalidateRAGCache,
  getRAGStats,
} from "./retrieval/rag-retriever";
export type {
  PermitZoningRecord,
  CostRecord,
  WorkflowRecord,
  RAGContext,
  PermitQuery,
  CostQuery,
  WorkflowQuery,
} from "./retrieval/rag-retriever";

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
