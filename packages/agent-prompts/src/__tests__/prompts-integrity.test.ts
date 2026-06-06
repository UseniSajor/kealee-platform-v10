/**
 * Integrity tests for all agent system prompts.
 *
 * These tests verify:
 *   1. Every prompt exports a non-empty string
 *   2. Prompts contain their required domain keywords (rule enforcement)
 *   3. Context-aware prompt builders produce non-empty output
 *   4. No prompt contains placeholder text like "TODO" or "FIXME"
 *
 * If any of these fail, a prompt has been accidentally truncated or corrupted.
 */

import { describe, it, expect } from 'vitest';
import * as prompts from '../index';

// ─── All system prompt exports ────────────────────────────────────────────────

const SYSTEM_PROMPT_EXPORTS: Array<[string, string]> = [
  ['DESIGN_BOT_SYSTEM_PROMPT',      prompts.DESIGN_BOT_SYSTEM_PROMPT],
  ['MARKETING_BOT_SYSTEM_PROMPT',   prompts.MARKETING_BOT_SYSTEM_PROMPT],
  ['OWNER_BOT_SYSTEM_PROMPT',       prompts.OWNER_BOT_SYSTEM_PROMPT],
  ['GC_BOT_SYSTEM_PROMPT',          prompts.GC_BOT_SYSTEM_PROMPT],
  ['FINANCE_BOT_SYSTEM_PROMPT',     prompts.FINANCE_BOT_SYSTEM_PROMPT],
  ['DEVELOPER_BOT_SYSTEM_PROMPT',   prompts.DEVELOPER_BOT_SYSTEM_PROMPT],
  ['CONSTRUCTION_BOT_SYSTEM_PROMPT',prompts.CONSTRUCTION_BOT_SYSTEM_PROMPT],
  ['LAND_BOT_SYSTEM_PROMPT',        prompts.LAND_BOT_SYSTEM_PROMPT],
  ['PAYMENTS_BOT_SYSTEM_PROMPT',    prompts.PAYMENTS_BOT_SYSTEM_PROMPT],
  ['OPERATIONS_BOT_SYSTEM_PROMPT',  prompts.OPERATIONS_BOT_SYSTEM_PROMPT],
  ['FEASIBILITY_BOT_SYSTEM_PROMPT', prompts.FEASIBILITY_BOT_SYSTEM_PROMPT],
  ['COMMAND_BOT_SYSTEM_PROMPT',     prompts.COMMAND_BOT_SYSTEM_PROMPT],
  ['PERMIT_BOT_SYSTEM_PROMPT',      prompts.PERMIT_BOT_SYSTEM_PROMPT],
  ['PERMIT_ROADMAP_SYSTEM_PROMPT',  prompts.PERMIT_ROADMAP_SYSTEM_PROMPT],
  ['SUPPORT_BOT_SYSTEM_PROMPT',     prompts.SUPPORT_BOT_SYSTEM_PROMPT],
  ['ESTIMATE_BOT_SYSTEM_PROMPT',    prompts.ESTIMATE_BOT_SYSTEM_PROMPT],
];

describe('System prompt exports — non-empty and free of placeholders', () => {
  for (const [name, value] of SYSTEM_PROMPT_EXPORTS) {
    it(`${name} is a non-empty string`, () => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(100);
    });

    it(`${name} contains no TODO/FIXME placeholders`, () => {
      expect(value).not.toMatch(/\bTODO\b|\bFIXME\b|\bPLACEHOLDER\b/i);
    });
  }
});

// ─── Domain keyword requirements ─────────────────────────────────────────────

describe('System prompt domain rules', () => {
  it('design prompt mentions DesignBot and design concept', () => {
    expect(prompts.DESIGN_BOT_SYSTEM_PROMPT).toContain('DesignBot');
    expect(prompts.DESIGN_BOT_SYSTEM_PROMPT.toLowerCase()).toContain('concept');
  });

  it('permit prompt mentions jurisdiction', () => {
    expect(prompts.PERMIT_BOT_SYSTEM_PROMPT.toLowerCase()).toContain('jurisdiction');
  });

  it('permit roadmap prompt mentions DCRA (DC default)', () => {
    expect(prompts.PERMIT_ROADMAP_SYSTEM_PROMPT).toContain('DCRA');
  });

  it('estimate prompt mentions RSMeans', () => {
    expect(prompts.ESTIMATE_BOT_SYSTEM_PROMPT).toContain('RSMeans');
  });

  it('support prompt mentions empathy', () => {
    expect(prompts.SUPPORT_BOT_SYSTEM_PROMPT.toLowerCase()).toContain('empathy');
  });

  it('command prompt mentions orchestrator', () => {
    expect(prompts.COMMAND_BOT_SYSTEM_PROMPT.toLowerCase()).toContain('orchestrator');
  });

  it('all RAG-enabled prompts instruct calling retrieve_relevant_context', () => {
    const ragEnabled = [
      prompts.OWNER_BOT_SYSTEM_PROMPT,
      prompts.GC_BOT_SYSTEM_PROMPT,
      prompts.FEASIBILITY_BOT_SYSTEM_PROMPT,
      prompts.ESTIMATE_BOT_SYSTEM_PROMPT,
      prompts.PERMIT_BOT_SYSTEM_PROMPT,
      prompts.COMMAND_BOT_SYSTEM_PROMPT,
    ];
    for (const prompt of ragEnabled) {
      expect(prompt).toContain('retrieve_relevant_context');
    }
  });
});

// ─── Prompt builders ──────────────────────────────────────────────────────────

describe('buildConceptPrompt', () => {
  it('includes project type in output', () => {
    const ctx = {
      projectId: 'p1',
      projectType: 'residential' as const,
      buildingSqft: 2000,
      budget: 250_000,
      location: 'Washington DC',
      zoning: 'R-2',
    };
    const prompt = prompts.buildConceptPrompt(ctx);
    expect(prompt).toContain('residential');
    expect(prompt).toContain('Washington DC');
    expect(prompt).toContain('$250K');
  });

  it('handles missing optional fields gracefully', () => {
    const ctx = { projectId: 'p2', projectType: 'commercial' as const };
    const prompt = prompts.buildConceptPrompt(ctx);
    expect(prompt).toContain('Not specified');
    expect(prompt.length).toBeGreaterThan(100);
  });
});

describe('buildDay1SetupPrompt', () => {
  it('includes domain in output', () => {
    const prompt = prompts.buildDay1SetupPrompt({
      domain: 'kealee.com',
      businessEmail: 'hello@kealee.com',
      dnsProvider: 'Cloudflare',
    });
    expect(prompt).toContain('kealee.com');
    expect(prompt).toContain('Cloudflare');
  });
});

describe('buildPermitRoadmapUserPrompt', () => {
  it('includes project type and jurisdiction', () => {
    const prompt = prompts.buildPermitRoadmapUserPrompt({
      projectType: 'Kitchen Remodel',
      location: 'Washington DC',
      jurisdiction: 'DC DCRA',
      sqft: 500,
      structuralChanges: false,
      electricalChanges: true,
    });
    expect(prompt).toContain('Kitchen Remodel');
    expect(prompt).toContain('DC DCRA');
    expect(prompt).toContain('500');
  });
});

// ─── Handoff patterns ─────────────────────────────────────────────────────────

describe('COMMAND_DOMAIN_KEYWORDS', () => {
  it('covers 12 domains', () => {
    expect(Object.keys(prompts.COMMAND_DOMAIN_KEYWORDS).length).toBeGreaterThanOrEqual(12);
  });

  it('each pattern is a valid regex string', () => {
    for (const [domain, pattern] of Object.entries(prompts.COMMAND_DOMAIN_KEYWORDS)) {
      expect(() => new RegExp(pattern, 'i')).not.toThrow();
    }
  });
});
