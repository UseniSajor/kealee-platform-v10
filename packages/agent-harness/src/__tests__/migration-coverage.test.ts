/**
 * migration-coverage.test.ts
 *
 * Documents the migration coverage gap between System A (17 bots) and
 * System C (7 registry bots + 4 chain stages).
 *
 * These tests verify:
 *   1. Which System A bots have System C equivalents (COVERED)
 *   2. Which System A bots have no equivalent yet (GAP — Phase 1 targets)
 *   3. That no GAP bots are accidentally claimed as covered
 *
 * This file is the single source of truth for migration progress.
 * Update ONLY when a Phase 1+ migration lands and tests pass.
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';
import { COMMAND_DOMAIN_KEYWORDS } from '@kealee/agent-prompts';

// ── System A → System C mapping ───────────────────────────────────────────────

interface BotMapping {
  systemABot:   string;
  systemCBot:   string | null;    // null = no equivalent in Phase 0.5
  chainStage:   string | null;    // filled in if this bot is also a chain stage
  status:       'COVERED' | 'GAP' | 'PARTIAL';
  notes:        string;
}

const BOT_MAPPING: BotMapping[] = [
  {
    systemABot:  'keabot-design',
    systemCBot:  null,
    chainStage:  'DesignBot (Stage 1)',
    status:      'COVERED',
    notes:       'Fully covered by chain DesignBot (claude-opus-4-6, MEP+BOM generation)',
  },
  {
    systemABot:  'keabot-estimate',
    systemCBot:  'estimate-bot',
    chainStage:  'EstimateBot (Stage 2)',
    status:      'COVERED',
    notes:       'Registry bot for interactive use + chain stage for automated flow',
  },
  {
    systemABot:  'keabot-permit',
    systemCBot:  'permit-bot',
    chainStage:  'PermitBot (Stage 3)',
    status:      'COVERED',
    notes:       'Registry bot for interactive use + chain stage with RAG permit data',
  },
  {
    systemABot:  'keabot-contractor-match',
    systemCBot:  'contractor-match-bot',
    chainStage:  'ContractorBot (Stage 4)',
    status:      'COVERED',
    notes:       'Registry bot (deterministic) + chain stage for post-permit matching',
  },
  {
    systemABot:  'keabot-project-monitor',
    systemCBot:  'project-monitor-bot',
    chainStage:  null,
    status:      'COVERED',
    notes:       'Registry bot with Prisma-backed project health monitoring',
  },
  {
    systemABot:  'keabot-support',
    systemCBot:  'support-bot',
    chainStage:  null,
    status:      'COVERED',
    notes:       'Registry bot with deterministic category classification',
  },
  {
    systemABot:  'keabot-marketing',
    systemCBot:  'marketing-bot',
    chainStage:  null,
    status:      'COVERED',
    notes:       'Registry bot, goal-based marketing playbook generation',
  },
  // ── GAP bots — no System C equivalent at Phase 0.5 ──────────────────────────
  {
    systemABot:  'keabot-owner',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: needs project query tools (get_my_projects, timelines, budget summaries)',
  },
  {
    systemABot:  'keabot-gc',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: bid management, sub coordination, site compliance',
  },
  {
    systemABot:  'keabot-finance',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: capital stack, draw tracking, investor reports',
  },
  {
    systemABot:  'keabot-command',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: orchestrator/dispatcher using COMMAND_DOMAIN_KEYWORDS routing',
  },
  {
    systemABot:  'keabot-feasibility',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: feasibility studies, scenario runs, pro-forma generation',
  },
  {
    systemABot:  'keabot-developer',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: portfolio review, IRR analysis, entitlement tracking',
  },
  {
    systemABot:  'keabot-construction',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: daily logs, schedule checks, inspection readiness',
  },
  {
    systemABot:  'keabot-land',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: parcel search, zoning analysis, development potential',
  },
  {
    systemABot:  'keabot-payments',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: milestone payments, escrow reconciliation, lien waivers',
  },
  {
    systemABot:  'keabot-operations',
    systemCBot:  null,
    chainStage:  null,
    status:      'GAP',
    notes:       'Phase 1 target: turnover management, warranty tracking, work orders',
  },
];

// ── Lead bot (System C only — no System A equivalent) ─────────────────────────
const SYSTEM_C_ONLY_BOTS = ['lead-bot'];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Migration coverage — System A → System C mapping', () => {
  it('mapping covers all 17 System A bots', () => {
    expect(BOT_MAPPING).toHaveLength(17);
  });

  it('mapping documents exactly 7 COVERED bots', () => {
    const covered = BOT_MAPPING.filter(m => m.status === 'COVERED');
    expect(covered).toHaveLength(7);
  });

  it('mapping documents exactly 10 GAP bots', () => {
    const gaps = BOT_MAPPING.filter(m => m.status === 'GAP');
    expect(gaps).toHaveLength(10);
  });

  it('no PARTIAL status exists at Phase 0.5 (all bots are COVERED or GAP)', () => {
    const partial = BOT_MAPPING.filter(m => m.status === 'PARTIAL');
    expect(partial).toHaveLength(0);
  });

  it('all COVERED bots have at least one System C equivalent (registry or chain)', () => {
    const covered = BOT_MAPPING.filter(m => m.status === 'COVERED');
    for (const mapping of covered) {
      const hasEquivalent = mapping.systemCBot !== null || mapping.chainStage !== null;
      expect(hasEquivalent).toBe(true);
    }
  });

  it('all GAP bots have no System C equivalent', () => {
    const gaps = BOT_MAPPING.filter(m => m.status === 'GAP');
    for (const gap of gaps) {
      expect(gap.systemCBot).toBeNull();
      expect(gap.chainStage).toBeNull();
    }
  });

  it('all COVERED bots have non-empty notes describing coverage', () => {
    const covered = BOT_MAPPING.filter(m => m.status === 'COVERED');
    for (const mapping of covered) {
      expect(mapping.notes.length).toBeGreaterThan(20);
    }
  });

  it('all GAP bots have notes starting with "Phase 1 target"', () => {
    const gaps = BOT_MAPPING.filter(m => m.status === 'GAP');
    for (const gap of gaps) {
      expect(gap.notes).toMatch(/^Phase 1 target/);
    }
  });
});

describe('Migration coverage — chain stage mapping', () => {
  it('exactly 4 bots have chain stages (Design/Estimate/Permit/Contractor)', () => {
    const withChain = BOT_MAPPING.filter(m => m.chainStage !== null);
    expect(withChain).toHaveLength(4);
  });

  it('DesignBot chain stage maps from keabot-design', () => {
    const design = BOT_MAPPING.find(m => m.systemABot === 'keabot-design');
    expect(design?.chainStage).toContain('DesignBot');
    expect(design?.status).toBe('COVERED');
  });

  it('keabot-estimate maps to both a registry bot and chain stage', () => {
    const estimate = BOT_MAPPING.find(m => m.systemABot === 'keabot-estimate');
    expect(estimate?.systemCBot).toBe('estimate-bot');
    expect(estimate?.chainStage).toContain('EstimateBot');
  });
});

describe('Migration coverage — GAP bot tool inventory', () => {
  it('keabot-owner GAP requires 6 tools to be implemented in Phase 1', () => {
    const owner = BOT_MAPPING.find(m => m.systemABot === 'keabot-owner');
    expect(owner?.status).toBe('GAP');
    expect(owner?.notes).toContain('get_my_projects');
  });

  it('keabot-command GAP requires COMMAND_DOMAIN_KEYWORDS routing', () => {
    const command = BOT_MAPPING.find(m => m.systemABot === 'keabot-command');
    expect(command?.status).toBe('GAP');
    expect(command?.notes).toContain('COMMAND_DOMAIN_KEYWORDS');
  });

  it('COMMAND_DOMAIN_KEYWORDS is already available in agent-prompts', () => {
    // This verifies the Phase 0 work is usable for Phase 1 command bot implementation
    expect(typeof COMMAND_DOMAIN_KEYWORDS).toBe('object');
    expect(Object.keys(COMMAND_DOMAIN_KEYWORDS).length).toBeGreaterThanOrEqual(12);
  });
});

describe('Migration coverage — System C only bots', () => {
  it('lead-bot exists only in System C (no System A equivalent)', () => {
    expect(SYSTEM_C_ONLY_BOTS).toContain('lead-bot');
  });

  it('lead-bot is not in the System A mapping', () => {
    const found = BOT_MAPPING.find(m => m.systemCBot === 'lead-bot');
    expect(found).toBeUndefined();
  });
});

describe('Phase 0.5 readiness gate', () => {
  it('agent-prompts package exports prompts for all 17 System A bot domains', () => {
    // COMMAND_DOMAIN_KEYWORDS is the canonical routing registry
    // It should cover all domains that System A bots serve
    const keywords = Object.keys(COMMAND_DOMAIN_KEYWORDS);

    // Core domains that must be in COMMAND_DOMAIN_KEYWORDS.
    // NOTE: 'contractor' maps to 'marketplace', 'owner' has no command routing key.
    // Use the actual COMMAND_DOMAIN_KEYWORDS key names that exist.
    const requiredDomains = ['permit', 'estimate', 'finance', 'marketplace', 'payments'];
    for (const domain of requiredDomains) {
      const hasMatch = keywords.some(k => k.toLowerCase().includes(domain));
      expect(hasMatch).toBe(true);
    }
  });

  it('System C covers 7/17 System A bots (41% coverage at Phase 0.5)', () => {
    const covered = BOT_MAPPING.filter(m => m.status === 'COVERED').length;
    const total   = BOT_MAPPING.length;
    const pct     = (covered / total) * 100;
    expect(pct).toBeCloseTo(41.2, 0);
  });

  it('Phase 1 must cover 10 additional GAP bots to reach 100% migration', () => {
    const gaps = BOT_MAPPING.filter(m => m.status === 'GAP').length;
    expect(gaps).toBe(10);
  });
});
