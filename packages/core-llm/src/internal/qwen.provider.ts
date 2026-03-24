/**
 * core-llm/internal/qwen.provider.ts
 * Qwen text provider — internal reasoning, classification, summaries.
 *
 * Uses OpenAI-compatible endpoint at INTERNAL_TEXT_BASE_URL.
 * Model: INTERNAL_TEXT_MODEL (default: "qwen")
 *
 * TODO_LOCAL_RUNTIME: requires a running Qwen-compatible OpenAI endpoint.
 * Start with: docker run -p 8010:8080 ... or vllm serve <qwen-model>
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

export class QwenProvider implements LlmProvider {
  readonly name = "internal" as const;

  private readonly model: string;
  private readonly baseURL: string;
  private client: OpenAI | null = null;

  constructor() {
    this.baseURL = process.env.INTERNAL_TEXT_BASE_URL ?? "http://localhost:8010/v1";
    this.model = process.env.INTERNAL_TEXT_MODEL ?? "qwen";
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        baseURL: this.baseURL,
        apiKey: process.env.INTERNAL_API_KEY ?? "local", // OpenAI-compat servers often ignore key
      });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return process.env.INTERNAL_LLM_ENABLED === "true";
  }

  supportsText(): boolean { return true; }
  supportsVision(): boolean { return false; } // Vision handled by QwenVLProvider
  supportsEmbedding(): boolean { return false; } // Handled by EmbedProvider
  supportsReranking(): boolean { return false; } // Handled by RerankProvider

  async generateText(args: GenerateTextArgs): Promise<GenerateTextResult> {
    const start = Date.now();
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (args.systemPrompt) {
      messages.push({ role: "system", content: args.systemPrompt });
    }
    messages.push({ role: "user", content: args.prompt });

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
      // TODO_LOCAL_RUNTIME: if endpoint is down, propagate error to gateway for fallback
      throw new Error(`[QwenProvider] generateText failed: ${(err as Error).message}`);
    }
  }

  async generateObject<T>(args: GenerateObjectArgs<T>): Promise<GenerateObjectResult<T>> {
    const start = Date.now();
    const schemaHint = JSON.stringify(args.schema, null, 2);
    const prompt = `${args.prompt}\n\nRespond ONLY with valid JSON matching this schema:\n${schemaHint}`;

    const textResult = await this.generateText({ ...args, prompt });
    const latencyMs = Date.now() - start;

    let rawText = textResult.text.trim();
    // Strip markdown code fences if present
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    try {
      const object = JSON.parse(rawText) as T;
      const requiredKeys = Object.keys(args.schema["properties"] as Record<string, unknown> ?? {});
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
    const systemPrompt = args.systemPrompt ?? "You are a classification assistant. Respond with exactly one label from the list provided. No other text.";
    const prompt = `Classify the following text into exactly one of these labels: ${args.labels.join(", ")}\n\nText: ${args.text}\n\nLabel:`;

    const textResult = await this.generateText({ ...args, prompt, systemPrompt, maxTokens: 50, temperature: 0 });
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
      confidence: 0.75,
      provider: "internal",
      model: this.model,
      latencyMs,
      fallbackUsed: false,
    };
  }

  async embed(_args: EmbedArgs): Promise<EmbedResult> {
    throw new Error("[QwenProvider] Embeddings not supported — use EmbedProvider");
  }

  async rerank(_args: RerankArgs): Promise<RerankResult> {
    throw new Error("[QwenProvider] Reranking not supported — use RerankProvider");
  }
}
