/**
 * Compliance Checkpoint Service
 * Enforces SOP/SOW adherence at every step
 */

import { prismaAny } from '../../utils/prisma-helper'
import type {
  ComplianceCheckpoint,
  ComplianceCheckResult,
  ValidationCondition,
  ModuleChecks,
} from './compliance-checkpoint.types'
import { pmComplianceCheckService } from '../pm/pm-compliance-check.service'

export const complianceCheckpointService = {
  /**
   * Evaluate a validation condition
   */
  async evaluateCondition(
    condition: ValidationCondition,
    projectId: string,
    taskId?: string
  ): Promise<{ passed: boolean; message?: string; data?: any }> {
    const { source, condition: conditionExpr, blocking } = condition

    try {
      switch (source) {
        case 'PERMIT': {
          // Check permit status
          const permit = await prismaAny.permitApplication?.findFirst({
            where: {
              projectId,
              status: { in: ['APPROVED', 'ISSUED'] },
            },
          }).catch(() => null)

          const passed = permit !== null
          return {
            passed,
            message: passed ? 'Permit approved' : 'Permit not approved',
            data: { permitId: permit?.id, status: permit?.status },
          }
        }

        case 'ESCROW': {
          // Check escrow funding
          const escrow = await prismaAny.escrowAccount?.findFirst({
            where: {
              projectId,
              status: { in: ['FUNDED', 'ACTIVE'] },
            },
          }).catch(() => null)

          const passed = escrow !== null && (escrow.status === 'FUNDED' || escrow.status === 'ACTIVE')
          return {
            passed,
            message: passed ? 'Escrow funded' : 'Escrow not funded',
            data: { escrowId: escrow?.id, balance: escrow?.balance },
          }
        }

        case 'CONTRACT': {
          // Check contract signing
          const contract = await prismaAny.contractAgreement?.findFirst({
            where: {
              projectId,
              status: { in: ['SIGNED', 'ACTIVE'] },
            },
          }).catch(() => null)

          const passed = contract !== null && contract.status === 'SIGNED'
          return {
            passed,
            message: passed ? 'Contract signed' : 'Contract not signed',
            data: { contractId: contract?.id, status: contract?.status },
          }
        }

        case 'SOP': {
          // Check SOP steps completion
          const requiredSteps = await prismaAny.sOPCompletion?.findMany({
            where: {
              projectId,
              isRequired: true,
              completedAt: null,
            },
          }).catch(() => [])

          const passed = !requiredSteps || requiredSteps.length === 0
          return {
            passed,
            message: passed
              ? 'All required SOP steps completed'
              : `${requiredSteps?.length || 0} required SOP steps not completed`,
            data: { incompleteSteps: requiredSteps?.length || 0 },
          }
        }

        case 'SOW': {
          // Check SOW validation
          const project = await prismaAny.project.findUnique({
            where: { id: projectId },
          })

          const sowValidated = project?.status === 'ACTIVE' || (project as any).sowValidated === true
          return {
            passed: sowValidated,
            message: sowValidated ? 'SOW validated' : 'SOW validation required',
            data: { projectStatus: project?.status },
          }
        }

        case 'WORKFLOW': {
          // Check workflow gate status
          // This would integrate with the workflow engine
          return {
            passed: true, // Placeholder - would check actual workflow gates
            message: 'Workflow gate check',
          }
        }

        default:
          return {
            passed: false,
            message: `Unknown validation source: ${source}`,
          }
      }
    } catch (error: any) {
      return {
        passed: false,
        message: `Error evaluating condition: ${error.message}`,
      }
    }
  },

  /**
   * Check module requirements
   */
  async checkModuleRequirements(
    moduleChecks: ModuleChecks,
    projectId: string
  ): Promise<ComplianceCheckResult['moduleChecks']> {
    const results: ComplianceCheckResult['moduleChecks'] = {}

    // Check permits
    if (moduleChecks.permits?.required) {
      const permits = await prismaAny.permitApplication?.findMany({
        where: {
          projectId,
          status: { in: moduleChecks.permits.status },
        },
      }).catch(() => [])

      const passed = permits && permits.length > 0
      results.permits = {
        passed: passed || false,
        message: passed
          ? `${permits?.length || 0} permit(s) in required status`
          : moduleChecks.permits.message || 'Required permits not in correct status',
      }
    }

    // Check escrow
    if (moduleChecks.escrow?.funded) {
      const escrow = await prismaAny.escrowAccount?.findFirst({
        where: {
          projectId,
          status: { in: ['FUNDED', 'ACTIVE'] },
        },
      }).catch(() => null)

      const passed =
        escrow !== null &&
        (escrow.status === 'FUNDED' || escrow.status === 'ACTIVE') &&
        (!moduleChecks.escrow.minAmount || (escrow.balance || 0) >= moduleChecks.escrow.minAmount)

      results.escrow = {
        passed,
        message: passed
          ? `Escrow funded: $${escrow?.balance || 0}`
          : moduleChecks.escrow.message || 'Escrow not funded or insufficient amount',
      }
    }

    // Check contracts
    if (moduleChecks.contracts?.signed) {
      const contracts = await prismaAny.contractAgreement?.findMany({
        where: {
          projectId,
          status: { in: ['SIGNED', 'ACTIVE'] },
        },
        include: {
          owner: true,
          contractor: true,
        },
      }).catch(() => [])

      // Check if all required parties have signed
      const requiredParties = moduleChecks.contracts.parties || []
      const signedParties: string[] = []
      contracts?.forEach((contract: any) => {
        if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
          if (contract.ownerId) signedParties.push('owner')
          if (contract.contractorId) signedParties.push('contractor')
        }
      })

      const allPartiesSigned = requiredParties.every((party) => signedParties.includes(party.toLowerCase()))
      results.contracts = {
        passed: allPartiesSigned,
        message: allPartiesSigned
          ? 'All required parties have signed'
          : moduleChecks.contracts.message || 'Not all required parties have signed',
      }
    }

    // Check workflow
    if (moduleChecks.workflow) {
      // This would integrate with workflow engine
      results.workflow = {
        passed: true, // Placeholder
        message: 'Workflow check',
      }
    }

    // Check SOP
    if (moduleChecks.sop?.stepsCompleted) {
      const incompleteSteps = await prismaAny.sOPCompletion?.findMany({
        where: {
          projectId,
          isRequired: true,
          completedAt: null,
        },
      }).catch(() => [])

      const passed = !incompleteSteps || incompleteSteps.length === 0
      results.sop = {
        passed,
        message: passed
          ? 'All required SOP steps completed'
          : moduleChecks.sop.message || `${incompleteSteps?.length || 0} SOP steps incomplete`,
      }
    }

    return results
  },

  /**
   * Run compliance checks for a checkpoint
   */
  async runComplianceChecks(
    checkpoint: ComplianceCheckpoint,
    projectId: string,
    taskId?: string
  ): Promise<ComplianceCheckResult> {
    // Evaluate all validations
    const validationResults = await Promise.all(
      checkpoint.validations.map(async (validation) => {
        const result = await this.evaluateCondition(validation, projectId, taskId)
        return {
          condition: validation,
          passed: result.passed,
          message: result.message,
          data: result.data,
        }
      })
    )

    // Check module requirements
    const moduleCheckResults = await this.checkModuleRequirements(checkpoint.moduleChecks, projectId)

    // Determine if all passed
    const allValidationsPassed = validationResults.every((v) => v.passed)
    const allModuleChecksPassed = Object.values(moduleCheckResults).every((check) => check?.passed !== false)
    const allPassed = allValidationsPassed && allModuleChecksPassed

    // Collect blockers and warnings
    const blockers: string[] = []
    const warnings: string[] = []

    validationResults.forEach((result) => {
      if (!result.passed && result.condition.blocking) {
        blockers.push(result.message || result.condition.message)
      } else if (!result.passed) {
        warnings.push(result.message || result.condition.message)
      }
    })

    Object.values(moduleCheckResults).forEach((check) => {
      if (check && !check.passed) {
        blockers.push(check.message || 'Module check failed')
      }
    })

    return {
      checkpointId: checkpoint.id,
      passed: allPassed,
      validations: validationResults,
      moduleChecks: moduleCheckResults,
      allPassed,
      blockers,
      warnings,
      timestamp: new Date(),
    }
  },

  /**
   * Get checkpoint configuration for a task type
   */
  getCheckpointForTask(taskId: string, type: 'PRE_TASK' | 'POST_TASK'): ComplianceCheckpoint {
    // This would fetch from database or use defaults
    // For now, return a default checkpoint
    return {
      id: `checkpoint-${taskId}-${type}`,
      name: `${type} Compliance Check`,
      type,
      validations: [
        {
          source: 'SOP',
          condition: 'ALL_SOP_STEPS_COMPLETE',
          message: 'All required SOP steps must be completed',
          blocking: true,
        },
      ],
      moduleChecks: {
        permits: {
          required: type === 'POST_TASK',
          status: ['APPROVED', 'ISSUED'],
        },
        escrow: {
          funded: true,
        },
      },
      taskId,
    }
  },
}




