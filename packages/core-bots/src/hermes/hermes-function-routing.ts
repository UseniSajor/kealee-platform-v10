/**
 * HERMES: Function Routing & Execution Layer
 * Manages Claude API calls with prompt caching, function execution routing,
 * and event/state mutation propagation
 *
 * Features:
 * - ClaudeCachedClient: Wraps Anthropic SDK with cache_control: ephemeral
 * - CacheMetricsLogger: Tracks cache performance per KeaBotRun
 * - FunctionRouter: Routes function calls to appropriate handlers
 * - EventEmitter: Broadcasts state changes across agent system
 */

import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// CACHED CLAUDE CLIENT
// ============================================================================

export interface CacheMetricsSnapshot {
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cacheHit: boolean;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ClaudeCallResult {
  content: string;
  cacheMetrics: CacheMetricsSnapshot;
  stopReason: string | null;
}

/**
 * ClaudeCachedClient: Wraps Anthropic SDK with ephemeral prompt caching
 * Implements four cacheable context blocks under 1,024 tokens each
 */
export class ClaudeCachedClient {
  private client: Anthropic;
  private cacheLogger: CacheMetricsLogger;

  constructor(cacheLogger?: CacheMetricsLogger) {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.cacheLogger = cacheLogger || new CacheMetricsLogger();
  }

  /**
   * Call Claude with ephemeral prompt caching
   * Four cacheable blocks:
   * 1. System prompt (persistent role definition)
   * 2. Pricing rules (from packages/core-rules/src/pricing.ts)
   * 3. Construction Task Catalog (CTC) with 2026 DMV rates
   * 4. KeaBot execution constraints (chain immutability, approval gates)
   */
  async callClaudeWithCache(
    contextId: string,
    userPrompt: string,
    model: string = "claude-sonnet-4-20250514",
    metadata?: Record<string, any>
  ): Promise<ClaudeCallResult> {
    console.log(
      `[Hermes] Calling ${model} for context ${contextId} with cache`
    );

    // Build cacheable context blocks
    const systemPrompt = this.buildSystemPrompt(metadata);
    const pricingRulesBlock = this.buildPricingRulesBlock();
    const ctcBlock = this.buildConstructionTaskCatalogBlock();
    const constraintsBlock = this.buildExecutionConstraintsBlock();

    // Construct message with cache_control on final system block
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: userPrompt,
      },
    ];

    try {
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 1000,
        system: [
          {
            type: "text",
            text: systemPrompt,
          },
          {
            type: "text",
            text: pricingRulesBlock,
          },
          {
            type: "text",
            text: ctcBlock,
          },
          {
            type: "text",
            text: constraintsBlock,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: messages,
      });

      // Extract metrics
      const usage = response.usage as any;
      const metrics: CacheMetricsSnapshot = {
        cacheCreationTokens: usage.cache_creation_input_tokens || 0,
        cacheReadTokens: usage.cache_read_input_tokens || 0,
        cacheHit: (usage.cache_read_input_tokens || 0) > 0,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens:
          response.usage.input_tokens + response.usage.output_tokens,
      };

      // Log cache metrics
      await this.cacheLogger.recordCacheHit(contextId, metrics);

      // Extract text content
      const textContent = response.content.find((c) => c.type === "text");
      const content = textContent && "text" in textContent ? textContent.text : "";

      console.log(
        `[Hermes] Response received. Cache: ${metrics.cacheHit ? "HIT" : "MISS"}, ` +
          `Created: ${metrics.cacheCreationTokens}, Read: ${metrics.cacheReadTokens}`
      );

      return {
        content: content,
        cacheMetrics: metrics,
        stopReason: response.stop_reason,
      };
    } catch (error) {
      console.error(`[Hermes] API call failed:`, error);
      throw error;
    }
  }

  /**
   * Build system prompt based on agent role
   */
  private buildSystemPrompt(metadata?: Record<string, any>): string {
    const role = metadata?.role || "GENERIC";
    const prompts: Record<string, string> = {
      DESIGN: `You are DesignBot, expert construction design AI.
      Always output valid JSON. Generate creative, feasible designs.
      Do not reference any competing or legacy services.`,
      ESTIMATE: `You are EstimateBot, expert construction cost estimator.
      Use only pricing from provided rules. Always break down costs by trade.
      Include 2026 DMV regional adjustments (+28% baseline).`,
      PERMIT: `You are PermitBot, autonomous DC/Maryland permit filing AI.
      Support DC DCRA (REST API) and Maryland counties (Playwright automation).
      Always verify PE signatures and stamped plans before filing.`,
      GENERIC: `You are a Kealee Platform agent.
      Always output valid JSON. Be precise and comprehensive.`,
    };

    return prompts[role] || prompts.GENERIC;
  }

  /**
   * Cacheable Block 1: Pricing Rules (from packages/core-rules/src/pricing.ts)
   * Max ~800 tokens
   */
  private buildPricingRulesBlock(): string {
    return `
    ## PRICING RULES (DMV 2026)

    Base year: 2026
    Regional multiplier (DC-Maryland-Virginia): 1.28 (+28%)
    Material adjustments:
      - Lumber: +38%
      - Steel: +15%
      - Concrete: +8%

    Hourly trade rates (base × regional):
      - HVAC: $95 → $121.60/hr (1.35× overhead)
      - Plumbing: $110 → $140.80/hr (1.4× overhead)
      - Electrical: $125 → $160/hr (1.45× overhead)
      - Carpentry: $85 → $108.80/hr (1.3× overhead)
      - General Labor: $65 → $83.20/hr (1.25× overhead)

    Equipment daily rates:
      - Crane: $1,200–$1,800/day
      - Lift: $400–$600/day
      - Compressor: $150–$250/day

    Standard contingency: 15% (20% for renovation)
    Builder risk insurance: 0.6–1.2% of hard costs
    `;
  }

  /**
   * Cacheable Block 2: Construction Task Catalog (CTC) with 2026 rates
   * Max ~800 tokens
   */
  private buildConstructionTaskCatalogBlock(): string {
    return `
    ## CONSTRUCTION TASK CATALOG (CTC) 2026 DMV

    Common tasks and unit costs (includes labor + materials + regional):

    HVAC:
      - Furnace replacement (residential): $4,200–$5,800
      - Ductwork per linear foot: $45–$65
      - VAV box installation: $2,100–$2,800
      - Hydronic loop per ton: $850–$1,100

    Plumbing:
      - Copper main line per 100 ft: $1,800–$2,200
      - PEX branch per 100 ft: $900–$1,200
      - Fixture set (sink, faucet, P-trap): $600–$950
      - Backflow preventer: $400–$600

    Electrical:
      - Panel upgrade (200A): $2,400–$3,200
      - Breaker per position: $80–$150
      - Outlet/switch installation: $120–$200
      - Service entrance upgrade: $3,500–$5,000

    Carpentry:
      - Framing per SF: $12–$18
      - Door frame installation: $180–$280
      - Trim per linear foot: $8–$14
      - Casing per opening: $240–$380

    All rates assume DMV region, 2026 baseline costs.
    `;
  }

  /**
   * Cacheable Block 3: KeaBot Execution Constraints
   * Max ~800 tokens
   */
  private buildExecutionConstraintsBlock(): string {
    return `
    ## KEABOT EXECUTION CONSTRAINTS

    Chain Architecture (IMMUTABLE):
    DesignBot → EstimateBot → PermitBot

    Each stage is chain-gated: no stage executes without prior stage completion.
    No deployment without SESSION 12 smoke test passing all 12 checks.

    Model assignments:
      - DesignBot: Claude Opus 4.6 (always, no fallback)
      - EstimateBot: Claude Sonnet 4.6 (or Sonnet 4-20250514 if unavailable)
      - PermitBot: Claude Sonnet 4.6

    Pricing constraints:
      - NEVER hardcode prices. Import from packages/core-rules/src/pricing.ts
      - Use cache_control: ephemeral on all final system message blocks
      - Target 40–60% API cost reduction via cache hits

    PermitBot dual-path model:
      - Path A (client has plans): Permit filing only ($99–$599)
      - Path B (Kealee generates): Plans + PE stamp + permits ($1,200–$6,500)

    DC/Maryland compliance:
      - DC DCRA: Type A REST API (oauth2, direct filing)
      - Maryland: Type B Playwright automation (web form-based)
      - Both paths: Autonomous execution, post-filing human verification
    `;
  }
}

// ============================================================================
// CACHE METRICS LOGGER
// ============================================================================

export interface CacheMetricsRecord {
  contextId: string;
  timestamp: Date;
  cacheHit: boolean;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costSavingsPercent: number;
}

/**
 * CacheMetricsLogger: Tracks cache performance across all KeaBotRuns
 */
export class CacheMetricsLogger {
  private metrics: CacheMetricsRecord[] = [];

  async recordCacheHit(contextId: string, metrics: CacheMetricsSnapshot) {
    // Cost calculation with cache:
    // - Cache creation: input_tokens at 0.1x normal rate
    // - Cache read: input_tokens at 0.01x normal rate (90% savings)
    // - Normal: input_tokens at 1x rate

    const baseInputCost = metrics.inputTokens;
    const cacheCost =
      metrics.cacheCreationTokens * 0.1 + metrics.cacheReadTokens * 0.01;
    const savings =
      baseInputCost > 0
        ? ((baseInputCost - cacheCost) / baseInputCost) * 100
        : 0;

    const record: CacheMetricsRecord = {
      contextId,
      timestamp: new Date(),
      cacheHit: metrics.cacheHit,
      cacheCreationTokens: metrics.cacheCreationTokens,
      cacheReadTokens: metrics.cacheReadTokens,
      inputTokens: metrics.inputTokens,
      outputTokens: metrics.outputTokens,
      totalTokens: metrics.totalTokens,
      costSavingsPercent: savings,
    };

    this.metrics.push(record);

    console.log(
      `[CacheMetricsLogger] ${contextId}: Cache hit=${metrics.cacheHit}, ` +
        `Savings=${savings.toFixed(1)}%`
    );
  }

  async getAggregateMetrics(): Promise<{
    totalRequests: number;
    cacheHitRate: number;
    avgCostSavingsPercent: number;
    totalTokensSaved: number;
  }> {
    const totalRequests = this.metrics.length;
    const cacheHits = this.metrics.filter((m) => m.cacheHit).length;
    const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    const totalSavings =
      totalRequests > 0
        ? this.metrics.reduce((sum, m) => sum + m.costSavingsPercent, 0) /
          totalRequests
        : 0;

    // Token savings estimate (based on cache cost model)
    const totalTokensSaved = this.metrics.reduce((sum, m) => {
      return sum + (m.cacheReadTokens * 0.99 + m.cacheCreationTokens * 0.9);
    }, 0);

    return {
      totalRequests,
      cacheHitRate: hitRate,
      avgCostSavingsPercent: totalSavings,
      totalTokensSaved,
    };
  }
}

// ============================================================================
// FUNCTION ROUTER
// ============================================================================

export type FunctionHandler = (
  args: Record<string, any>
) => Promise<Record<string, any>>;

/**
 * FunctionRouter: Routes function calls to appropriate handlers
 * Used by Claude function calling and internal agent-to-agent communication
 */
export class FunctionRouter {
  private handlers: Map<string, FunctionHandler> = new Map();

  registerHandler(functionName: string, handler: FunctionHandler) {
    console.log(`[FunctionRouter] Registered handler for ${functionName}`);
    this.handlers.set(functionName, handler);
  }

  async route(
    functionName: string,
    args: Record<string, any>
  ): Promise<Record<string, any>> {
    const handler = this.handlers.get(functionName);
    if (!handler) {
      throw new Error(
        `No handler registered for function: ${functionName}`
      );
    }

    console.log(
      `[FunctionRouter] Routing to ${functionName} with args:`,
      args
    );
    return await handler(args);
  }
}

// ============================================================================
// EVENT EMITTER
// ============================================================================

export enum KheaEvent {
  DESIGN_COMPLETE = "DESIGN_COMPLETE",
  ESTIMATE_COMPLETE = "ESTIMATE_COMPLETE",
  PERMIT_FILED = "PERMIT_FILED",
  APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
  ERROR = "ERROR",
  CACHE_HIT = "CACHE_HIT",
}

export interface KheaEventPayload {
  event: KheaEvent;
  contextId: string;
  data: Record<string, any>;
  timestamp: Date;
}

/**
 * EventEmitter: Broadcasts state changes across agent system
 * Allows agents to react to completion events without tight coupling
 */
export class KheaEventEmitter {
  private listeners: Map<KheaEvent, ((payload: KheaEventPayload) => void)[]> =
    new Map();

  on(event: KheaEvent, callback: (payload: KheaEventPayload) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: KheaEvent, contextId: string, data: Record<string, any>) {
    const payload: KheaEventPayload = {
      event,
      contextId,
      data,
      timestamp: new Date(),
    };

    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => cb(payload));

    console.log(`[EventEmitter] Emitted ${event} for ${contextId}`);
  }
}

// ============================================================================
// CACHEABLE CONTEXT (for reuse across multiple calls)
// ============================================================================

export interface CacheableContext {
  id: string;
  systemPrompt: string;
  pricingRules: string;
  ctc: string;
  constraints: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Helper: Create reusable cached context for repeated calls
 * Reduces cache creation overhead when running multiple estimates/permits
 * on the same project
 */
export function createCacheableContext(
  contextId: string,
  systemPrompt: string,
  pricingRules: string,
  ctc: string,
  constraints: string
): CacheableContext {
  return {
    id: contextId,
    systemPrompt,
    pricingRules,
    ctc,
    constraints,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
  };
}
