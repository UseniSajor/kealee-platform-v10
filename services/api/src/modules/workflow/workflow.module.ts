/**
 * workflow.module.ts
 *
 * Barrel export for the workflow primitives module.
 *
 * Usage:
 *   import { workflowOrchestratorService } from '../workflow/workflow.module'
 *   import { workflowStageService }        from '../workflow/workflow.module'
 *   import { workItemService }             from '../workflow/workflow.module'
 *   import { workflowEventService }        from '../workflow/workflow.module'
 *   import type { WorkflowStageName, ... } from '../workflow/workflow.module'
 */

export { workflowStageService }       from './workflow-stage.service'
export { workItemService }            from './work-item.service'
export { workflowEventService }       from './workflow-event.service'
export { workflowOrchestratorService } from './workflow-orchestrator.service'
export { VALID_TRANSITIONS, ASSIGNMENT_ACCEPTANCE_WINDOW_MS } from './workflow.constants'
export type {
  WorkflowSubjectType,
  WorkflowStageName,
  WorkItemStatus,
  WorkItemType,
  AppendStageInput,
  CreateWorkItemInput,
  CompleteWorkItemInput,
  EmitWorkflowEventInput,
  StageTimeline,
} from './workflow.types'
