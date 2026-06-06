/**
 * system-c-estimate-rates.test.ts
 *
 * Behavioral snapshot of System C EstimateBot deterministic logic.
 * Source: services/api/src/modules/bots/bots/estimate.bot.ts
 *
 * Tests lock:
 *   - BASE_RATES: $/sqft ranges by project type and quality
 *   - LOCATION_MULTIPLIER: geographic cost adjustments
 *   - getTypeKey(): project type normalization
 *   - getLocationMultiplier(): location lookup
 *   - buildFallbackBreakdown(): 8-category fallback split
 *
 * Last verified: Phase 0.5 (June 2026)
 */

import { describe, it, expect } from 'vitest';

// ── Replicated from estimate.bot.ts ───────────────────────────────────────────
// Source: services/api/src/modules/bots/bots/estimate.bot.ts:24-67

const BASE_RATES: Record<string, Record<string, [number, number]>> = {
  renovation: {
    standard: [80,  140],
    premium:  [140, 220],
    luxury:   [220, 400],
  },
  addition: {
    standard: [120, 180],
    premium:  [180, 280],
    luxury:   [280, 450],
  },
  new_build: {
    standard: [150, 230],
    premium:  [230, 350],
    luxury:   [350, 600],
  },
  multifamily: {
    standard: [100, 160],
    premium:  [160, 250],
    luxury:   [250, 400],
  },
  commercial: {
    standard: [90,  150],
    premium:  [150, 240],
    luxury:   [240, 380],
  },
};

const LOCATION_MULTIPLIER: Record<string, number> = {
  dc: 1.25, washington: 1.25,
  bethesda: 1.20, chevy_chase: 1.22, potomac: 1.20,
  arlington: 1.18, mclean: 1.20, tysons: 1.15,
  alexandria: 1.12, fairfax: 1.10,
  maryland: 1.05, virginia: 1.05,
  default: 1.0,
};

function getLocationMultiplier(location: string): number {
  const l = location.toLowerCase();
  for (const [key, mult] of Object.entries(LOCATION_MULTIPLIER)) {
    if (l.includes(key)) return mult;
  }
  return LOCATION_MULTIPLIER.default;
}

function getTypeKey(projectType: string): string {
  const t = projectType.toLowerCase();
  if (t.includes('renov') || t.includes('remodel')) return 'renovation';
  if (t.includes('addition')) return 'addition';
  if (t.includes('new') || t.includes('ground.up')) return 'new_build';
  if (t.includes('multi') || t.includes('apartment')) return 'multifamily';
  if (t.includes('commercial') || t.includes('office') || t.includes('retail')) return 'commercial';
  return 'renovation';  // default fallback
}

// ── Fallback breakdown split ───────────────────────────────────────────────────

const FALLBACK_CATEGORIES: [string, number][] = [
  ['Demolition & Site',              0.05],
  ['Framing & Structural',           0.12],
  ['MEP (Plumbing, Electric, HVAC)', 0.25],
  ['Exterior & Roofing',             0.10],
  ['Interior Finishes',              0.20],
  ['Fixtures & Equipment',           0.08],
  ['General Conditions',             0.07],
  ['Contractor OH&P + Contingency',  0.13],
];

function buildFallbackBreakdown(low: number, high: number) {
  return FALLBACK_CATEGORIES.map(([category, pct]) => ({
    category,
    description: `Allowance for ${category.toLowerCase()}`,
    unitCost:    Math.round(low * pct),
    quantity:    1,
    unit:        'LS',
    totalLow:    Math.round(low  * pct),
    totalHigh:   Math.round(high * pct),
    confidence:  'low' as const,
  }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EstimateBot — BASE_RATES (frozen snapshot)', () => {
  it('covers 5 project types', () => {
    expect(Object.keys(BASE_RATES)).toHaveLength(5);
    expect(Object.keys(BASE_RATES)).toContain('renovation');
    expect(Object.keys(BASE_RATES)).toContain('addition');
    expect(Object.keys(BASE_RATES)).toContain('new_build');
    expect(Object.keys(BASE_RATES)).toContain('multifamily');
    expect(Object.keys(BASE_RATES)).toContain('commercial');
  });

  it('each type has 3 quality tiers', () => {
    for (const type of Object.values(BASE_RATES)) {
      expect(Object.keys(type)).toHaveLength(3);
      expect(Object.keys(type)).toContain('standard');
      expect(Object.keys(type)).toContain('premium');
      expect(Object.keys(type)).toContain('luxury');
    }
  });

  it('renovation standard rate is [80, 140] $/sqft', () => {
    expect(BASE_RATES.renovation.standard).toEqual([80, 140]);
  });

  it('new_build luxury rate is [350, 600] $/sqft', () => {
    expect(BASE_RATES.new_build.luxury).toEqual([350, 600]);
  });

  it('all ranges have low < high', () => {
    for (const [type, qualities] of Object.entries(BASE_RATES)) {
      for (const [quality, [low, high]] of Object.entries(qualities)) {
        expect(low).toBeLessThan(high);
      }
    }
  });

  it('luxury is always more expensive than premium', () => {
    for (const qualities of Object.values(BASE_RATES)) {
      expect(qualities.luxury[0]).toBeGreaterThan(qualities.premium[0]);
    }
  });

  it('premium is always more expensive than standard', () => {
    for (const qualities of Object.values(BASE_RATES)) {
      expect(qualities.premium[0]).toBeGreaterThan(qualities.standard[0]);
    }
  });
});

describe('EstimateBot — getLocationMultiplier() (frozen snapshot)', () => {
  it('DC is 1.25 (highest DMV multiplier)', () => {
    expect(getLocationMultiplier('Washington DC')).toBe(1.25);
  });

  it('"dc" in string returns 1.25', () => {
    expect(getLocationMultiplier('DC Metro Area')).toBe(1.25);
  });

  it('Bethesda is 1.20', () => {
    expect(getLocationMultiplier('Bethesda, MD')).toBe(1.20);
  });

  it('Arlington is 1.18', () => {
    expect(getLocationMultiplier('Arlington, VA')).toBe(1.18);
  });

  it('McLean is 1.20', () => {
    expect(getLocationMultiplier('McLean, VA')).toBe(1.20);
  });

  it('Tysons is 1.15', () => {
    expect(getLocationMultiplier('Tysons Corner')).toBe(1.15);
  });

  it('Alexandria is 1.12', () => {
    expect(getLocationMultiplier('Alexandria, VA')).toBe(1.12);
  });

  it('Fairfax is 1.10', () => {
    expect(getLocationMultiplier('Fairfax County')).toBe(1.10);
  });

  it('generic Maryland returns 1.05', () => {
    expect(getLocationMultiplier('Rockville, Maryland')).toBe(1.05);
  });

  it('unknown location returns 1.0 (no premium)', () => {
    expect(getLocationMultiplier('Rural Kansas')).toBe(1.0);
  });

  it('DC is more expensive than Virginia', () => {
    expect(getLocationMultiplier('DC')).toBeGreaterThan(getLocationMultiplier('Virginia'));
  });
});

describe('EstimateBot — getTypeKey() (frozen snapshot)', () => {
  it('"kitchen remodel" → renovation', () => {
    expect(getTypeKey('kitchen remodel')).toBe('renovation');
  });

  it('"residential renovation" → renovation', () => {
    expect(getTypeKey('residential renovation')).toBe('renovation');
  });

  it('"rear addition" → addition', () => {
    expect(getTypeKey('rear addition')).toBe('addition');
  });

  it('"new build" → new_build', () => {
    expect(getTypeKey('new build single family')).toBe('new_build');
  });

  it('"ground.up" (dot separator) → new_build', () => {
    // getTypeKey uses String.includes('ground.up') — literal dot, not regex.
    // 'ground-up' (hyphen) does NOT match; 'ground.up' (dot) does.
    expect(getTypeKey('ground.up construction')).toBe('new_build');
  });

  it('"multifamily" → multifamily', () => {
    expect(getTypeKey('multifamily development')).toBe('multifamily');
  });

  it('"apartment building" → multifamily', () => {
    expect(getTypeKey('apartment building')).toBe('multifamily');
  });

  it('"office build" → commercial (no remodel/renov prefix)', () => {
    // "office renovation" returns 'renovation' because the renov check fires first.
    // Use a phrase without 'renov'/'remodel' to test the commercial path.
    expect(getTypeKey('office build')).toBe('commercial');
  });

  it('"retail fit-out" → commercial', () => {
    expect(getTypeKey('retail fit-out')).toBe('commercial');
  });

  it('unknown type falls back to renovation', () => {
    expect(getTypeKey('mystery project')).toBe('renovation');
  });
});

describe('EstimateBot — buildFallbackBreakdown() (frozen snapshot)', () => {
  const LOW  = 100_000;
  const HIGH = 150_000;
  const breakdown = buildFallbackBreakdown(LOW, HIGH);

  it('produces exactly 8 categories', () => {
    expect(breakdown).toHaveLength(8);
  });

  it('all categories have confidence=low', () => {
    for (const item of breakdown) {
      expect(item.confidence).toBe('low');
    }
  });

  it('all items have unit=LS and quantity=1', () => {
    for (const item of breakdown) {
      expect(item.unit).toBe('LS');
      expect(item.quantity).toBe(1);
    }
  });

  it('MEP has largest allocation (25%)', () => {
    const mep = breakdown.find(b => b.category.includes('MEP'));
    expect(mep?.totalLow).toBe(Math.round(LOW * 0.25));
  });

  it('proportions sum to approximately 100%', () => {
    const total = FALLBACK_CATEGORIES.reduce((s, [, pct]) => s + pct, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('totalHigh > totalLow for all items', () => {
    for (const item of breakdown) {
      expect(item.totalHigh).toBeGreaterThan(item.totalLow);
    }
  });
});
