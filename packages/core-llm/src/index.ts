/**
 * @kealee/core-llm
 * Kealee internal-first LLM stack.
 *
 * Exports:
 *   - Types: all provider-agnostic interfaces
 *   - Confidence: scoring and threshold logic
 *   - ProviderRegistry: register and resolve providers
 *   - Router: routing decision logic
 *   - InternalProvider: Qwen text + VL + embed + rerank facade
 *   - ClaudeProvider: Anthropic fallback
 *   - GptProvider: OpenAI fallback
 *   - SeedIngest: seed pack ingestion for retrieval
 *   - Retriever: keyword + metadata-based retrieval
 *   - ContextBuilder: assemble LLM context from intake + seeds + memory
 *   - LlmRunRecorder: run logging + snapshot persistence
 *   - PromptRegistry: versioned prompt templates
 */

export * from "./types";
export * from "./confidence";
export * from "./provider-registry";
export * from "./router";

// Providers
export { InternalProvider } from "./internal/internal.provider";
export { QwenProvider } from "./internal/qwen.provider";
export { QwenVLProvider } from "./internal/qwen-vl.provider";
export { EmbedProvider } from "./internal/embed.provider";
export { RerankProvider } from "./internal/rerank.provider";
export { ClaudeProvider } from "./external/claude.provider";
export { GptProvider } from "./external/gpt.provider";
export type { VisionTextArgs } from "./internal/qwen-vl.provider";

// Retrieval
export { ingestAllSeeds, getAllChunks, getChunksByType, resetIngest } from "./retrieval/seed-ingest";
export { chunkText, estimateTokens } from "./retrieval/chunker";
export { retrieve, retrieveJurisdiction, retrieveServicesByCategory } from "./retrieval/retriever";
export { buildContext } from "./retrieval/context-builder";
export type { NormalizedIntake, SessionMemorySnapshot, BuiltContext } from "./retrieval/context-builder";

// Logging
export { recordRun, getRecentRuns, getRunsBySession, getRunStats } from "./logging/llm-run-recorder";
export type { RecordRunArgs } from "./logging/llm-run-recorder";

// Prompts
export {
  registerPrompt,
  getPrompt,
  listPrompts,
  renderPrompt,
} from "./prompts/prompt-registry";
export type { PromptTemplate } from "./prompts/prompt-registry";

// Utils
export { createId } from "./utils/ids";

// ─── Startup helper ───────────────────────────────────────────────────────────
// Call this at KeaCore boot to register all providers and warm the retrieval layer.

export function initializeLlmStack(): {
  providers: Array<{ name: string; available: boolean }>;
  chunksLoaded: number;
} {
  // Register providers
  const { InternalProvider: IP } = require("./internal/internal.provider");
  const { ClaudeProvider: CP } = require("./external/claude.provider");
  const { GptProvider: GP } = require("./external/gpt.provider");

  const internal = new IP() as { name: string; isAvailable: () => boolean };
  const claude = new CP() as { name: string; isAvailable: () => boolean };
  const gpt = new GP() as { name: string; isAvailable: () => boolean };

  providerRegistry.register(internal as never);
  providerRegistry.register(claude as never);
  providerRegistry.register(gpt as never);

  // Warm retrieval
  const { ingestAllSeeds: ias, getAllChunks: gac } = require("./retrieval/seed-ingest");
  ias();
  const chunks = gac() as unknown[];

  const providers = providerRegistry.list();

  console.log("[core-llm] Stack initialized:");
  for (const p of providers) {
    console.log(`  • ${p.name}: ${p.available ? "available" : "unavailable"}`);
  }
  console.log(`  • Retrieval: ${chunks.length} seed chunks loaded`);

  return { providers, chunksLoaded: chunks.length };
}
