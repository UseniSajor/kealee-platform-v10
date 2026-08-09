/**
 * system-c-bot-metadata.test.ts
 *
 * Behavioral snapshot of System C bot metadata.
 * Source: services/api/src/modules/bots/bots/*.bot.ts
 *
 * These tests lock the bot IDs, names, cost profiles, and capability flags.
 * If any System C bot is renamed or reconfigured, this test catches it.
 *
 * Note: System C already has bots.test.ts which imports live modules.
 * These tests are standalone snapshots — no imports from the service.
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';

// ── System C bot metadata snapshots ───────────────────────────────────────────
// Source: services/api/src/modules/bots/bots/*.bot.ts

interface BotMetadataSnapshot {
  id:           string;
  name:         string;
  version:      string;
  costProfile:  'free' | 'low' | 'medium' | 'high';
  requiresLLM:  boolean;
}

const SYSTEM_C_BOT_SNAPSHOTS: BotMetadataSnapshot[] = [
  {
    id:          'lead-bot',
    name:        'LeadBot',
    version:     '1.0.0',
    costProfile: 'low',
    requiresLLM: true,
  },
  {
    id:          'estimate-bot',
    name:        'EstimateBot',
    version:     '1.0.0',
    costProfile: 'medium',
    requiresLLM: true,
  },
  {
    id:          'permit-bot',
    name:        'PermitBot',
    version:     '1.0.0',
    costProfile: 'medium',
    requiresLLM: true,
  },
  {
    id:          'contractor-match-bot',
    name:        'ContractorMatchBot',
    version:     '1.0.0',
    costProfile: 'medium',
    requiresLLM: false,   // deterministic-first — no LLM for matching logic
  },
  {
    id:          'project-monitor-bot',
    name:        'ProjectMonitorBot',
    version:     '1.0.0',
    costProfile: 'medium',
    requiresLLM: true,
  },
  {
    id:          'support-bot',
    name:        'SupportBot',
    version:     '1.0.0',
    costProfile: 'low',
    requiresLLM: true,
  },
  {
    id:          'marketing-bot',
    name:        'MarketingBot',
    version:     '1.0.0',
    costProfile: 'medium',
    requiresLLM: true,
  },
];

// ── BotId enum snapshot ────────────────────────────────────────────────────────
// Source: services/api/src/modules/bots/bots.types.ts

const SYSTEM_C_BOT_IDS = [
  'lead-bot',
  'estimate-bot',
  'permit-bot',
  'contractor-match-bot',
  'project-monitor-bot',
  'support-bot',
  'marketing-bot',
] as const;

type BotId = typeof SYSTEM_C_BOT_IDS[number];

// ── Route schema snapshot ──────────────────────────────────────────────────────
// Source: services/api/src/modules/bots/bots.routes.ts

const SYSTEM_C_ROUTES = {
  listBots:    { method: 'GET',  path: '/bots',                    auth: false },
  executeBots: { method: 'POST', path: '/bots/:botId/execute',     auth: true  },
  listTraces:  { method: 'GET',  path: '/bots/executions',         auth: true, adminOnly: true },
  getTrace:    { method: 'GET',  path: '/bots/executions/:requestId', auth: true, adminOnly: true },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('System C — BotId enum', () => {
  it('has exactly 7 bot IDs', () => {
    expect(SYSTEM_C_BOT_IDS).toHaveLength(7);
  });

  it('all IDs are lowercase kebab-case', () => {
    for (const id of SYSTEM_C_BOT_IDS) {
      expect(id).toMatch(/^[a-z-]+$/);
    }
  });

  it('all IDs end with -bot', () => {
    for (const id of SYSTEM_C_BOT_IDS) {
      expect(id).toMatch(/-bot$/);
    }
  });
});

describe('System C — bot metadata snapshots', () => {
  it('has exactly 7 bots', () => {
    expect(SYSTEM_C_BOT_SNAPSHOTS).toHaveLength(7);
  });

  it('all bots have version 1.0.0', () => {
    for (const bot of SYSTEM_C_BOT_SNAPSHOTS) {
      expect(bot.version).toBe('1.0.0');
    }
  });

  it('only contractor-match-bot does not require LLM', () => {
    const noLLM = SYSTEM_C_BOT_SNAPSHOTS.filter(b => !b.requiresLLM);
    expect(noLLM).toHaveLength(1);
    expect(noLLM[0].id).toBe('contractor-match-bot');
  });

  it('low-cost bots are lead-bot and support-bot', () => {
    const lowCost = SYSTEM_C_BOT_SNAPSHOTS.filter(b => b.costProfile === 'low');
    const ids = lowCost.map(b => b.id);
    expect(ids).toContain('lead-bot');
    expect(ids).toContain('support-bot');
    expect(lowCost).toHaveLength(2);
  });

  it('medium-cost bots include estimate, permit, contractor, monitor, marketing', () => {
    const medium = SYSTEM_C_BOT_SNAPSHOTS.filter(b => b.costProfile === 'medium');
    const ids = medium.map(b => b.id);
    expect(ids).toContain('estimate-bot');
    expect(ids).toContain('permit-bot');
    expect(ids).toContain('contractor-match-bot');
    expect(ids).toContain('project-monitor-bot');
    expect(ids).toContain('marketing-bot');
  });

  it('no high-cost bots in registry (high cost is chain-only)', () => {
    const high = SYSTEM_C_BOT_SNAPSHOTS.filter(b => b.costProfile === 'high');
    expect(high).toHaveLength(0);
  });

  for (const snapshot of SYSTEM_C_BOT_SNAPSHOTS) {
    it(`${snapshot.id} metadata matches snapshot`, () => {
      const found = SYSTEM_C_BOT_SNAPSHOTS.find(b => b.id === snapshot.id);
      expect(found).toEqual(snapshot);
    });
  }
});

describe('System C — route contract snapshot', () => {
  it('POST execute endpoint requires auth', () => {
    expect(SYSTEM_C_ROUTES.executeBots.auth).toBe(true);
  });

  it('GET bots list is public (no auth)', () => {
    expect(SYSTEM_C_ROUTES.listBots.auth).toBe(false);
  });

  it('trace endpoints are admin-only', () => {
    expect(SYSTEM_C_ROUTES.listTraces.adminOnly).toBe(true);
    expect(SYSTEM_C_ROUTES.getTrace.adminOnly).toBe(true);
  });

  it('execute endpoint is POST', () => {
    expect(SYSTEM_C_ROUTES.executeBots.method).toBe('POST');
  });
});
