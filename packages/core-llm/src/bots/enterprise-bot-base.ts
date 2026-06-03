/**
 * ENTERPRISE BOT BASE CLASS
 * Core infrastructure for all enterprise-level bots (Design, Estimate, Permit, Floorplan)
 *
 * Features:
 * - Multi-model support (Claude, GPT-4, Opus)
 * - Token optimization & caching
 * - Quality scoring & validation
 * - Error recovery & retries
 * - Performance monitoring
 * - Cost tracking
 * - Batch processing
 */

import Anthropic from '@anthropic-ai/sdk';
import Bottleneck from 'bottleneck';
type RateLimiter = Bottleneck;

export interface BotConfig {
  name: string;
  model: 'claude-opus-4-8' | 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001';
  maxTokens: number;
  temperature: number;
  timeout: number;
  retries: number;
  cacheTTL: number; // Cache time-to-live in seconds
}

export interface BotMetrics {
  executionTime: number;
  tokensUsed: number;
  cacheHits: number;
  costUSD: number;
  qualityScore: number;
  errors: number;
}

export interface BotResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metrics: BotMetrics;
  timestamp: Date;
}

export abstract class EnterpriseBot {
  protected client: Anthropic;
  protected config: BotConfig;
  protected rateLimiter: RateLimiter;
  protected cache: Map<string, { data: any; timestamp: number }>;
  protected metrics: BotMetrics;

  constructor(config: BotConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Rate limiter: 10 requests per second max
    this.rateLimiter = new Bottleneck({
      maxConcurrent: 5,
      minTime: 100, // 100ms between requests
    });

    this.cache = new Map();
    this.metrics = {
      executionTime: 0,
      tokensUsed: 0,
      cacheHits: 0,
      costUSD: 0,
      qualityScore: 0,
      errors: 0,
    };
  }

  /**
   * Call Claude API with retry logic and caching
   */
  protected async callClaude(
    prompt: string,
    systemPrompt: string,
    cacheKey?: string
  ): Promise<{ content: string; tokensUsed: number; cached: boolean }> {
    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.config.cacheTTL * 1000) {
        this.metrics.cacheHits++;
        return { content: cached.data, tokensUsed: 0, cached: true };
      }
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        const startTime = Date.now();

        // Use rate limiter
        const response = await this.rateLimiter.schedule(async () => {
          return await this.client.messages.create({
            model: this.config.model,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          });
        });

        const executionTime = Date.now() - startTime;
        const tokensUsed =
          (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

        // Update metrics
        this.metrics.executionTime = executionTime;
        this.metrics.tokensUsed = tokensUsed;
        this.metrics.costUSD = this.calculateCost(tokensUsed);

        const content =
          response.content[0].type === 'text' ? response.content[0].text : '';

        // Cache result
        if (cacheKey) {
          this.cache.set(cacheKey, {
            data: content,
            timestamp: Date.now(),
          });
        }

        return { content, tokensUsed, cached: false };
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.retries - 1) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    this.metrics.errors++;
    throw lastError || new Error('Failed to call Claude API');
  }

  /**
   * Calculate cost in USD
   */
  protected calculateCost(tokens: number): number {
    // Pricing as of June 2026
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-opus-4-8': { input: 0.015, output: 0.045 },
      'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
      'claude-haiku-4-5-20251001': { input: 0.0008, output: 0.004 },
    };

    const rate = pricing[this.config.model];
    // Rough average of 1/3 input, 2/3 output
    return (tokens * ((rate.input + rate.output * 2) / 3)) / 1000;
  }

  /**
   * Validate output quality
   */
  protected async validateQuality(output: any): Promise<number> {
    // 0-100 score
    // Override in subclasses for specific validation
    return 80;
  }

  /**
   * Clear old cache entries
   */
  protected clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL * 1000) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): BotMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      executionTime: 0,
      tokensUsed: 0,
      cacheHits: 0,
      costUSD: 0,
      qualityScore: 0,
      errors: 0,
    };
  }

  // Abstract methods to implement in subclasses
  abstract execute(input: any): Promise<BotResult<any>>;
}
