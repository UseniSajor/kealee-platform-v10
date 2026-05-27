export { RuleEngine } from './rule-engine';
export type { Rule, RuleCondition, RuleAction, RuleEvaluationResult } from './rule-engine';

// Zoning Bot Service (CONSOLIDATED from services/api and services/os-dev)
export { runZoningBot } from './zoning-bot';
export type { ZoningRequest, ZoningResponse } from './zoning-bot';

// Pricing constants
export * from './pricing';

// Concept package deliverables (permit + zoning in all tiers)
export * from './concept-package-deliverables';

// Concept tier resolution (checkout → generate → video)
export * from './concept-tier';

// Concept → build lifecycle upsells (estimate + permit + design plans)
export * from './build-lifecycle-upsell';

// GHL marketing client
export * from './marketing/ghl-client';
export type {
  GhlContact,
  GhlOpportunity,
  CreateContactInput,
  TriggerWorkflowInput,
  TriggerWorkflowResult,
  SendSMSInput,
  SendSMSResult,
  SendEmailInput,
  SendEmailResult,
  CreateOpportunityInput,
} from './marketing/ghl-client';
