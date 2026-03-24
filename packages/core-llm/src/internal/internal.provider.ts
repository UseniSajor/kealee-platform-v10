/**
 * core-llm/internal/internal.provider.ts
 * Facade over all internal providers (text, VL, embed, rerank).
 *
 * This is the single "internal" provider registered in the ProviderRegistry.
 * It routes internally based on operation type:
 *   - Text / classify / generateObject → QwenProvider (text)
 *   - Vision calls → QwenVLProvider
 *   - Embeddings → EmbedProvider
 *   - Reranking → RerankProvider
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
import { QwenProvider } from "./qwen.provider";
import { QwenVLProvider, VisionTextArgs } from "./qwen-vl.provider";
import { EmbedProvider } from "./embed.provider";
import { RerankProvider } from "./rerank.provider";

export class InternalProvider implements LlmProvider {
  readonly name = "internal" as const;

  private readonly text: QwenProvider;
  private readonly vl: QwenVLProvider;
  private readonly embed: EmbedProvider;
  private readonly rerank: RerankProvider;

  constructor() {
    this.text = new QwenProvider();
    this.vl = new QwenVLProvider();
    this.embed = new EmbedProvider();
    this.rerank = new RerankProvider();
  }

  isAvailable(): boolean {
    return process.env.INTERNAL_LLM_ENABLED === "true";
  }

  supportsText(): boolean { return true; }
  supportsVision(): boolean { return true; }
  supportsEmbedding(): boolean { return true; }
  supportsReranking(): boolean { return true; }

  /**
   * If args contains imageUrl or imageBase64, routes to QwenVL.
   * Otherwise uses Qwen text provider.
   */
  async generateText(args: GenerateTextArgs | VisionTextArgs): Promise<GenerateTextResult> {
    const vArgs = args as VisionTextArgs;
    if (vArgs.imageUrl || vArgs.imageBase64) {
      return this.vl.generateText(vArgs);
    }
    return this.text.generateText(args);
  }

  async generateObject<T>(args: GenerateObjectArgs<T>): Promise<GenerateObjectResult<T>> {
    return this.text.generateObject(args);
  }

  async classify<TLabel extends string>(args: ClassifyArgs<TLabel>): Promise<ClassifyResult<TLabel>> {
    return this.text.classify(args);
  }

  async embed(args: EmbedArgs): Promise<EmbedResult> {
    return this.embed.embed(args);
  }

  async rerank(args: RerankArgs): Promise<RerankResult> {
    return this.rerank.rerank(args);
  }

  /** Readiness status for startup checks */
  getComponentStatus(): Record<string, boolean> {
    return {
      text: this.text.isAvailable(),
      vl: this.vl.isAvailable(),
      embed: this.embed.isAvailable(),
      rerank: this.rerank.isAvailable(),
    };
  }
}
