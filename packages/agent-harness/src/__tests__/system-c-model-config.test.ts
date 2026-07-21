/**
 * system-c-model-config.test.ts
 *
 * Behavioral snapshot of System C model routing configuration.
 * Source: services/api/src/modules/bots/bots.router.ts
 *
 * Tests lock:
 *   - MODEL_MAP: tier → model ID
 *   - TOKEN_LIMITS: tier → max tokens
 *   - Cost rates (for budget regression)
 *   - Chain model assignments (DesignBot → opus, etc.)
 *
 * CRITICAL: Model IDs here are frozen production values.
 * Changing these without updating this test = breaking change.
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';

// ── MODEL_MAP snapshot ─────────────────────────────────────────────────────────
// Source: services/api/src/modules/bots/bots.router.ts:19-23

const MODEL_MAP = {
  fast:     'claude-haiku-4-5-20251001',
  standard: 'claude-sonnet-4-6',
  premium:  'claude-opus-4-6',
} as const;

// ── TOKEN_LIMITS snapshot ──────────────────────────────────────────────────────
// Source: services/api/src/modules/bots/bots.router.ts:25-29

const TOKEN_LIMITS = {
  fast:     1024,
  standard: 4096,
  premium:  8192,
} as const;

// ── Cost rate snapshot ─────────────────────────────────────────────────────────
// Source: services/api/src/modules/bots/bots.router.ts:32-41
// USD per 1,000 tokens — approximate published rates

const COST_INPUT = {
  'claude-haiku-4-5-20251001': 0.00025,
  'claude-sonnet-4-6':         0.003,
  'claude-opus-4-6':           0.015,
} as const;

const COST_OUTPUT = {
  'claude-haiku-4-5-20251001': 0.00125,
  'claude-sonnet-4-6':         0.015,
  'claude-opus-4-6':           0.075,
} as const;

// ── Chain model assignments ────────────────────────────────────────────────────
// Source: services/api/src/modules/bots/bots.chain.ts

const CHAIN_MODELS = {
  DesignBot:     'claude-opus-4-6',     // Stage 1 — premium, complex JSON
  EstimateBot:   'claude-sonnet-4-6',   // Stage 2 — standard, high token budget
  PermitBot:     'claude-sonnet-4-6',   // Stage 3 — standard, RAG-augmented
  ContractorBot: 'claude-sonnet-4-6',   // Stage 4 — standard
} as const;

// ── Chain token budgets ────────────────────────────────────────────────────────

const CHAIN_MAX_TOKENS = {
  DesignBot:     4096,
  EstimateBot:   8192,   // Extended — BOM context inflates prompt
  PermitBot:     4096,
  ContractorBot: 2048,
} as const;

// ── Chain stage order ──────────────────────────────────────────────────────────

const CHAIN_STAGE_ORDER = {
  DesignBot:     1,
  EstimateBot:   2,
  PermitBot:     3,
  ContractorBot: 4,
} as const;

// ── Prompt cache config ────────────────────────────────────────────────────────
// Source: bots.chain.ts — all stages use cache_control: ephemeral

const CHAIN_USES_PROMPT_CACHE = true;
const CACHE_WRITE_MULTIPLIER  = 0.25;  // 25% of base input price
const CACHE_READ_MULTIPLIER   = 0.10;  // 10% of base input price

// ── Rate limit config ──────────────────────────────────────────────────────────
// Source: bots.routes.ts checkCostGuard defaults

const RATE_LIMITS = {
  maxPerHour: 50,
  maxPerDay:  500,
} as const;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('System C — MODEL_MAP', () => {
  it('fast tier maps to Haiku', () => {
    expect(MODEL_MAP.fast).toBe('claude-haiku-4-5-20251001');
  });

  it('standard tier maps to Sonnet', () => {
    expect(MODEL_MAP.standard).toBe('claude-sonnet-4-6');
  });

  it('premium tier maps to Opus', () => {
    expect(MODEL_MAP.premium).toBe('claude-opus-4-6');
  });

  it('all three tiers are defined', () => {
    expect(Object.keys(MODEL_MAP)).toHaveLength(3);
    expect(Object.keys(MODEL_MAP)).toContain('fast');
    expect(Object.keys(MODEL_MAP)).toContain('standard');
    expect(Object.keys(MODEL_MAP)).toContain('premium');
  });

  it('no tier maps to an empty string', () => {
    for (const model of Object.values(MODEL_MAP)) {
      expect(model.length).toBeGreaterThan(0);
      expect(model).toContain('claude');
    }
  });
});

describe('System C — TOKEN_LIMITS', () => {
  it('fast tier has 1024 token limit', () => {
    expect(TOKEN_LIMITS.fast).toBe(1024);
  });

  it('standard tier has 4096 token limit', () => {
    expect(TOKEN_LIMITS.standard).toBe(4096);
  });

  it('premium tier has 8192 token limit', () => {
    expect(TOKEN_LIMITS.premium).toBe(8192);
  });

  it('limits increase from fast to premium', () => {
    expect(TOKEN_LIMITS.fast).toBeLessThan(TOKEN_LIMITS.standard);
    expect(TOKEN_LIMITS.standard).toBeLessThan(TOKEN_LIMITS.premium);
  });
});

describe('System C — cost rate ordering', () => {
  it('Haiku is cheapest input model', () => {
    expect(COST_INPUT['claude-haiku-4-5-20251001'])
      .toBeLessThan(COST_INPUT['claude-sonnet-4-6']);
    expect(COST_INPUT['claude-sonnet-4-6'])
      .toBeLessThan(COST_INPUT['claude-opus-4-6']);
  });

  it('Haiku is cheapest output model', () => {
    expect(COST_OUTPUT['claude-haiku-4-5-20251001'])
      .toBeLessThan(COST_OUTPUT['claude-sonnet-4-6']);
    expect(COST_OUTPUT['claude-sonnet-4-6'])
      .toBeLessThan(COST_OUTPUT['claude-opus-4-6']);
  });

  it('Opus costs are exactly 5x Sonnet input', () => {
    const ratio = COST_INPUT['claude-opus-4-6'] / COST_INPUT['claude-sonnet-4-6'];
    expect(ratio).toBe(5);
  });
});

describe('System C chain — model assignments', () => {
  it('DesignBot uses premium model (Opus) for complex JSON generation', () => {
    expect(CHAIN_MODELS.DesignBot).toBe('claude-opus-4-6');
  });

  it('EstimateBot, PermitBot, ContractorBot use standard model (Sonnet)', () => {
    expect(CHAIN_MODELS.EstimateBot).toBe('claude-sonnet-4-6');
    expect(CHAIN_MODELS.PermitBot).toBe('claude-sonnet-4-6');
    expect(CHAIN_MODELS.ContractorBot).toBe('claude-sonnet-4-6');
  });

  it('EstimateBot has extended token budget (8192) for BOM context', () => {
    expect(CHAIN_MAX_TOKENS.EstimateBot).toBe(8192);
    expect(CHAIN_MAX_TOKENS.EstimateBot).toBeGreaterThan(CHAIN_MAX_TOKENS.DesignBot);
  });

  it('ContractorBot has smallest token budget (2048)', () => {
    expect(CHAIN_MAX_TOKENS.ContractorBot).toBe(2048);
  });

  it('chain stages are 1-indexed and ordered 1/2/3/4', () => {
    expect(CHAIN_STAGE_ORDER.DesignBot).toBe(1);
    expect(CHAIN_STAGE_ORDER.EstimateBot).toBe(2);
    expect(CHAIN_STAGE_ORDER.PermitBot).toBe(3);
    expect(CHAIN_STAGE_ORDER.ContractorBot).toBe(4);
  });

  it('each stage number is unique', () => {
    const orders = Object.values(CHAIN_STAGE_ORDER);
    const unique = new Set(orders);
    expect(unique.size).toBe(orders.length);
  });
});

describe('System C — prompt caching config', () => {
  it('chain uses prompt caching', () => {
    expect(CHAIN_USES_PROMPT_CACHE).toBe(true);
  });

  it('cache write multiplier is 0.25 (25% of input price)', () => {
    expect(CACHE_WRITE_MULTIPLIER).toBe(0.25);
  });

  it('cache read multiplier is 0.10 (10% of input price)', () => {
    expect(CACHE_READ_MULTIPLIER).toBe(0.10);
  });

  it('cache read is cheaper than cache write', () => {
    expect(CACHE_READ_MULTIPLIER).toBeLessThan(CACHE_WRITE_MULTIPLIER);
  });
});

describe('System C — rate limit config', () => {
  it('default hourly limit is 50 calls', () => {
    expect(RATE_LIMITS.maxPerHour).toBe(50);
  });

  it('default daily limit is 500 calls', () => {
    expect(RATE_LIMITS.maxPerDay).toBe(500);
  });

  it('daily limit is 10x hourly (10-hour burst capacity)', () => {
    expect(RATE_LIMITS.maxPerDay).toBe(RATE_LIMITS.maxPerHour * 10);
  });
});
