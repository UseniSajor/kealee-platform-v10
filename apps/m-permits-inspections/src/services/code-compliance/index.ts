/**
 * Code Compliance Services
 * Main export for all code compliance services
 */

export {codeBookIntegrationService} from './code-book-integration';
export {dimensionCheckerService} from './dimension-checker';
export {accessibilityCheckerService} from './accessibility-checker';
export {energyCodeCheckerService} from './energy-code-checker';
export {fireLifeSafetyCheckerService} from './fire-life-safety-checker';
export {complianceReportGeneratorService} from './compliance-report-generator';

export type {
  CodeBook,
  CodeSection,
  CodeRequirement,
  CodeComplianceCheck,
} from './code-book-integration';

export type {
  DimensionMeasurement,
  DimensionComplianceCheck,
} from './dimension-checker';

export type {
  AccessibilityRequirement,
  AccessibilityCheck,
} from './accessibility-checker';

export type {
  EnergyCodeRequirement,
  EnergyCodeCheck,
  BuildingEnvelopeData,
} from './energy-code-checker';

export type {
  FireLifeSafetyRequirement,
  FireLifeSafetyCheck,
} from './fire-life-safety-checker';

export type {
  ComplianceReport,
  ComplianceSummary,
  ComplianceIssue,
} from './compliance-report-generator';
