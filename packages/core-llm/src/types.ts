/**
 * core-llm/types.ts
 * Provider-agnostic interfaces for the Kealee internal-first LLM stack.
 * All providers must implement LlmProvider. All callers use these types.
 */

// ─── Provider names ──────────────────────────────────────────────────────────

export type ProviderName = "internal" | "claude" | "gpt";

// ─── Generate text ────────────────────────────────────────────────────────────

export interface GenerateTextArgs {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  // Tracing / logging context
  sessionId?: string;
  taskId?: string;
  projectId?: string;
  workflowCode?: string;
  stepCode?: string;
  actorType?: "user" | "system" | "operator";
  actorId?: string;
}

export interface GenerateTextResult {
  text: string;
  provider: ProviderName;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  /** 0–1 confidence from provider or heuristic scoring */
  confidence: number;
  fallbackUsed: boolean;
}

// ─── Generate object (structured output) ─────────────────────────────────────

export interface GenerateObjectArgs<T = unknown> extends GenerateTextArgs {
  /** JSON Schema for the expected object shape */
  schema: Record<string, unknown>;
}

export interface GenerateObjectResult<T = unknown> {
  object: T;
  rawText: string;
  provider: ProviderName;
  model: string;
  latencyMs: number;
  confidence: number;
  fallbackUsed: boolean;
  parseError?: string;
}

// ─── Classify ────────────────────────────────────────────────────────────────

export interface ClassifyArgs<TLabel extends string = string> extends GenerateTextArgs {
  labels: TLabel[];
}

export interface ClassifyResult<TLabel extends string = string> {
  label: TLabel;
  scores: Partial<Record<TLabel, number>>;
  confidence: number;
  provider: ProviderName;
  model: string;
  latencyMs: number;
  fallbackUsed: boolean;
}

// ─── Embed ────────────────────────────────────────────────────────────────────

export interface EmbedArgs {
  texts: string[];
  sessionId?: string;
}

export interface EmbedResult {
  embeddings: number[][];
  model: string;
  provider: ProviderName;
  latencyMs: number;
  fallbackUsed: boolean;
}

// ─── Rerank ───────────────────────────────────────────────────────────────────

export interface RerankArgs {
  query: string;
  documents: string[];
  topK?: number;
  sessionId?: string;
}

export interface RerankResult {
  ranked: Array<{ index: number; score: number; document: string }>;
  model: string;
  provider: ProviderName;
  latencyMs: number;
  fallbackUsed: boolean;
}

// ─── Provider interface ───────────────────────────────────────────────────────

export interface LlmProvider {
  readonly name: ProviderName;
  isAvailable(): boolean;
  supportsText(): boolean;
  supportsVision(): boolean;
  supportsEmbedding(): boolean;
  supportsReranking(): boolean;
  generateText(args: GenerateTextArgs): Promise<GenerateTextResult>;
  generateObject<T>(args: GenerateObjectArgs<T>): Promise<GenerateObjectResult<T>>;
  classify<TLabel extends string>(args: ClassifyArgs<TLabel>): Promise<ClassifyResult<TLabel>>;
  embed(args: EmbedArgs): Promise<EmbedResult>;
  rerank(args: RerankArgs): Promise<RerankResult>;
}

// ─── Routing ──────────────────────────────────────────────────────────────────

export interface ModelRouteDecision {
  selectedProvider: ProviderName;
  reason: string;
  /** Ordered fallback chain if primary fails or is low-confidence */
  fallbackChain: ProviderName[];
  confidenceThreshold: number;
  internalAvailable: boolean;
}

// ─── LLM run record ──────────────────────────────────────────────────────────

export interface LlmRunRecord {
  id: string;
  provider: ProviderName;
  model: string;
  operation: "generateText" | "generateObject" | "classify" | "embed" | "rerank";
  routeDecision: ModelRouteDecision;
  confidence: number;
  fallbackUsed: boolean;
  sessionId?: string;
  taskId?: string;
  projectId?: string;
  workflowCode?: string;
  stepCode?: string;
  actorType?: "user" | "system" | "operator";
  actorId?: string;
  /** Truncated prompt for audit */
  promptSnapshot: string;
  /** IDs of retrieved context blocks included in this call */
  retrievedContextRefs: string[];
  parsedOutput?: unknown;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  createdAt: string;
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export interface RetrievedContextBlock {
  id: string;
  sourceType: "intent" | "workflow" | "tool" | "jurisdiction" | "service" | "role" | "rule" | "prompt" | "zoning";
  seedPack: string;
  content: string;
  metadata: Record<string, unknown>;
  /** Relevance score 0–1 */
  score: number;
  jurisdictionCode?: string;
  workflowCode?: string;
  serviceCode?: string;
  updatedAt?: string;
}

export interface SeedChunk {
  id: string;
  sourceType: RetrievedContextBlock["sourceType"];
  seedPack: string;
  text: string;
  metadata: Record<string, unknown>;
  keywords: string[];
  jurisdictionCode?: string;
  workflowCode?: string;
  serviceCode?: string;
}
