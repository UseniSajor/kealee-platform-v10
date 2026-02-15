/**
 * Queue Registry — All 16 BullMQ queue names.
 * See: _docs/kealee-architecture.md §5.2
 */
export const KEALEE_QUEUES = {
  // Claw A: Acquisition & PreCon
  BID_ENGINE: 'bid-engine',
  ESTIMATION_TOOL: 'estimation-tool',

  // Claw B: Contract & Commercials
  CHANGE_ORDER: 'change-order',
  PAYMENT_PROCESSING: 'payment-processing',

  // Claw C: Schedule & Field Ops
  SMART_SCHEDULER: 'smart-scheduler',
  VISIT_SCHEDULER: 'visit-scheduler',
  INSPECTION_COORDINATOR: 'inspection-coordinator',

  // Claw D: Budget & Cost Control
  BUDGET_TRACKER: 'budget-tracker',

  // Claw E: Permits & Compliance
  PERMIT_TRACKER: 'permit-tracker',
  QA_INSPECTOR: 'qa-inspector',

  // Claw F: Documents & Communication
  DOCUMENT_GENERATOR: 'document-generator',
  COMMUNICATION_HUB: 'communication-hub',

  // Claw G: Risk, Prediction & Decisions
  PREDICTIVE_ENGINE: 'predictive-engine',
  DECISION_SUPPORT: 'decision-support',

  // Claw H: Command Center & Automation
  TASK_ORCHESTRATOR: 'task-orchestrator',
  JOB_SCHEDULER: 'job-scheduler',
} as const;

export type QueueName = (typeof KEALEE_QUEUES)[keyof typeof KEALEE_QUEUES];
