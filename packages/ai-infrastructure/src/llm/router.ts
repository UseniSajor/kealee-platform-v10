/**
 * core-llm/router.ts
 * Explicit, readable model routing logic.
 *
 * ROUTING RULES (from architecture spec):
 *
 * INTERNAL (Qwen) first for:
 *   - intake classification
 *   - missing-field detection
 *   - service recommendation ranking
 *   - risk extraction
 *   - retrieval-grounded summary
 *   - workflow recommendation support
 *   - multimodal intake interpretation when file/image context exists
 *
 * CLAUDE or GPT fallback for:
 *   - low-confidence internal outputs
 *   - complex reasoning
 *   - ambiguous permit-path synthesis
 *   - higher-quality narrative generation
 *   - hard synthesis across multiple conflicting signals
 *
 * FALLBACK CHAINS:
 *   - internal -> claude
 *   - internal -> gpt (if claude unavailable)
 *   - claude -> gpt
 *   - gpt -> claude
 */

import { ModelRouteDecision, ProviderName } from "./types";
import { providerRegistry } from "./provider-registry";

// ─── Operation type ────────────────────────────────────────────────────────────
// Used to select the right provider for a given operation.

export type RoutingContext =
  | "intake_classification"
  | "missing_field_detection"
  | "service_recommendation"
  | "risk_extraction"
  | "retrieval_summary"
  | "workflow_recommendation"
  | "multimodal_interpretation"
  | "permit_path_synthesis"
  | "narrative_generation"
  | "complex_reasoning"
  | "embedding"
  | "reranking"
  | "general";

// ─── Routing table ────────────────────────────────────────────────────────────
// Maps routing contexts to preferred providers and fallback chains.
// INTERNAL = Qwen text / Qwen3-VL endpoint.

const ROUTING_TABLE: Record<
  RoutingContext,
  { preferred: ProviderName; fallbackChain: ProviderName[]; confidenceThreshold: number }
> = {
  // Internal-first: routine, high-volume, grounded operations
  intake_classification:      { preferred: "internal", fallbackChain: ["claude", "gpt"], confidenceThreshold: 0.75 },
  missing_field_detection:    { preferred: "internal", fallbackChain: ["claude", "gpt"], confidenceThreshold: 0.70 },
  service_recommendation:     { preferred: "internal", fallbackChain: ["claude", "gpt"], confidenceThreshold: 0.65 },
  risk_extraction:            { preferred: "internal", fallbackChain: ["claude", "gpt"], confidenceThreshold: 0.65 },
  retrieval_summary:          { preferred: "internal", fallbackChain: ["claude", "gpt"], confidenceThreshold: 0.70 },
  workflow_recommendation:    { preferred: "internal", fallbackChain: ["claude", "gpt"], confidenceThreshold: 0.75 },
  multimodal_interpretation:  { preferred: "internal", fallbackChain: ["claude", "gpt"], confidenceThreshold: 0.60 },

  // Claude/GPT preferred: complex synthesis, permit complexity, user-facing narrative
  permit_path_synthesis:      { preferred: "claude",   fallbackChain: ["gpt", "internal"], confidenceThreshold: 0.70 },
  narrative_generation:       { preferred: "claude",   fallbackChain: ["gpt"],             confidenceThreshold: 0.60 },
  complex_reasoning:          { preferred: "claude",   fallbackChain: ["gpt"],             confidenceThreshold: 0.65 },

  // Infrastructure-specific (no fallback needed)
  embedding:                  { preferred: "internal", fallbackChain: [],                  confidenceThreshold: 0.50 },
  reranking:                  { preferred: "internal", fallbackChain: [],                  confidenceThreshold: 0.50 },
  general:                    { preferred: "internal", fallbackChain: ["claude", "gpt"],   confidenceThreshold: 0.65 },
};

// ─── Router ───────────────────────────────────────────────────────────────────

export function decideRoute(context: RoutingContext): ModelRouteDecision {
  const rule = ROUTING_TABLE[context];
  const internalAvailable = providerRegistry.hasAvailable("internal");

  let selectedProvider = rule.preferred;
  let reason = `Routing context "${context}" → preferred provider "${rule.preferred}"`;

  // If preferred is internal but internal is not available, immediately fall to first fallback
  if (rule.preferred === "internal" && !internalAvailable) {
    const firstFallback = rule.fallbackChain.find((p) => providerRegistry.hasAvailable(p));
    if (firstFallback) {
      selectedProvider = firstFallback;
      reason = `Internal provider unavailable for "${context}" → falling back to "${firstFallback}"`;
    } else {
      // No fallback available — still return internal so the call attempt is made
      // and the error is surfaced clearly
      reason = `Internal provider unavailable and no fallback available for "${context}" — will attempt internal and fail clearly`;
    }
  }

  // If preferred is claude/gpt but that provider isn't available, try the chain
  if (rule.preferred !== "internal" && !providerRegistry.hasAvailable(rule.preferred)) {
    const alt = rule.fallbackChain.find((p) => providerRegistry.hasAvailable(p));
    if (alt) {
      selectedProvider = alt;
      reason = `Preferred provider "${rule.preferred}" unavailable for "${context}" → falling back to "${alt}"`;
    }
  }

  return {
    selectedProvider,
    reason,
    fallbackChain: rule.fallbackChain,
    confidenceThreshold: rule.confidenceThreshold,
    internalAvailable,
  };
}

// ─── Fallback resolver ────────────────────────────────────────────────────────
// Used when a call fails or returns low-confidence output.

export function resolveFallback(
  failedProvider: ProviderName,
  fallbackChain: ProviderName[],
): ProviderName | null {
  for (const name of fallbackChain) {
    if (name !== failedProvider && providerRegistry.hasAvailable(name)) {
      return name;
    }
  }
  return null;
}

export { ROUTING_TABLE };
