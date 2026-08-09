/**
 * Regression tests for project issue detection.
 * Snapshots of the original bots/keabot-project-monitor/src/issues.ts behaviour.
 */

import { describe, it, expect } from 'vitest';
import { detectIssues } from '../monitoring/issues';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

describe('detectIssues — budget overrun', () => {
  it('does not flag when within budget', () => {
    const issues = detectIssues({ budgetSpent: 90_000, budgetTotal: 100_000, daysElapsed: 30, daysEstimated: 60 });
    expect(issues.some(i => i.type === 'BUDGET_OVERRUN')).toBe(false);
  });

  it('flags BUDGET_OVERRUN at 111% spend', () => {
    const issues = detectIssues({ budgetSpent: 111_000, budgetTotal: 100_000, daysElapsed: 30, daysEstimated: 60 });
    const overrun = issues.find(i => i.type === 'BUDGET_OVERRUN');
    expect(overrun).toBeDefined();
    expect(overrun?.severity).toBe('medium');
  });

  it('escalates to high severity at 126% spend', () => {
    const issues = detectIssues({ budgetSpent: 126_000, budgetTotal: 100_000, daysElapsed: 30, daysEstimated: 60 });
    const overrun = issues.find(i => i.type === 'BUDGET_OVERRUN');
    expect(overrun?.severity).toBe('high');
  });
});

describe('detectIssues — behind schedule', () => {
  it('does not flag when on schedule', () => {
    const issues = detectIssues({ budgetSpent: 0, budgetTotal: 100_000, daysElapsed: 50, daysEstimated: 60 });
    expect(issues.some(i => i.type === 'BEHIND_SCHEDULE')).toBe(false);
  });

  it('flags BEHIND_SCHEDULE at 121% of estimated days', () => {
    const issues = detectIssues({ budgetSpent: 0, budgetTotal: 100_000, daysElapsed: 121, daysEstimated: 100 });
    const behind = issues.find(i => i.type === 'BEHIND_SCHEDULE');
    expect(behind).toBeDefined();
    expect(behind?.severity).toBe('medium');
  });

  it('escalates to high severity when > 30 days late', () => {
    const issues = detectIssues({ budgetSpent: 0, budgetTotal: 100_000, daysElapsed: 135, daysEstimated: 100 });
    const behind = issues.find(i => i.type === 'BEHIND_SCHEDULE');
    expect(behind?.severity).toBe('high');
  });
});

describe('detectIssues — contractor unresponsive', () => {
  it('does not flag when contacted within 7 days', () => {
    const issues = detectIssues({ budgetSpent: 0, budgetTotal: 0, daysElapsed: 0, daysEstimated: 0, lastContractorContact: daysAgo(5) });
    expect(issues.some(i => i.type === 'CONTRACTOR_UNRESPONSIVE')).toBe(false);
  });

  it('flags at 8 days no contact', () => {
    const issues = detectIssues({ budgetSpent: 0, budgetTotal: 0, daysElapsed: 0, daysEstimated: 0, lastContractorContact: daysAgo(8) });
    const unresponsive = issues.find(i => i.type === 'CONTRACTOR_UNRESPONSIVE');
    expect(unresponsive?.severity).toBe('medium');
  });

  it('escalates to high at 15 days no contact', () => {
    const issues = detectIssues({ budgetSpent: 0, budgetTotal: 0, daysElapsed: 0, daysEstimated: 0, lastContractorContact: daysAgo(15) });
    const unresponsive = issues.find(i => i.type === 'CONTRACTOR_UNRESPONSIVE');
    expect(unresponsive?.severity).toBe('high');
  });
});

describe('detectIssues — permit delay', () => {
  it('flags PERMIT_DELAY when pending > 60 days', () => {
    const issues = detectIssues({
      budgetSpent: 0, budgetTotal: 0, daysElapsed: 0, daysEstimated: 0,
      permitFiledDate: daysAgo(65),
      permitStatus: 'pending',
    });
    const delay = issues.find(i => i.type === 'PERMIT_DELAY');
    expect(delay).toBeDefined();
    expect(delay?.severity).toBe('medium');
  });

  it('does not flag when permit not pending', () => {
    const issues = detectIssues({
      budgetSpent: 0, budgetTotal: 0, daysElapsed: 0, daysEstimated: 0,
      permitFiledDate: daysAgo(65),
      permitStatus: 'approved',
    });
    expect(issues.some(i => i.type === 'PERMIT_DELAY')).toBe(false);
  });
});

describe('detectIssues — safety', () => {
  it('flags SAFETY_ISSUE as critical', () => {
    const issues = detectIssues({ budgetSpent: 0, budgetTotal: 0, daysElapsed: 0, daysEstimated: 0, hasSafetyIncident: true });
    const safety = issues.find(i => i.type === 'SAFETY_ISSUE');
    expect(safety?.severity).toBe('critical');
  });
});
