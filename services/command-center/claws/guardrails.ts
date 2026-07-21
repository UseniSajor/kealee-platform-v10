import type { KealeeEventEnvelope } from '@kealee/events';

/**
 * EVENT_OWNERSHIP — maps event domain prefix to the ONE claw allowed to publish it.
 * See: _docs/kealee-architecture.md §17 "Publish Guard"
 */
export const EVENT_OWNERSHIP: Record<string, string> = {
  'estimate.': 'acquisition-precon-claw',
  'bid.': 'acquisition-precon-claw',
  'project.precon.': 'acquisition-precon-claw',
  'contract.': 'contract-commercials-claw',
  'changeorder.': 'contract-commercials-claw',
  'payment.': 'contract-commercials-claw',
  'schedule.': 'schedule-field-ops-claw',
  'sitevisit.': 'schedule-field-ops-claw',
  'budget.': 'budget-cost-claw',
  'permit.': 'permits-compliance-claw',
  'inspection.': 'permits-compliance-claw',
  'compliance.': 'permits-compliance-claw',
  'document.': 'docs-communication-claw',
  'communication.': 'docs-communication-claw',
  'prediction.': 'risk-prediction-claw',
  'risk.': 'risk-prediction-claw',
  'decision.': 'risk-prediction-claw',
  'task.': 'command-automation-claw',
  'system.': 'command-automation-claw',
};

/**
 * Validate that a claw is allowed to publish a given event type.
 * Throws if the source claw doesn't own the event domain.
 */
export function validateEventPublish(event: KealeeEventEnvelope): void {
  for (const [prefix, owner] of Object.entries(EVENT_OWNERSHIP)) {
    if (event.type.startsWith(prefix)) {
      if (event.source !== owner) {
        throw new Error(
          `[GUARDRAIL VIOLATION] Claw "${event.source}" cannot publish event "${event.type}". ` +
            `Only "${owner}" owns the "${prefix}*" event domain.`
        );
      }
      return;
    }
  }
  console.warn(`[Guardrails] No ownership rule for event type "${event.type}" — allowing`);
}

/**
 * CLAW_WRITE_PERMISSIONS — each claw's allowed Prisma models.
 * See: _docs/kealee-architecture.md §6-13
 */
export const CLAW_WRITE_PERMISSIONS: Record<string, string[]> = {
  'acquisition-precon-claw': [
    'Estimate', 'EstimateSection', 'EstimateLineItem',
    'BidRequest', 'BidInvitation', 'BidSubmission', 'ContractorBid',
  ],
  'contract-commercials-claw': [
    'Contract', 'ContractAgreement', 'ChangeOrder', 'ChangeOrderLineItem',
    'ChangeOrderApproval', 'Payment', 'ScheduledPayment',
  ],
  'schedule-field-ops-claw': [
    'ScheduleItem', 'WeatherLog', 'SiteVisit', 'VisitChecklist',
  ],
  'budget-cost-claw': [
    'BudgetItem', 'BudgetLine', 'BudgetEntry', 'BudgetTransaction',
    'BudgetSnapshot', 'BudgetAlert', 'Prediction',
  ],
  'permits-compliance-claw': [
    'Jurisdiction', 'Permit', 'Inspection', 'InspectionFinding',
    'QualityIssue', 'QAInspectionResult',
  ],
  'docs-communication-claw': [
    'Document', 'DocumentTemplate', 'GeneratedDocument',
    'CommunicationLog', 'CommunicationTemplate',
    'Conversation', 'Message', 'MessageAttachment',
    'ConversationParticipant', 'MessageRead',
  ],
  'risk-prediction-claw': [
    'Prediction', 'RiskAssessment', 'DecisionLog', 'AIConversation',
  ],
  'command-automation-claw': [
    'AutomationTask', 'JobQueue', 'JobSchedule',
    'DashboardWidget', 'Notification', 'ActivityLog', 'Alert',
  ],
};
