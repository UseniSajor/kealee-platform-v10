/**
 * core-llm/internal/qwen-vl.provider.ts
 * Qwen3-VL multimodal provider — images, plans, screenshots, permit docs.
 *
 * Uses OpenAI-compatible vision endpoint at INTERNAL_VL_BASE_URL.
 * Model: INTERNAL_VL_MODEL (default: "qwen-vl")
 *
 * TODO_LOCAL_RUNTIME: requires a running Qwen3-VL compatible endpoint.
 * Start with: docker run -p 8011:8080 ... or vllm serve <qwen-vl-model>
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
import { heuristicConfidence, jsonParseConfidence } from "../confidence";

export interface VisionTextArgs extends GenerateTextArgs {
  /** Base64-encoded image or publicly accessible URL */
  imageUrl?: string;
  imageBase64?: string;
  imageMimeType?: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

export class QwenVLProvider implements LlmProvider {
  readonly name = "internal" as const;

  private readonly model: string;
  private readonly baseURL: string;
  private client: OpenAI | null = null;

  constructor() {
    this.baseURL = process.env.INTERNAL_VL_BASE_URL ?? "http://localhost:8011/v1";
    this.model = process.env.INTERNAL_VL_MODEL ?? "qwen-vl";
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

  supportsText(): boolean { return true; }
  supportsVision(): boolean { return true; }
  supportsEmbedding(): boolean { return false; }
  supportsReranking(): boolean { return false; }

  /** Vision-capable text generation. Accepts imageUrl or imageBase64. */
  async generateText(args: VisionTextArgs | GenerateTextArgs): Promise<GenerateTextResult> {
    const start = Date.now();
    const visionArgs = args as VisionTextArgs;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (args.systemPrompt) {
      messages.push({ role: "system", content: args.systemPrompt });
    }

    // Build vision content if image provided
    if (visionArgs.imageUrl || visionArgs.imageBase64) {
      const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPartImage = {
        type: "image_url",
        image_url: {
          url: visionArgs.imageBase64
            ? `data:${visionArgs.imageMimeType ?? "image/jpeg"};base64,${visionArgs.imageBase64}`
            : (visionArgs.imageUrl ?? ""),
        },
      };

      messages.push({
        role: "user",
        content: [
          { type: "text", text: args.prompt },
          imageContent,
        ],
      });
    } else {
      messages.push({ role: "user", content: args.prompt });
    }

    try {
      const response = await this.getClient().chat.completions.create({
        model: this.model,
        messages,
        max_tokens: args.maxTokens ?? 1024,
        temperature: args.temperature ?? 0.3,
      });

      const text = response.choices[0]?.message?.content ?? "";
      const latencyMs = Date.now() - start;

      return {
        text,
        provider: "internal",
        model: this.model,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
        latencyMs,
        confidence: heuristicConfidence(text),
        fallbackUsed: false,
      };
    } catch (err) {
      throw new Error(`[QwenVLProvider] generateText failed: ${(err as Error).message}`);
    }
  }

  async generateObject<T>(args: GenerateObjectArgs<T>): Promise<GenerateObjectResult<T>> {
    const start = Date.now();
    const schemaHint = JSON.stringify(args.schema, null, 2);
    const prompt = `${args.prompt}\n\nRespond ONLY with valid JSON matching this schema:\n${schemaHint}`;

    const textResult = await this.generateText({ ...args, prompt });
    const latencyMs = Date.now() - start;

    let rawText = textResult.text.trim();
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    try {
      const object = JSON.parse(rawText) as T;
      const requiredKeys = Object.keys((args.schema["properties"] as Record<string, unknown>) ?? {});
      const confidence = jsonParseConfidence(object, requiredKeys);

      return {
        object,
        rawText,
        provider: "internal",
        model: this.model,
        latencyMs,
        confidence,
        fallbackUsed: false,
      };
    } catch (e) {
      return {
        object: {} as T,
        rawText,
        provider: "internal",
        model: this.model,
        latencyMs,
        confidence: 0.05,
        fallbackUsed: false,
        parseError: `JSON parse failed: ${(e as Error).message}`,
      };
    }
  }

  async classify<TLabel extends string>(args: ClassifyArgs<TLabel>): Promise<ClassifyResult<TLabel>> {
    const start = Date.now();
    const prompt = `Classify the following into exactly one of these labels: ${args.labels.join(", ")}\n\nText: ${args.prompt}\n\nLabel:`;
    const textResult = await this.generateText({ ...args, prompt, maxTokens: 50, temperature: 0 });
    const latencyMs = Date.now() - start;

    const rawLabel = textResult.text.trim().toLowerCase();
    const matchedLabel = args.labels.find(
      (l) => l.toLowerCase() === rawLabel || rawLabel.startsWith(l.toLowerCase()),
    ) ?? args.labels[0];

    const scores: Partial<Record<TLabel, number>> = {};
    for (const label of args.labels) {
      scores[label] = label === matchedLabel ? 0.8 : 0.1;
    }

    return {
      label: matchedLabel,
      scores,
      confidence: 0.72,
      provider: "internal",
      model: this.model,
      latencyMs,
      fallbackUsed: false,
    };
  }

  async embed(_args: EmbedArgs): Promise<EmbedResult> {
    throw new Error("[QwenVLProvider] Embeddings not supported — use EmbedProvider");
  }

  async rerank(_args: RerankArgs): Promise<RerankResult> {
    throw new Error("[QwenVLProvider] Reranking not supported — use RerankProvider");
  }
}
