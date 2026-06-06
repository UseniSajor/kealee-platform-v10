/**
 * @kealee/agent-utils/monitoring/issues
 *
 * Deterministic issue detection for construction projects.
 *
 * Thresholds (all configurable via IssueCheckConfig):
 *   Budget overrun:            spent > 110% of budget → medium; > 125% → high
 *   Behind schedule:           elapsed > 120% of estimated → medium; > 30 days late → high
 *   Contractor unresponsive:   no contact > 7 days → medium; > 14 days → high
 *   Permit delay:              permit pending > 60 days → medium
 *   Safety incident:           hasSafetyIncident = true → critical
 *
 * Source: extracted from bots/keabot-project-monitor/src/issues.ts
 * Pure function — no I/O, no LLM, no database.
 */

import type { ProjectIssue } from './types';

export interface IssueCheckInput {
  budgetSpent: number;
  budgetTotal: number;
  daysElapsed: number;
  daysEstimated: number;
  lastContractorContact?: Date;
  permitFiledDate?: Date;
  permitStatus?: string;
  hasSafetyIncident?: boolean;
}

const BUDGET_OVERRUN_THRESHOLD   = 1.10;
const BUDGET_HIGH_THRESHOLD      = 1.25;
const SCHEDULE_OVERRUN_THRESHOLD = 1.20;
const SCHEDULE_HIGH_DAYS         = 30;
const CONTRACTOR_WARN_DAYS       = 7;
const CONTRACTOR_HIGH_DAYS       = 14;
const PERMIT_DELAY_DAYS          = 60;

export function detectIssues(input: IssueCheckInput): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  const now = new Date();

  if (input.budgetTotal > 0 && input.budgetSpent > input.budgetTotal * BUDGET_OVERRUN_THRESHOLD) {
    const overage = ((input.budgetSpent / input.budgetTotal - 1) * 100).toFixed(0);
    issues.push({
      type:     'BUDGET_OVERRUN',
      severity: input.budgetSpent > input.budgetTotal * BUDGET_HIGH_THRESHOLD ? 'high' : 'medium',
      message:  `${overage}% over budget. Spent $${input.budgetSpent.toLocaleString()} of $${input.budgetTotal.toLocaleString()} budget.`,
      detectedAt: now,
      resolved: false,
    });
  }

  if (input.daysEstimated > 0 && input.daysElapsed > input.daysEstimated * SCHEDULE_OVERRUN_THRESHOLD) {
    const daysLate = input.daysElapsed - input.daysEstimated;
    issues.push({
      type:     'BEHIND_SCHEDULE',
      severity: daysLate > SCHEDULE_HIGH_DAYS ? 'high' : 'medium',
      message:  `${daysLate} days behind schedule. Est. completion shifted.`,
      detectedAt: now,
      resolved: false,
    });
  }

  if (input.lastContractorContact) {
    const daysSinceContact = Math.floor(
      (now.getTime() - input.lastContractorContact.getTime()) / 86_400_000,
    );
    if (daysSinceContact > CONTRACTOR_WARN_DAYS) {
      issues.push({
        type:     'CONTRACTOR_UNRESPONSIVE',
        severity: daysSinceContact > CONTRACTOR_HIGH_DAYS ? 'high' : 'medium',
        message:  `No contractor communication in ${daysSinceContact} days.`,
        detectedAt: now,
        resolved: false,
      });
    }
  }

  if (input.permitFiledDate && input.permitStatus === 'pending') {
    const daysPending = Math.floor(
      (now.getTime() - input.permitFiledDate.getTime()) / 86_400_000,
    );
    if (daysPending > PERMIT_DELAY_DAYS) {
      issues.push({
        type:     'PERMIT_DELAY',
        severity: 'medium',
        message:  `Permit pending for ${daysPending} days. Consider following up with the building department.`,
        detectedAt: now,
        resolved: false,
      });
    }
  }

  if (input.hasSafetyIncident) {
    issues.push({
      type:     'SAFETY_ISSUE',
      severity: 'critical',
      message:  'Safety incident or code violation reported. Immediate review required.',
      detectedAt: now,
      resolved: false,
    });
  }

  return issues;
}
