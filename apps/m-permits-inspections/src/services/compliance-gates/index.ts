/**
 * Compliance Gates Services
 * Main export for all compliance gate services
 */

export {milestoneGateService} from './milestone-gate';
export {escrowReleaseGateService} from './escrow-gate';
export {projectStatusSyncService} from './project-status-sync';
export {expirationAlertsService} from './expiration-alerts';
export {licenseValidationService} from './license-validation';
export {insuranceVerificationService} from './insurance-verification';

export type {
  MilestoneGateCheck,
} from './milestone-gate';

export type {
  EscrowReleaseGateCheck,
} from './escrow-gate';

export type {
  ProjectStatusUpdate,
} from './project-status-sync';

export type {
  ExpirationAlert,
  ExpirationAlertRule,
} from './expiration-alerts';

export type {
  ContractorLicense,
  LicenseValidationResult,
} from './license-validation';

export type {
  InsuranceCertificate,
  InsuranceValidationResult,
} from './insurance-verification';
