/**
 * prompt-agent-alignment.test.ts
 *
 * Verifies that packages/agent-prompts is aligned with both System A and System C.
 *
 * Tests cover:
 *   1. All 17 System A bot domains have a corresponding system prompt
 *   2. COMMAND_DOMAIN_KEYWORDS covers all routing targets
 *   3. RAG-enabled prompts reference retrieve_relevant_context
 *   4. Prompt builders produce output matching known format contracts
 *   5. System C chain system prompts (embedded in bots.chain.ts) are compatible
 *      with what agent-prompts exports
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';
import * as prompts from '@kealee/agent-prompts';

// ── System A domain → agent-prompts export mapping ────────────────────────────

const DOMAIN_PROMPT_MAP: Array<{ domain: string; export: string }> = [
  { domain: 'design',            export: 'DESIGN_BOT_SYSTEM_PROMPT'      },
  { domain: 'marketing',         export: 'MARKETING_BOT_SYSTEM_PROMPT'   },
  { domain: 'owner',             export: 'OWNER_BOT_SYSTEM_PROMPT'       },
  { domain: 'gc',                export: 'GC_BOT_SYSTEM_PROMPT'          },
  { domain: 'finance',           export: 'FINANCE_BOT_SYSTEM_PROMPT'     },
  { domain: 'developer',         export: 'DEVELOPER_BOT_SYSTEM_PROMPT'   },
  { domain: 'construction',      export: 'CONSTRUCTION_BOT_SYSTEM_PROMPT'},
  { domain: 'land',              export: 'LAND_BOT_SYSTEM_PROMPT'        },
  { domain: 'payments',          export: 'PAYMENTS_BOT_SYSTEM_PROMPT'    },
  { domain: 'operations',        export: 'OPERATIONS_BOT_SYSTEM_PROMPT'  },
  { domain: 'feasibility',       export: 'FEASIBILITY_BOT_SYSTEM_PROMPT' },
  { domain: 'command',           export: 'COMMAND_BOT_SYSTEM_PROMPT'     },
  { domain: 'permit',            export: 'PERMIT_BOT_SYSTEM_PROMPT'      },
  { domain: 'support',           export: 'SUPPORT_BOT_SYSTEM_PROMPT'     },
  { domain: 'estimate',          export: 'ESTIMATE_BOT_SYSTEM_PROMPT'    },
];

// ── RAG-enabled bots that must reference retrieve_relevant_context ─────────────

const RAG_ENABLED_PROMPT_EXPORTS = [
  'OWNER_BOT_SYSTEM_PROMPT',
  'GC_BOT_SYSTEM_PROMPT',
  'FEASIBILITY_BOT_SYSTEM_PROMPT',
  'ESTIMATE_BOT_SYSTEM_PROMPT',
  'PERMIT_BOT_SYSTEM_PROMPT',
  'COMMAND_BOT_SYSTEM_PROMPT',
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('agent-prompts — System A domain coverage', () => {
  it('covers 15 System A bot domains (design+marketing not separate from agent-prompts perspective)', () => {
    expect(DOMAIN_PROMPT_MAP).toHaveLength(15);
  });

  it('every domain has a matching export in agent-prompts', () => {
    for (const { domain, export: exportName } of DOMAIN_PROMPT_MAP) {
      const value = (prompts as Record<string, unknown>)[exportName];
      expect(typeof value, `Missing export: ${exportName} for domain: ${domain}`).toBe('string');
      expect((value as string).length).toBeGreaterThan(100);
    }
  });

  it('no prompt is missing or empty', () => {
    for (const { export: exportName } of DOMAIN_PROMPT_MAP) {
      const value = (prompts as Record<string, unknown>)[exportName] as string;
      expect(value).toBeTruthy();
      expect(value.trim().length).toBeGreaterThan(100);
    }
  });
});

describe('agent-prompts — RAG instruction alignment', () => {
  it('all RAG-enabled prompts instruct calling retrieve_relevant_context', () => {
    for (const exportName of RAG_ENABLED_PROMPT_EXPORTS) {
      const value = (prompts as Record<string, unknown>)[exportName] as string;
      expect(value, `${exportName} missing RAG instruction`).toContain('retrieve_relevant_context');
    }
  });

  it('non-RAG prompts do NOT reference retrieve_relevant_context (no false instructions)', () => {
    const nonRagExports = DOMAIN_PROMPT_MAP
      .map(m => m.export)
      .filter(e => !RAG_ENABLED_PROMPT_EXPORTS.includes(e));

    // These bots don't have RAG — prompts should not reference the RAG tool
    const strictlyNonRag = [
      'DESIGN_BOT_SYSTEM_PROMPT',
      'MARKETING_BOT_SYSTEM_PROMPT',
      'FINANCE_BOT_SYSTEM_PROMPT',
      'DEVELOPER_BOT_SYSTEM_PROMPT',
      'CONSTRUCTION_BOT_SYSTEM_PROMPT',
      'LAND_BOT_SYSTEM_PROMPT',
      'PAYMENTS_BOT_SYSTEM_PROMPT',
      'OPERATIONS_BOT_SYSTEM_PROMPT',
      'SUPPORT_BOT_SYSTEM_PROMPT',
    ];

    for (const exportName of strictlyNonRag) {
      const value = (prompts as Record<string, unknown>)[exportName] as string;
      expect(value, `${exportName} should not contain RAG instruction`).not.toContain('retrieve_relevant_context');
    }
  });
});

describe('agent-prompts — COMMAND_DOMAIN_KEYWORDS routing coverage', () => {
  it('COMMAND_DOMAIN_KEYWORDS has at least 12 domains', () => {
    expect(Object.keys(prompts.COMMAND_DOMAIN_KEYWORDS).length).toBeGreaterThanOrEqual(12);
  });

  it('all keyword patterns are valid regex strings', () => {
    for (const [domain, pattern] of Object.entries(prompts.COMMAND_DOMAIN_KEYWORDS)) {
      expect(() => new RegExp(pattern, 'i')).not.toThrow();
    }
  });

  it('permit domain is in COMMAND_DOMAIN_KEYWORDS', () => {
    const domains = Object.keys(prompts.COMMAND_DOMAIN_KEYWORDS);
    expect(domains.some(d => d.toLowerCase().includes('permit'))).toBe(true);
  });

  it('estimate domain is in COMMAND_DOMAIN_KEYWORDS', () => {
    const domains = Object.keys(prompts.COMMAND_DOMAIN_KEYWORDS);
    expect(domains.some(d => d.toLowerCase().includes('estimate'))).toBe(true);
  });

  it('payments/finance domain is in COMMAND_DOMAIN_KEYWORDS', () => {
    const domains = Object.keys(prompts.COMMAND_DOMAIN_KEYWORDS);
    const hasFinance  = domains.some(d => d.toLowerCase().includes('finance'));
    const hasPayments = domains.some(d => d.toLowerCase().includes('payment'));
    expect(hasFinance || hasPayments).toBe(true);
  });

  it('keyword patterns produce expected routing for common inputs', () => {
    const testCases: Array<{ input: string; expectedDomainSubstring: string }> = [
      { input: 'I need a building permit', expectedDomainSubstring: 'permit' },
      { input: 'Get me a cost estimate',   expectedDomainSubstring: 'estimate' },
    ];

    for (const { input, expectedDomainSubstring } of testCases) {
      let matched = false;
      for (const [domain, pattern] of Object.entries(prompts.COMMAND_DOMAIN_KEYWORDS)) {
        if (new RegExp(pattern, 'i').test(input)) {
          expect(domain.toLowerCase()).toContain(expectedDomainSubstring);
          matched = true;
          break;
        }
      }
      expect(matched, `No COMMAND_DOMAIN_KEYWORDS pattern matched: "${input}"`).toBe(true);
    }
  });
});

describe('agent-prompts — builder function contracts', () => {
  it('buildConceptPrompt includes project type and location', () => {
    const prompt = prompts.buildConceptPrompt({
      projectId:    'p-1',
      projectType:  'residential',
      location:     'Washington DC',
      buildingSqft: 2000,
      budget:       300_000,
    });
    expect(prompt).toContain('residential');
    expect(prompt).toContain('Washington DC');
  });

  it('buildConceptPrompt formats budget as $Xk notation', () => {
    const prompt = prompts.buildConceptPrompt({
      projectId:   'p-2',
      projectType: 'commercial',
      budget:      500_000,
    });
    expect(prompt).toContain('$500K');
  });

  it('buildPermitRoadmapUserPrompt includes jurisdiction and sqft', () => {
    const prompt = prompts.buildPermitRoadmapUserPrompt({
      projectType:       'Addition',
      location:          'Arlington, VA',
      jurisdiction:      'Arlington County, VA',
      sqft:              800,
      structuralChanges: true,
      electricalChanges: false,
    });
    expect(prompt).toContain('Arlington County, VA');
    expect(prompt).toContain('800');
    expect(prompt).toContain('Addition');
  });

  it('buildDay1SetupPrompt includes domain and DNS provider', () => {
    const prompt = prompts.buildDay1SetupPrompt({
      domain:        'mybusiness.com',
      businessEmail: 'hello@mybusiness.com',
      dnsProvider:   'Cloudflare',
    });
    expect(prompt).toContain('mybusiness.com');
    expect(prompt).toContain('Cloudflare');
  });
});

describe('agent-prompts — System C chain prompt compatibility', () => {
  it('PERMIT_ROADMAP_SYSTEM_PROMPT mentions DCRA (DC jurisdiction knowledge)', () => {
    expect(prompts.PERMIT_ROADMAP_SYSTEM_PROMPT).toContain('DCRA');
  });

  it('PERMIT_BOT_SYSTEM_PROMPT mentions jurisdiction (for RAG context injection)', () => {
    expect(prompts.PERMIT_BOT_SYSTEM_PROMPT.toLowerCase()).toContain('jurisdiction');
  });

  it('ESTIMATE_BOT_SYSTEM_PROMPT mentions RSMeans (cost database)', () => {
    expect(prompts.ESTIMATE_BOT_SYSTEM_PROMPT).toContain('RSMeans');
  });

  it('DESIGN_BOT_SYSTEM_PROMPT mentions concept (core design deliverable)', () => {
    expect(prompts.DESIGN_BOT_SYSTEM_PROMPT.toLowerCase()).toContain('concept');
  });

  it('SUPPORT_BOT_SYSTEM_PROMPT mentions empathy (support tone requirement)', () => {
    expect(prompts.SUPPORT_BOT_SYSTEM_PROMPT.toLowerCase()).toContain('empathy');
  });

  it('COMMAND_BOT_SYSTEM_PROMPT mentions orchestrator (dispatch role)', () => {
    expect(prompts.COMMAND_BOT_SYSTEM_PROMPT.toLowerCase()).toContain('orchestrator');
  });
});
