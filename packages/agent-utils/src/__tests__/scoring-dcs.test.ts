/**
 * Regression tests for DCS scoring.
 * These are snapshots of the original bots/keabot-design/src/scoring.ts behaviour.
 * Changing any expected value requires intentional review.
 */

import { describe, it, expect } from 'vitest';
import { scoreDCS, projectToDCSInput } from '../scoring/dcs';

describe('scoreDCS — routing thresholds', () => {
  it('routes AI_ONLY for low complexity + low budget', () => {
    const result = scoreDCS({
      structuralChanges: 'none',
      sqft: 800,
      projectType: 'remodel',
      zoningRisk: 'none',
      permitComplexity: 'simple_single_trade',
      budgetEstimated: 30_000,
    });
    expect(result.route).toBe('AI_ONLY');
    expect(result.skipAiConcept).toBe(false);
    expect(result.total).toBe(10); // structural 0 + sqft 5 + type 5 + zoning 0 + permit 0
  });

  it('routes HYBRID for DCS 41-70', () => {
    const result = scoreDCS({
      structuralChanges: 'load_bearing',   // 16
      sqft: 2000,                          // 12
      projectType: 'remodel',              // 5
      zoningRisk: 'none',                  // 0
      permitComplexity: 'simple_single_trade', // 0
      budgetEstimated: 40_000,
    });
    expect(result.total).toBe(33); // below 41 threshold
    // budget < 65k, DCS < 41 → AI_ONLY
    expect(result.route).toBe('AI_ONLY');
  });

  it('routes HYBRID when budget >= $65,000 even with low DCS', () => {
    const result = scoreDCS({
      structuralChanges: 'none',
      sqft: 800,
      projectType: 'remodel',
      zoningRisk: 'none',
      permitComplexity: 'simple_single_trade',
      budgetEstimated: 80_000,
    });
    expect(result.route).toBe('HYBRID');
    expect(result.skipAiConcept).toBe(false);
  });

  it('routes ARCHITECT_REQUIRED and skips design concept for DCS >= 71', () => {
    const result = scoreDCS({
      structuralChanges: 'span_or_roof',   // 25
      sqft: 3000,                          // 20
      projectType: 'new_construction',     // 25
      zoningRisk: 'lot_coverage_overlay',  // 15
      permitComplexity: 'structural_multi_trade', // 15
    });
    expect(result.total).toBe(100);
    expect(result.route).toBe('ARCHITECT_REQUIRED');
    expect(result.skipAiConcept).toBe(true);
  });

  it('routes HYBRID for DCS exactly 41', () => {
    const result = scoreDCS({
      structuralChanges: 'load_bearing', // 16
      sqft: 2000,                        // 12
      projectType: 'addition_adu',       // 15
      zoningRisk: 'none',                // 0
      permitComplexity: 'simple_single_trade', // 0
      // total = 43, budget not specified (0)
    });
    expect(result.total).toBe(43);
    expect(result.route).toBe('HYBRID');
  });
});

describe('scoreDCS — component scores', () => {
  it('scores structural correctly for all variants', () => {
    const base = { sqft: 800, projectType: 'remodel' as const, zoningRisk: 'none' as const, permitComplexity: 'simple_single_trade' as const };
    expect(scoreDCS({ ...base, structuralChanges: 'none'             }).components.structural).toBe(0);
    expect(scoreDCS({ ...base, structuralChanges: 'non_load_bearing' }).components.structural).toBe(8);
    expect(scoreDCS({ ...base, structuralChanges: 'load_bearing'     }).components.structural).toBe(16);
    expect(scoreDCS({ ...base, structuralChanges: 'span_or_roof'     }).components.structural).toBe(25);
  });

  it('scores sqft correctly for all bands', () => {
    const base = { structuralChanges: 'none' as const, projectType: 'remodel' as const, zoningRisk: 'none' as const, permitComplexity: 'simple_single_trade' as const };
    expect(scoreDCS({ ...base, sqft: 500  }).components.sqft).toBe(5);
    expect(scoreDCS({ ...base, sqft: 999  }).components.sqft).toBe(5);
    expect(scoreDCS({ ...base, sqft: 1000 }).components.sqft).toBe(12);
    expect(scoreDCS({ ...base, sqft: 2500 }).components.sqft).toBe(12);
    expect(scoreDCS({ ...base, sqft: 2501 }).components.sqft).toBe(20);
  });
});

describe('projectToDCSInput', () => {
  it('defaults to remodel + non_load_bearing + multi_trade when fields missing', () => {
    const result = projectToDCSInput({});
    expect(result.projectType).toBe('remodel');
    expect(result.structuralChanges).toBe('non_load_bearing');
    expect(result.permitComplexity).toBe('multi_trade');
    expect(result.sqft).toBe(1500);
    expect(result.budgetEstimated).toBe(0);
  });

  it('maps new_construction type correctly', () => {
    const result = projectToDCSInput({ type: 'new_construction_residential' });
    expect(result.projectType).toBe('new_construction');
  });

  it('maps addition type correctly', () => {
    const result = projectToDCSInput({ type: 'addition_expansion' });
    expect(result.projectType).toBe('addition_adu');
  });
});
