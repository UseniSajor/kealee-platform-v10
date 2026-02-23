/**
 * Review Workflow Services
 * Main export for all review workflow services
 */

export {multiDisciplineCoordinationService} from './multi-discipline-coordination';
export {commentConsolidationService} from './comment-consolidation';
export {reviewProgressTrackingService} from './progress-tracking';
export {correctionListGeneratorService} from './correction-list-generator';
export {resubmissionTrackingService} from './resubmission-tracking';
export {approvalWorkflowService} from './approval-workflow';

export type {
  ReviewDiscipline,
  PermitReviewCoordination,
} from './multi-discipline-coordination';

export type {
  ReviewComment,
  CommentConflict,
  CommentResolution,
} from './comment-consolidation';

export type {
  ReviewProgress,
  DisciplineProgress,
  ReviewDashboard,
  ReviewTimelineEvent,
} from './progress-tracking';

export type {
  PermitCorrection,
  CorrectionList,
} from './correction-list-generator';

export type {
  Resubmission,
  ResubmissionDocument,
  ResubmissionComparison,
} from './resubmission-tracking';

export type {
  ApprovalSignature,
  ApprovalWorkflow,
  RequiredSignature,
} from './approval-workflow';
