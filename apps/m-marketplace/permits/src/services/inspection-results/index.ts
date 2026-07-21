/**
 * Inspection Results Services
 * Main export for all inspection results services
 */

export {resultsManagerService} from './results-manager';
export {correctionTrackerService} from './correction-tracker';
export {reinspectionAutomationService} from './reinspection-automation';
export {inspectionNotificationsService} from './inspection-notifications';
export {milestoneIntegrationService} from './milestone-integration';
export {inspectionAnalyticsService} from './inspection-analytics';
export {inspectionReporterService} from './inspection-reporter';

export type {
  InspectionResultData,
  InspectionResult,
} from './results-manager';

export type {
  InspectionCorrection,
  CorrectionResolution,
} from './correction-tracker';

export type {
  ReinspectionRequest,
  ReinspectionScheduleResult,
} from './reinspection-automation';

export type {
  InspectionNotification,
} from './inspection-notifications';

export type {
  MilestoneBlock,
  MilestoneStatus,
} from './milestone-integration';

export type {
  InspectionAnalytics,
  InspectorPerformance,
} from './inspection-analytics';

export type {
  InspectionReport,
} from './inspection-reporter';
