/**
 * core-llm/internal/rerank.provider.ts
 * Internal reranker provider — Qwen VL reranker or compatible endpoint.
 *
 * Uses a rerank API endpoint at INTERNAL_RERANK_BASE_URL.
 * Model: INTERNAL_RERANK_MODEL (default: "qwen-rerank")
 *
 * TODO_LOCAL_RUNTIME: requires a running reranker endpoint.
 * e.g. vllm serve BAAI/bge-reranker-v2-m3 --port 8013
 * or a custom Qwen reranker endpoint.
 *
 * The rerank API is not part of the OpenAI spec — this uses a simple
 * POST /rerank endpoint (compatible with Cohere rerank API format).
 */

import {
  ClassifyArgs,
  ClassifyResult,
  EmbedArgs,
  EmbedResult,
  GenerateObjectArgs,
  GenerateObjectResult,
  GenerateTextArgs,
  GenerateTextResult,
  LlmProvider,
  RerankArgs,
  RerankResult,
} from "../types";

interface RerankApiResponse {
  results: Array<{
    index: number;
    relevance_score: number;
    document?: { text: string };
  }>;
  model?: string;
}

export class RerankProvider implements LlmProvider {
  readonly name = "internal" as const;

  private readonly model: string;
  private readonly baseURL: string;

  constructor() {
    this.baseURL = process.env.INTERNAL_RERANK_BASE_URL ?? "http://localhost:8013/v1";
    this.model = process.env.INTERNAL_RERANK_MODEL ?? "qwen-rerank";
  }

  isAvailable(): boolean {
    return process.env.INTERNAL_LLM_ENABLED === "true";
  }

  supportsText(): boolean { return false; }
  supportsVision(): boolean { return false; }
  supportsEmbedding(): boolean { return false; }
  supportsReranking(): boolean { return true; }

  async generateText(_args: GenerateTextArgs): Promise<GenerateTextResult> {
    throw new Error("[RerankProvider] Text generation not supported — use QwenProvider");
  }

  async generateObject<T>(_args: GenerateObjectArgs<T>): Promise<GenerateObjectResult<T>> {
    throw new Error("[RerankProvider] Object generation not supported — use QwenProvider");
  }

  async classify<TLabel extends string>(_args: ClassifyArgs<TLabel>): Promise<ClassifyResult<TLabel>> {
    throw new Error("[RerankProvider] Classification not supported — use QwenProvider");
  }

  async embed(_args: EmbedArgs): Promise<EmbedResult> {
    throw new Error("[RerankProvider] Embeddings not supported — use EmbedProvider");
  }

  async rerank(args: RerankArgs): Promise<RerankResult> {
    const start = Date.now();
    const topK = args.topK ?? args.documents.length;

    try {
      const response = await fetch(`${this.baseURL}/rerank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          query: args.query,
          documents: args.documents,
          top_n: topK,
        }),
      });

      if (!response.ok) {
        throw new Error(`Rerank API returned ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as RerankApiResponse;

      const ranked = data.results
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, topK)
        .map((r) => ({
          index: r.index,
          score: r.relevance_score,
          document: r.document?.text ?? args.documents[r.index] ?? "",
        }));

      return {
        ranked,
        model: data.model ?? this.model,
        provider: "internal",
        latencyMs: Date.now() - start,
        fallbackUsed: false,
      };
    } catch (err) {
      throw new Error(`[RerankProvider] rerank failed: ${(err as Error).message}`);
    }
  }
}
