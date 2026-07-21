export type ProjectPhase =
  | 'permits_filed' | 'permits_approved'
  | 'contractor_hired'
  | 'demo_scheduled' | 'demo_in_progress' | 'demo_complete'
  | 'framing' | 'mep' | 'finishing'
  | 'inspection_scheduled' | 'inspection_passed' | 'inspection_failed'
  | 'final_walkthrough' | 'complete';

export type IssueType =
  | 'BUDGET_OVERRUN'
  | 'BEHIND_SCHEDULE'
  | 'CONTRACTOR_UNRESPONSIVE'
  | 'PERMIT_DELAY'
  | 'SAFETY_ISSUE';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectIssue {
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  detectedAt: Date;
  resolved: boolean;
}

export interface Milestone {
  name: string;
  trigger: string;
  amount: number;
  percentage: number;
  dueDate?: Date;
  completedAt?: Date;
  paid: boolean;
}

export interface ProjectStatus {
  projectId: string;
  progress: number;
  currentPhase: string;
  nextMilestone?: Milestone & { daysDue: number };
  issues: ProjectIssue[];
  lastUpdate: string;
  budgetSpent: number;
  budgetTotal: number;
  startDate: Date;
  estimatedEndDate: Date;
  daysElapsed: number;
  daysEstimated: number;
}
