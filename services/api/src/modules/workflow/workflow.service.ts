import { KealeeWorkflowEngine } from '@kealee/workflow-engine'
import type { WorkflowPhase, WorkflowStatus } from '@kealee/workflow-engine'

const workflowEngine = new KealeeWorkflowEngine()

export const workflowService = {
  /**
   * Get workflow status for a project
   */
  async getWorkflowStatus(projectId: string, phase: WorkflowPhase): Promise<WorkflowStatus> {
    return workflowEngine.getWorkflowStatus(projectId, phase)
  },

  /**
   * Check if a gate can be passed
   */
  async checkGate(phase: WorkflowPhase, projectId: string) {
    return workflowEngine.enforceGate(phase, projectId)
  },

  /**
   * Check if project can advance to a phase
   */
  async canAdvanceToPhase(projectId: string, targetPhase: WorkflowPhase) {
    return workflowEngine.canAdvanceToPhase(projectId, targetPhase)
  },

  /**
   * Get all phase configurations
   */
  getPhaseConfigs() {
    return KealeeWorkflowEngine.phases
  },
}

