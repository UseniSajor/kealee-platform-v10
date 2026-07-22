import { describe, expect, it } from 'vitest';
import { calculateSupportSlaDueAt } from '../../modules/support-automation/support-automation.service';

describe('support automation SLA', () => {
  const now = new Date('2026-07-22T12:00:00.000Z');
  it('escalates critical cases on a 15-minute SLA', () => {
    expect(calculateSupportSlaDueAt('CRITICAL', now).toISOString()).toBe('2026-07-22T12:15:00.000Z');
  });
  it('uses a one-day SLA for low urgency', () => {
    expect(calculateSupportSlaDueAt('LOW', now).toISOString()).toBe('2026-07-23T12:00:00.000Z');
  });
});
