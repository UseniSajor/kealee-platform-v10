/**
 * core-llm/external/gpt.provider.ts
 * OpenAI (GPT) external fallback provider.
 *
 * Model: gpt-4o (default) or gpt-4o-mini for cost-sensitive paths
 * Requires: OPENAI_API_KEY env var
 * Feature flag: GPT_ENABLED=true
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

export class GptProvider implements LlmProvider {
  readonly name = "gpt" as const;

  private readonly model: string;
  private client: OpenAI | null = null;

  constructor(model?: string) {
    this.model = model ?? "gpt-4o";
  }

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("[GptProvider] OPENAI_API_KEY not set");
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return process.env.GPT_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
  }

  supportsText(): boolean { return true; }
  supportsVision(): boolean { return true; }
  supportsEmbedding(): boolean { return true; } // GPT has text-embedding-3-small
  supportsReranking(): boolean { return false; }

  async generateText(args: GenerateTextArgs): Promise<GenerateTextResult> {
    const start = Date.now();
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (args.systemPrompt) {
      messages.push({ role: "system", content: args.systemPrompt });
    }
    messages.push({ role: "user", content: args.prompt });

    const response = await this.getClient().chat.completions.create({
      model: this.model,
      messages,
      max_tokens: args.maxTokens ?? 4096,
      temperature: args.temperature ?? 0.3,
    });

    const text = response.choices[0]?.message?.content ?? "";
    const latencyMs = Date.now() - start;

    return {
      text,
      provider: "gpt",
      model: this.model,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
      latencyMs,
      confidence: heuristicConfidence(text),
      fallbackUsed: true,
    };
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
        provider: "gpt",
        model: this.model,
        latencyMs,
        confidence,
        fallbackUsed: true,
      };
    } catch (e) {
      return {
        object: {} as T,
        rawText,
        provider: "gpt",
        model: this.model,
        latencyMs,
        confidence: 0.05,
        fallbackUsed: true,
        parseError: `JSON parse failed: ${(e as Error).message}`,
      };
    }
  }

  async classify<TLabel extends string>(args: ClassifyArgs<TLabel>): Promise<ClassifyResult<TLabel>> {
    const start = Date.now();
    const systemPrompt = "You are a classification assistant. Respond with exactly one label. No other text.";
    const prompt = `Classify into one of: ${args.labels.join(", ")}\n\nText: ${args.prompt}\n\nLabel:`;

    const textResult = await this.generateText({ ...args, prompt, systemPrompt, maxTokens: 50 });
    const latencyMs = Date.now() - start;

    const rawLabel = textResult.text.trim().toLowerCase();
    const matchedLabel = args.labels.find(
      (l) => l.toLowerCase() === rawLabel || rawLabel.startsWith(l.toLowerCase()),
    ) ?? args.labels[0];

    const scores: Partial<Record<TLabel, number>> = {};
    for (const label of args.labels) {
      scores[label] = label === matchedLabel ? 0.85 : 0.08;
    }

    return {
      label: matchedLabel,
      scores,
      confidence: 0.85,
      provider: "gpt",
      model: this.model,
      latencyMs,
      fallbackUsed: true,
    };
  }

  async embed(args: EmbedArgs): Promise<EmbedResult> {
    const start = Date.now();
    const embedModel = "text-embedding-3-small";

    const response = await this.getClient().embeddings.create({
      model: embedModel,
      input: args.texts,
    });

    const embeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);

    return {
      embeddings,
      model: embedModel,
      provider: "gpt",
      latencyMs: Date.now() - start,
      fallbackUsed: true,
    };
  }

  async rerank(_args: RerankArgs): Promise<RerankResult> {
    throw new Error("[GptProvider] Reranking not supported — use internal RerankProvider");
  }
}
