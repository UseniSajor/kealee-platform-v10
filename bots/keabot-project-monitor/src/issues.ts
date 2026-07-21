import type { ProjectIssue, IssueType } from './types.js';

interface IssueCheckInput {
  budgetSpent: number;
  budgetTotal: number;
  daysElapsed: number;
  daysEstimated: number;
  lastContractorContact?: Date;
  permitFiledDate?: Date;
  permitStatus?: string;
  hasSafetyIncident?: boolean;
}

export function detectIssues(input: IssueCheckInput): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  const now = new Date();

  // Budget overrun: spent > 110% of budget
  if (input.budgetTotal > 0 && input.budgetSpent > input.budgetTotal * 1.1) {
    const overage = ((input.budgetSpent / input.budgetTotal - 1) * 100).toFixed(0);
    issues.push({
      type: 'BUDGET_OVERRUN',
      severity: input.budgetSpent > input.budgetTotal * 1.25 ? 'high' : 'medium',
      message: `${overage}% over budget. Spent $${input.budgetSpent.toLocaleString()} of $${input.budgetTotal.toLocaleString()} budget.`,
      detectedAt: now,
      resolved: false,
    });
  }

  // Behind schedule: elapsed > 120% of estimated
  if (input.daysEstimated > 0 && input.daysElapsed > input.daysEstimated * 1.2) {
    const daysLate = input.daysElapsed - input.daysEstimated;
    issues.push({
      type: 'BEHIND_SCHEDULE',
      severity: daysLate > 30 ? 'high' : 'medium',
      message: `${daysLate} days behind schedule. Est. completion shifted.`,
      detectedAt: now,
      resolved: false,
    });
  }

  // Contractor unresponsive: no contact > 7 days
  if (input.lastContractorContact) {
    const daysSinceContact = Math.floor((now.getTime() - input.lastContractorContact.getTime()) / 86400000);
    if (daysSinceContact > 7) {
      issues.push({
        type: 'CONTRACTOR_UNRESPONSIVE',
        severity: daysSinceContact > 14 ? 'high' : 'medium',
        message: `No contractor communication in ${daysSinceContact} days.`,
        detectedAt: now,
        resolved: false,
      });
    }
  }

  // Permit delay: pending > 60 days
  if (input.permitFiledDate && input.permitStatus === 'pending') {
    const daysPending = Math.floor((now.getTime() - input.permitFiledDate.getTime()) / 86400000);
    if (daysPending > 60) {
      issues.push({
        type: 'PERMIT_DELAY',
        severity: 'medium',
        message: `Permit pending for ${daysPending} days. Consider following up with the building department.`,
        detectedAt: now,
        resolved: false,
      });
    }
  }

  // Safety incident
  if (input.hasSafetyIncident) {
    issues.push({
      type: 'SAFETY_ISSUE',
      severity: 'critical',
      message: 'Safety incident or code violation reported. Immediate review required.',
      detectedAt: now,
      resolved: false,
    });
  }

  return issues;
}
