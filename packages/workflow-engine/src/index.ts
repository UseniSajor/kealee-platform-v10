/**
 * Kealee Workflow Engine
 * Rules-based workflow engine that enforces workflows across all Kealee modules
 */

export { KealeeWorkflowEngine } from './workflow-engine'
export { WorkflowIntegrationService } from './integrations/integration-service'
export type {
  WorkflowPhase,
  WorkflowGate,
  MandatoryCheck,
  CheckResult,
  WorkflowStatus,
  PhaseConfig,
} from './types'
export { SITE_PLAN_STAGES, SitePlanTransitionError, applySitePlanEvent, createSitePlanWorkflow } from './site-plan-workflow'
export type { SitePlanStage, SitePlanStageSnapshot, SitePlanStageState, SitePlanWorkflowEvent, SitePlanWorkflowSnapshot } from './site-plan-workflow'



