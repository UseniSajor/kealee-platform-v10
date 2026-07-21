declare module '@kealee/workflow-engine' {
  export type WorkflowPhase = 
    | 'DESIGN'
    | 'PERMIT'
    | 'BID'
    | 'CONSTRUCTION'
    | 'CLOSEOUT'
    | string

  export type WorkflowStatus = 
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'BLOCKED'
    | 'COMPLETED'
    | string

  export interface WorkflowConfig {
    phases: WorkflowPhase[]
    gates: Record<string, any>
  }

  export class KealeeWorkflowEngine {
    static phases: WorkflowPhase[]
    
    getWorkflowStatus(projectId: string, phase: WorkflowPhase): Promise<WorkflowStatus>
    enforceGate(phase: WorkflowPhase, projectId: string): Promise<boolean>
    canAdvanceToPhase(projectId: string, targetPhase: WorkflowPhase): Promise<boolean>
  }
}

