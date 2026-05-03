/**
 * BaseOrgBot — Abstract base class for all C-Suite OrgBots.
 *
 * Enforces:
 * - Strict JSON output (validateDecision)
 * - Retry logic with exponential backoff
 * - Token tracking
 * - Structured logging
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  OrgBotRequest,
  OrgBotResponse,
  StructuredDecision,
} from "./decision-schema.js";
import { validateDecision } from "./decision-schema.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 2048;
const MAX_RETRIES = 3;

export interface OrgBotConfig {
  name: string;           // e.g. "kea-cfo"
  role: string;           // e.g. "Chief Financial Officer"
  systemPrompt: string;   // full system prompt
}

export abstract class BaseOrgBot {
  protected config: OrgBotConfig;

  constructor(config: OrgBotConfig) {
    this.config = config;
  }

  /**
   * Execute the OrgBot decision process.
   * Validates and retries until a valid StructuredDecision is produced.
   */
  async execute(request: OrgBotRequest): Promise<OrgBotResponse> {
    const startMs = Date.now();
    let totalTokens = 0;
    let lastError: string | undefined;

    const userPrompt = this.buildUserPrompt(request);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: 0.1,
          system: this.config.systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        totalTokens = response.usage.input_tokens + response.usage.output_tokens;
        const content = response.content.find((b) => b.type === "text");
        if (!content || content.type !== "text") {
          throw new Error("No text content in model response");
        }

        const raw = this.extractJSON(content.text);
        const decision = validateDecision(raw);

        console.info(
          `[${this.config.name}] Decision: ${decision.decision} ` +
          `(confidence=${decision.confidence.toFixed(2)}) ` +
          `project=${request.projectId} attempt=${attempt}`,
        );

        return {
          botName: this.config.name,
          projectId: request.projectId,
          decision,
          latencyMs: Date.now() - startMs,
          modelTokensUsed: totalTokens,
        };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(
          `[${this.config.name}] Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError}`,
        );
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 500);
        }
      }
    }

    // All retries exhausted — return a safe fallback
    const fallback: StructuredDecision = {
      decision: "ESCALATE",
      confidence: 0,
      data: {},
      reasoning: `OrgBot ${this.config.name} failed after ${MAX_RETRIES} attempts: ${lastError}`,
      actions: [
        {
          type: "notify",
          target: "operations_team",
          payload: { error: lastError },
          priority: "urgent",
        },
      ],
      risks: [
        {
          category: "operational",
          severity: "high",
          description: "OrgBot decision failed",
          mitigation: "Manual review required",
        },
      ],
      next_steps: ["Escalate to human operations team for manual review"],
    };

    return {
      botName: this.config.name,
      projectId: request.projectId,
      decision: fallback,
      latencyMs: Date.now() - startMs,
      modelTokensUsed: totalTokens,
      error: lastError,
    };
  }

  /**
   * Build the user prompt from the request context.
   * Override in subclasses for domain-specific formatting.
   */
  protected buildUserPrompt(request: OrgBotRequest): string {
    return [
      `Project ID: ${request.projectId}`,
      `Triggered by: ${request.triggeredBy}`,
      `Urgency: ${request.urgency}`,
      "",
      "Context:",
      JSON.stringify(request.context, null, 2),
      "",
      "Return a single JSON object matching the StructuredDecision schema. No markdown, no explanation — JSON only.",
    ].join("\n");
  }

  /**
   * Extract the first JSON object from a model response.
   * Handles markdown code fences if present.
   */
  private extractJSON(text: string): unknown {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = fenceMatch ? fenceMatch[1] : text;
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("No JSON object found in model response");
    }
    return JSON.parse(jsonText.slice(start, end + 1));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
