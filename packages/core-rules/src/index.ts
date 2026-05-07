export { RuleEngine } from './rule-engine';
export type { Rule, RuleCondition, RuleAction, RuleEvaluationResult } from './rule-engine';

// Zoning Bot Service (CONSOLIDATED from services/api and services/os-dev)
export { runZoningBot } from './zoning-bot';
export type { ZoningRequest, ZoningResponse } from './zoning-bot';

// Pricing constants
export * from './pricing';

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
