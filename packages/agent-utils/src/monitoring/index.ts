export { detectIssues } from './issues';
export type { IssueCheckInput } from './issues';

export { buildMilestones, getNextMilestone, getMilestoneByTrigger } from './milestones';

export { getPhaseProgress, getPhaseLabel, PHASE_PROGRESS, PHASE_LABELS } from './status';

export type {
  ProjectPhase,
  IssueType,
  IssueSeverity,
  ProjectIssue,
  Milestone,
  ProjectStatus,
} from './types';
