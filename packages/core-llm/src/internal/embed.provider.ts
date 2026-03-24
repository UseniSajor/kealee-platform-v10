/**
 * core-llm/internal/embed.provider.ts
 * Internal embeddings provider — BGE-style or Qwen embeddings endpoint.
 *
 * Uses OpenAI-compatible embeddings endpoint at INTERNAL_EMBED_BASE_URL.
 * Model: INTERNAL_EMBED_MODEL (default: "qwen-embed")
 *
 * TODO_LOCAL_RUNTIME: requires a running embeddings endpoint.
 * e.g. vllm serve BAAI/bge-m3 --port 8012 or Qwen embed endpoint.
 */

import OpenAI from "openai";
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

export class EmbedProvider implements LlmProvider {
  readonly name = "internal" as const;

  private readonly model: string;
  private readonly baseURL: string;
  private client: OpenAI | null = null;

  constructor() {
    this.baseURL = process.env.INTERNAL_EMBED_BASE_URL ?? "http://localhost:8012/v1";
    this.model = process.env.INTERNAL_EMBED_MODEL ?? "qwen-embed";
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        baseURL: this.baseURL,
        apiKey: process.env.INTERNAL_API_KEY ?? "local",
      });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return process.env.INTERNAL_LLM_ENABLED === "true";
  }

  supportsText(): boolean { return false; }
  supportsVision(): boolean { return false; }
  supportsEmbedding(): boolean { return true; }
  supportsReranking(): boolean { return false; }

  async generateText(_args: GenerateTextArgs): Promise<GenerateTextResult> {
    throw new Error("[EmbedProvider] Text generation not supported — use QwenProvider");
  }

  async generateObject<T>(_args: GenerateObjectArgs<T>): Promise<GenerateObjectResult<T>> {
    throw new Error("[EmbedProvider] Object generation not supported — use QwenProvider");
  }

  async classify<TLabel extends string>(_args: ClassifyArgs<TLabel>): Promise<ClassifyResult<TLabel>> {
    throw new Error("[EmbedProvider] Classification not supported — use QwenProvider");
  }

  async embed(args: EmbedArgs): Promise<EmbedResult> {
    const start = Date.now();

    try {
      const response = await this.getClient().embeddings.create({
        model: this.model,
        input: args.texts,
      });

      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);

      return {
        embeddings,
        model: this.model,
        provider: "internal",
        latencyMs: Date.now() - start,
        fallbackUsed: false,
      };
    } catch (err) {
      throw new Error(`[EmbedProvider] embed failed: ${(err as Error).message}`);
    }
  }

  async rerank(_args: RerankArgs): Promise<RerankResult> {
    throw new Error("[EmbedProvider] Reranking not supported — use RerankProvider");
  }
}
