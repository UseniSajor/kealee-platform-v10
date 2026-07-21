/**
 * Kealee Workflow Engine
 * Enforces workflows across all Kealee modules with phase gates
 */

import type {
  WorkflowPhase,
  WorkflowGate,
  MandatoryCheck,
  CheckResult,
  WorkflowStatus,
  PhaseConfig,
} from './types'
import { WorkflowIntegrationService } from './integrations/integration-service'

export class KealeeWorkflowEngine {
  private integrationService: WorkflowIntegrationService

  constructor() {
    this.integrationService = new WorkflowIntegrationService()
  }

  /**
   * Phase configurations with mandatory checks and gates
   */
  static phases: Record<WorkflowPhase, PhaseConfig> = {
    INITIATION: {
      mandatory: [
        { check: 'SOW_VALIDATED', module: 'm-project-owner', description: 'Statement of Work must be validated' },
        { check: 'PERMIT_APPLIED', module: 'm-permits-inspections', description: 'Permit application must be submitted' },
        { check: 'ESCROW_FUNDED', module: 'm-finance-trust', description: 'Escrow account must be funded' },
      ],
      gates: [
        {
          id: 'GATE_1',
          condition: 'ALL_MANDATORY_COMPLETE',
          description: 'All mandatory initiation checks must pass',
        },
        {
          id: 'GATE_2',
          condition: 'CUSTOM',
          customCondition: (results) => {
            // Gate 2: Client must have signed contract
            const contractSigned = results.find((r) => r.check === 'CLIENT_SIGNED_CONTRACT')
            return contractSigned?.passed === true
          },
          description: 'Client must have signed the contract',
        },
      ],
      description: 'Project initiation phase - basic requirements must be met',
    },
    PLANNING: {
      mandatory: [
        { check: 'RESOURCE_ALLOCATED', module: 'm-marketplace', description: 'Resources must be allocated' },
        { check: 'SCHEDULE_APPROVED', module: 'os-pm', description: 'Project schedule must be approved' },
        { check: 'BUDGET_VERIFIED', module: 'm-finance-trust', description: 'Budget must be verified' },
      ],
      gates: [
        {
          id: 'GATE_3',
          condition: 'ALL_MANDATORY_COMPLETE',
          description: 'All planning requirements must be met',
        },
      ],
      description: 'Project planning phase - resources, schedule, and budget must be approved',
    },
    EXECUTION: {
      mandatory: [
        { check: 'PERMIT_APPROVED', module: 'm-permits-inspections', description: 'Permit must be approved' },
        { check: 'CONTRACTOR_ASSIGNED', module: 'm-marketplace', description: 'Contractor must be assigned' },
      ],
      gates: [
        {
          id: 'GATE_4',
          condition: 'ALL_MANDATORY_COMPLETE',
          description: 'Execution can begin only after permit approval and contractor assignment',
        },
      ],
      description: 'Project execution phase - construction can begin',
    },
    MONITORING: {
      mandatory: [],
      gates: [
        {
          id: 'GATE_5',
          condition: 'ALL_MANDATORY_COMPLETE',
          description: 'Monitoring phase - track progress and compliance',
        },
      ],
      description: 'Project monitoring phase - ongoing compliance and progress tracking',
    },
    CLOSEOUT: {
      mandatory: [],
      gates: [
        {
          id: 'GATE_6',
          condition: 'ALL_MANDATORY_COMPLETE',
          description: 'Closeout phase - final inspections and documentation',
        },
      ],
      description: 'Project closeout phase - final inspections and handoff',
    },
  }

  /**
   * Check mandatory requirements for a phase
   */
  async checkMandatoryRequirements(
    mandatory: MandatoryCheck[],
    projectId: string
  ): Promise<CheckResult[]> {
    const results: CheckResult[] = []

    for (const check of mandatory) {
      const result = await this.integrationService.executeCheck(check.check, projectId)
      results.push(result)
    }

    return results
  }

  /**
   * Evaluate a gate condition
   */
  evaluateGate(gate: WorkflowGate, checkResults: CheckResult[]): boolean {
    switch (gate.condition) {
      case 'ALL_MANDATORY_COMPLETE':
        return checkResults.every((result) => result.passed)
      case 'ANY_MANDATORY_COMPLETE':
        return checkResults.some((result) => result.passed)
      case 'CUSTOM':
        if (gate.customCondition) {
          return gate.customCondition(checkResults)
        }
        return false
      default:
        return false
    }
  }

  /**
   * Enforce gate - cannot proceed if gates are not passed
   */
  async enforceGate(phase: WorkflowPhase, projectId: string): Promise<{
    canProceed: boolean
    gates: Array<{ gate: WorkflowGate; passed: boolean; message?: string }>
    blockers: string[]
  }> {
    const phaseConfig = KealeeWorkflowEngine.phases[phase]

    if (!phaseConfig) {
      return {
        canProceed: false,
        gates: [],
        blockers: [`Unknown phase: ${phase}`],
      }
    }

    // Check mandatory requirements
    const checkResults = await this.checkMandatoryRequirements(phaseConfig.mandatory, projectId)

    // Evaluate all gates
    const gateResults = phaseConfig.gates.map((gate) => {
      const passed = this.evaluateGate(gate, checkResults)
      return {
        gate,
        passed,
        message: passed
          ? `${gate.id} passed`
          : `${gate.id} failed: ${gate.description || 'Gate condition not met'}`,
      }
    })

    // Can proceed only if all gates pass
    const canProceed = gateResults.every((result) => result.passed)

    // Collect blockers
    const blockers: string[] = []
    checkResults.forEach((result) => {
      if (!result.passed) {
        blockers.push(result.message || `${result.check} failed`)
      }
    })
    gateResults.forEach((result) => {
      if (!result.passed) {
        blockers.push(result.message || `${result.gate.id} failed`)
      }
    })

    return {
      canProceed,
      gates: gateResults,
      blockers,
    }
  }

  /**
   * Get complete workflow status for a project
   */
  async getWorkflowStatus(projectId: string, currentPhase: WorkflowPhase): Promise<WorkflowStatus> {
    const phaseConfig = KealeeWorkflowEngine.phases[currentPhase]

    if (!phaseConfig) {
      throw new Error(`Unknown phase: ${currentPhase}`)
    }

    // Check all mandatory requirements
    const checks = await this.checkMandatoryRequirements(phaseConfig.mandatory, projectId)

    // Evaluate gates
    const gateResults = phaseConfig.gates.map((gate) => {
      const passed = this.evaluateGate(gate, checks)
      return {
        gate,
        passed,
        message: passed
          ? undefined
          : `${gate.id} failed: ${gate.description || 'Gate condition not met'}`,
      }
    })

    const canProceed = gateResults.every((result) => result.passed)

    // Collect blockers and warnings
    const blockers: string[] = []
    const warnings: string[] = []

    checks.forEach((check) => {
      if (!check.passed) {
        blockers.push(check.message || `${check.check} failed`)
      }
    })

    gateResults.forEach((result) => {
      if (!result.passed) {
        blockers.push(result.message || `${result.gate.id} failed`)
      }
    })

    return {
      phase: currentPhase,
      projectId,
      checks,
      gates: gateResults,
      canProceed,
      blockers,
      warnings,
      lastUpdated: new Date(),
    }
  }

  /**
   * Check if project can advance to next phase
   */
  async canAdvanceToPhase(projectId: string, targetPhase: WorkflowPhase): Promise<{
    canAdvance: boolean
    currentPhaseStatus: WorkflowStatus | null
    targetPhaseStatus: WorkflowStatus | null
    blockers: string[]
  }> {
    // Get current phase (would need to be determined from project state)
    // For now, check all phases up to target
    const phases: WorkflowPhase[] = ['INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSEOUT']
    const targetIndex = phases.indexOf(targetPhase)

    if (targetIndex === -1) {
      return {
        canAdvance: false,
        currentPhaseStatus: null,
        targetPhaseStatus: null,
        blockers: [`Invalid target phase: ${targetPhase}`],
      }
    }

    // Check all phases up to and including target
    const allBlockers: string[] = []
    let canAdvance = true

    for (let i = 0; i <= targetIndex; i++) {
      const phase = phases[i]
      const gateResult = await this.enforceGate(phase, projectId)
      
      if (!gateResult.canProceed) {
        canAdvance = false
        allBlockers.push(...gateResult.blockers)
      }
    }

    // Get status for target phase
    const targetPhaseStatus = await this.getWorkflowStatus(projectId, targetPhase)

    return {
      canAdvance,
      currentPhaseStatus: null, // Would need to determine current phase
      targetPhaseStatus,
      blockers: allBlockers,
    }
  }
}




