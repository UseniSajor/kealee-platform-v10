/**
 * Regression tests for milestone math.
 * Snapshots of the original bots/keabot-project-monitor/src/milestones.ts behaviour.
 */

import { describe, it, expect } from 'vitest';
import { buildMilestones, getNextMilestone, getMilestoneByTrigger } from '../monitoring/milestones';

describe('buildMilestones', () => {
  it('produces exactly 4 milestones', () => {
    const milestones = buildMilestones(100_000);
    expect(milestones).toHaveLength(4);
  });

  it('assigns correct percentages: 10/20/30/40', () => {
    const milestones = buildMilestones(100_000);
    expect(milestones[0].percentage).toBe(10);
    expect(milestones[1].percentage).toBe(20);
    expect(milestones[2].percentage).toBe(30);
    expect(milestones[3].percentage).toBe(40);
  });

  it('amounts sum to 100% of total', () => {
    const total = 200_000;
    const milestones = buildMilestones(total);
    const sum = milestones.reduce((acc, m) => acc + m.amount, 0);
    expect(sum).toBe(total);
  });

  it('all milestones start as unpaid', () => {
    const milestones = buildMilestones(50_000);
    expect(milestones.every(m => !m.paid)).toBe(true);
  });

  it('uses correct trigger strings', () => {
    const milestones = buildMilestones(100_000);
    expect(milestones[0].trigger).toBe('permit_approved');
    expect(milestones[1].trigger).toBe('demo_complete');
    expect(milestones[2].trigger).toBe('framing_complete');
    expect(milestones[3].trigger).toBe('final_inspection_passed');
  });
});

describe('getNextMilestone', () => {
  it('returns first unpaid milestone', () => {
    const milestones = buildMilestones(100_000);
    milestones[0].paid = true;
    const next = getNextMilestone(milestones);
    expect(next?.name).toBe('Demo');
  });

  it('returns null when all paid', () => {
    const milestones = buildMilestones(100_000);
    milestones.forEach(m => { m.paid = true; });
    expect(getNextMilestone(milestones)).toBeNull();
  });
});

describe('getMilestoneByTrigger', () => {
  it('finds milestone by trigger string', () => {
    const milestones = buildMilestones(100_000);
    const found = getMilestoneByTrigger(milestones, 'framing_complete');
    expect(found?.name).toBe('Framing');
  });

  it('returns null for unknown trigger', () => {
    const milestones = buildMilestones(100_000);
    expect(getMilestoneByTrigger(milestones, 'unknown_trigger')).toBeNull();
  });
});
