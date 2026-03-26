/**
 * core-llm/external/claude.provider.ts
 * Claude (Anthropic) external fallback provider.
 *
 * Model: claude-sonnet-4-6 (latest; update to claude-opus-4-6 for maximum quality)
 * Requires: ANTHROPIC_API_KEY env var
 * Feature flag: CLAUDE_ENABLED=true
 */

import Anthropic from "@anthropic-ai/sdk";
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

export class ClaudeProvider implements LlmProvider {
  readonly name = "claude" as const;

  private readonly model: string;
  private client: Anthropic | null = null;

  constructor(model?: string) {
    this.model = model ?? "claude-sonnet-4-6";
  }

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("[ClaudeProvider] ANTHROPIC_API_KEY not set");
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return process.env.CLAUDE_ENABLED === "true" && Boolean(process.env.ANTHROPIC_API_KEY);
  }

  supportsText(): boolean { return true; }
  supportsVision(): boolean { return true; }
  supportsEmbedding(): boolean { return false; }
  supportsReranking(): boolean { return false; }

  async generateText(args: GenerateTextArgs): Promise<GenerateTextResult> {
    const start = Date.now();

    const response = await this.getClient().messages.create({
      model: this.model,
      max_tokens: args.maxTokens ?? 4096,
      temperature: args.temperature ?? 0.3,
      system: args.systemPrompt,
      messages: [{ role: "user", content: args.prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const latencyMs = Date.now() - start;

    return {
      text,
      provider: "claude",
      model: this.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
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
        provider: "claude",
        model: this.model,
        latencyMs,
        confidence,
        fallbackUsed: true,
      };
    } catch (e) {
      return {
        object: {} as T,
        rawText,
        provider: "claude",
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
    const systemPrompt = "You are a classification assistant. Respond with exactly one label from the list provided. No other text.";
    const prompt = `Classify the following text into exactly one of these labels: ${args.labels.join(", ")}\n\nText: ${args.prompt}\n\nLabel:`;

    const textResult = await this.generateText({ ...args, prompt, systemPrompt, maxTokens: 50 });
    const latencyMs = Date.now() - start;

    const rawLabel = textResult.text.trim().toLowerCase();
    const matchedLabel = args.labels.find(
      (l) => l.toLowerCase() === rawLabel || rawLabel.startsWith(l.toLowerCase()),
    ) ?? args.labels[0];

    const scores: Partial<Record<TLabel, number>> = {};
    for (const label of args.labels) {
      scores[label] = label === matchedLabel ? 0.88 : 0.08;
    }

    return {
      label: matchedLabel,
      scores,
      confidence: 0.88,
      provider: "claude",
      model: this.model,
      latencyMs,
      fallbackUsed: true,
    };
  }

  async embed(_args: EmbedArgs): Promise<EmbedResult> {
    throw new Error("[ClaudeProvider] Embeddings not supported — use internal EmbedProvider");
  }

  async rerank(_args: RerankArgs): Promise<RerankResult> {
    throw new Error("[ClaudeProvider] Reranking not supported — use internal RerankProvider");
  }
}
