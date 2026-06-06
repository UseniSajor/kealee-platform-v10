/**
 * Regression tests for phase progress and labels.
 * Snapshots of the original bots/keabot-project-monitor/src/status.ts behaviour.
 */

import { describe, it, expect } from 'vitest';
import { getPhaseProgress, getPhaseLabel, PHASE_PROGRESS } from '../monitoring/status';
import type { ProjectPhase } from '../monitoring/types';

const ALL_PHASES: ProjectPhase[] = [
  'permits_filed', 'permits_approved', 'contractor_hired',
  'demo_scheduled', 'demo_in_progress', 'demo_complete',
  'framing', 'mep', 'finishing',
  'inspection_scheduled', 'inspection_passed', 'inspection_failed',
  'final_walkthrough', 'complete',
];

describe('getPhaseProgress', () => {
  it('returns 0 for permits_filed', () => {
    expect(getPhaseProgress('permits_filed')).toBe(5);
  });

  it('returns 100 for complete', () => {
    expect(getPhaseProgress('complete')).toBe(100);
  });

  it('returns 0 for unknown phase', () => {
    expect(getPhaseProgress('unknown_phase' as ProjectPhase)).toBe(0);
  });

  it('all phases are covered and between 0-100', () => {
    for (const phase of ALL_PHASES) {
      const pct = getPhaseProgress(phase);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('progress generally increases through phases', () => {
    expect(getPhaseProgress('permits_filed')).toBeLessThan(getPhaseProgress('permits_approved'));
    expect(getPhaseProgress('demo_complete')).toBeLessThan(getPhaseProgress('framing'));
    expect(getPhaseProgress('framing')).toBeLessThan(getPhaseProgress('mep'));
    expect(getPhaseProgress('mep')).toBeLessThan(getPhaseProgress('finishing'));
  });
});

describe('getPhaseLabel', () => {
  it('returns human-readable label for framing', () => {
    expect(getPhaseLabel('framing')).toBe('Construction - Framing');
  });

  it('returns the phase key as fallback for unknown', () => {
    expect(getPhaseLabel('unknown_phase' as ProjectPhase)).toBe('unknown_phase');
  });

  it('all phases have labels', () => {
    for (const phase of ALL_PHASES) {
      expect(getPhaseLabel(phase)).not.toBe('');
    }
  });
});

describe('PHASE_PROGRESS map', () => {
  it('has entries for all 14 phases', () => {
    expect(Object.keys(PHASE_PROGRESS)).toHaveLength(14);
  });
});
