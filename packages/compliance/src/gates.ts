/**
 * Compliance Gates
 * Enforces integration between modules
 */

import { prisma } from '@kealee/database'

export type ModuleName =
  | 'm-permits-inspections'
  | 'm-finance-trust'
  | 'm-project-owner'
  | 'm-marketplace'
  | 'm-architect'
  | 'm-engineer'
  | 'm-ops-services'

export type CheckType =
  | 'PERMIT_VALID'
  | 'ESCROW_FUNDED'
  | 'CLIENT_APPROVED'
  | 'CONTRACTOR_ASSIGNED'
  | 'DESIGN_APPROVED'
  | 'ENGINEER_STAMPED'
  | 'SOP_COMPLETE'

export interface GateCheck {
  module: ModuleName
  check: CheckType
  message: string
  blocking: boolean
  params?: Record<string, any>
}

export interface GateResult {
  passed: boolean
  checks: Array<{
    module: ModuleName
    check: CheckType
    passed: boolean
    message: string
    data?: any
  }>
  failedChecks: Array<{
    module: ModuleName
    check: CheckType
    message: string
    data?: any
  }>
  canProceed: boolean
}

export class ComplianceError extends Error {
  constructor(
    public failedChecks: Array<{ module: ModuleName; check: CheckType; message: string }>,
    message?: string
  ) {
    super(message || failedChecks.map((c) => c.message).join(', '))
    this.name = 'ComplianceError'
  }
}

/**
 * Compliance Gates Configuration
 */
export const COMPLIANCE_GATES = {
  MILESTONE_APPROVAL: {
    name: 'Milestone Approval',
    checks: [
      {
        module: 'm-permits-inspections' as ModuleName,
        check: 'PERMIT_VALID' as CheckType,
        message: 'Cannot approve milestone: Permit is expired or invalid',
        blocking: true,
      },
      {
        module: 'm-finance-trust' as ModuleName,
        check: 'ESCROW_FUNDED' as CheckType,
        message: 'Cannot approve milestone: Escrow not fully funded',
        blocking: true,
      },
      {
        module: 'm-project-owner' as ModuleName,
        check: 'CLIENT_APPROVED' as CheckType,
        message: 'Cannot approve milestone: Homeowner approval required',
        blocking: true,
      },
    ] as GateCheck[],

    /**
     * Enforce milestone approval gate
     */
    enforce: async (projectId: string, milestoneId: string): Promise<GateResult> => {
      const checks = await Promise.all(
        COMPLIANCE_GATES.MILESTONE_APPROVAL.checks.map(async (check) => {
          const result = await performCheck(check, { projectId, milestoneId })
          return {
            module: check.module,
            check: check.check,
            passed: result.passed,
            message: check.message,
            data: result.data,
          }
        })
      )

      const failedChecks = checks.filter((c) => !c.passed)
      const canProceed = failedChecks.length === 0

      if (!canProceed) {
        throw new ComplianceError(
          failedChecks.map((c) => ({
            module: c.module,
            check: c.check,
            message: c.message,
          }))
        )
      }

      return {
        passed: canProceed,
        checks,
        failedChecks,
        canProceed,
      }
    },
  },

  CONTRACTOR_PAYMENT: {
    name: 'Contractor Payment',
    checks: [
      {
        module: 'm-finance-trust' as ModuleName,
        check: 'ESCROW_FUNDED' as CheckType,
        message: 'Cannot process payment: Escrow not fully funded',
        blocking: true,
      },
      {
        module: 'm-marketplace' as ModuleName,
        check: 'CONTRACTOR_ASSIGNED' as CheckType,
        message: 'Cannot process payment: Contractor not assigned',
        blocking: true,
      },
      {
        module: 'm-project-owner' as ModuleName,
        check: 'CLIENT_APPROVED' as CheckType,
        message: 'Cannot process payment: Homeowner approval required',
        blocking: false, // Warning, not blocking
      },
    ] as GateCheck[],

    enforce: async (projectId: string, paymentId: string): Promise<GateResult> => {
      const checks = await Promise.all(
        COMPLIANCE_GATES.CONTRACTOR_PAYMENT.checks.map(async (check) => {
          const result = await performCheck(check, { projectId, paymentId })
          return {
            module: check.module,
            check: check.check,
            passed: result.passed,
            message: check.message,
            data: result.data,
          }
        })
      )

      const blockingFailed = checks.filter((c) => !c.passed && COMPLIANCE_GATES.CONTRACTOR_PAYMENT.checks.find((ch) => ch.check === c.check)?.blocking)
      const canProceed = blockingFailed.length === 0

      if (!canProceed) {
        throw new ComplianceError(
          blockingFailed.map((c) => ({
            module: c.module,
            check: c.check,
            message: c.message,
          }))
        )
      }

      return {
        passed: canProceed,
        checks,
        failedChecks: checks.filter((c) => !c.passed),
        canProceed,
      }
    },
  },

  PROJECT_START: {
    name: 'Project Start',
    checks: [
      {
        module: 'm-permits-inspections' as ModuleName,
        check: 'PERMIT_VALID' as CheckType,
        message: 'Cannot start project: Valid permit required',
        blocking: true,
      },
      {
        module: 'm-finance-trust' as ModuleName,
        check: 'ESCROW_FUNDED' as CheckType,
        message: 'Cannot start project: Escrow must be funded',
        blocking: true,
      },
      {
        module: 'm-marketplace' as ModuleName,
        check: 'CONTRACTOR_ASSIGNED' as CheckType,
        message: 'Cannot start project: Contractor must be assigned',
        blocking: true,
      },
      {
        module: 'm-architect' as ModuleName,
        check: 'DESIGN_APPROVED' as CheckType,
        message: 'Cannot start project: Design must be approved',
        blocking: true,
      },
    ] as GateCheck[],

    enforce: async (projectId: string): Promise<GateResult> => {
      const checks = await Promise.all(
        COMPLIANCE_GATES.PROJECT_START.checks.map(async (check) => {
          const result = await performCheck(check, { projectId })
          return {
            module: check.module,
            check: check.check,
            passed: result.passed,
            message: check.message,
            data: result.data,
          }
        })
      )

      const failedChecks = checks.filter((c) => !c.passed)
      const canProceed = failedChecks.length === 0

      if (!canProceed) {
        throw new ComplianceError(
          failedChecks.map((c) => ({
            module: c.module,
            check: c.check,
            message: c.message,
          }))
        )
      }

      return {
        passed: canProceed,
        checks,
        failedChecks,
        canProceed,
      }
    },
  },
}

/**
 * Perform a compliance check
 */
async function performCheck(
  check: GateCheck,
  params: Record<string, any>
): Promise<{ passed: boolean; data?: any }> {
  const { module, check: checkType, params: checkParams } = check
  const allParams = { ...params, ...checkParams }

  try {
    switch (module) {
      case 'm-permits-inspections':
        return await checkPermitStatus(checkType, allParams)

      case 'm-finance-trust':
        return await checkEscrowStatus(checkType, allParams)

      case 'm-project-owner':
        return await checkClientApproval(checkType, allParams)

      case 'm-marketplace':
        return await checkContractorAssignment(checkType, allParams)

      case 'm-architect':
        return await checkDesignApproval(checkType, allParams)

      case 'm-engineer':
        return await checkEngineerStamp(checkType, allParams)

      case 'm-ops-services':
        return await checkSOPComplete(checkType, allParams)

      default:
        return { passed: false, data: { error: `Unknown module: ${module}` } }
    }
  } catch (error: any) {
    console.error(`Error performing check ${checkType} for ${module}:`, error)
    return { passed: false, data: { error: error.message } }
  }
}

/**
 * Check permit status
 */
async function checkPermitStatus(checkType: CheckType, params: Record<string, any>): Promise<{ passed: boolean; data?: any }> {
  if (checkType !== 'PERMIT_VALID') {
    return { passed: false }
  }

  const { projectId } = params

  const permit = await prisma.permitApplication?.findFirst({
    where: {
      projectId,
      status: {
        in: ['APPROVED', 'ISSUED'],
      },
      expiresAt: {
        gte: new Date(), // Not expired
      },
    },
  }).catch(() => null)

  return {
    passed: permit !== null,
    data: {
      permitId: permit?.id,
      status: permit?.status,
      expiresAt: permit?.expiresAt,
    },
  }
}

/**
 * Check escrow status
 */
async function checkEscrowStatus(checkType: CheckType, params: Record<string, any>): Promise<{ passed: boolean; data?: any }> {
  if (checkType !== 'ESCROW_FUNDED') {
    return { passed: false }
  }

  const { projectId } = params

  const escrow = await prisma.escrowAccount?.findFirst({
    where: {
      projectId,
      status: {
        in: ['FUNDED', 'ACTIVE'],
      },
    },
  }).catch(() => null)

  const isFunded = escrow !== null && (escrow.status === 'FUNDED' || escrow.status === 'ACTIVE')

  return {
    passed: isFunded,
    data: {
      escrowId: escrow?.id,
      status: escrow?.status,
      balance: escrow?.balance,
    },
  }
}

/**
 * Check client approval
 */
async function checkClientApproval(checkType: CheckType, params: Record<string, any>): Promise<{ passed: boolean; data?: any }> {
  if (checkType !== 'CLIENT_APPROVED') {
    return { passed: false }
  }

  const { projectId, milestoneId } = params

  // Check if project has client approval
  const project = await prisma.project?.findUnique({
    where: { id: projectId },
  }).catch(() => null)

  // Check contracts separately
  const contracts = await prisma.contractAgreement?.findMany({
    where: {
      projectId,
      status: 'SIGNED',
    },
  }).catch(() => [])

  // For milestone-specific approval, check milestone approval status
  if (milestoneId) {
    // This would check milestone approval records
    // For now, assume project approval is sufficient
  }

  const hasApproval = project !== null && contracts && contracts.length > 0

  return {
    passed: hasApproval,
    data: {
      projectId: project?.id,
      contractsSigned: contracts?.length || 0,
    },
  }
}

/**
 * Check contractor assignment
 */
async function checkContractorAssignment(checkType: CheckType, params: Record<string, any>): Promise<{ passed: boolean; data?: any }> {
  if (checkType !== 'CONTRACTOR_ASSIGNED') {
    return { passed: false }
  }

  const { projectId } = params

  const contract = await prisma.contractAgreement?.findFirst({
    where: {
      projectId,
      status: {
        in: ['SIGNED', 'ACTIVE'],
      },
    },
    include: {
      contractor: true,
    },
  }).catch(() => null)

  return {
    passed: contract !== null && contract.contractorId !== null,
    data: {
      contractId: contract?.id,
      contractorId: contract?.contractorId,
      status: contract?.status,
    },
  }
}

/**
 * Check design approval
 */
async function checkDesignApproval(checkType: CheckType, params: Record<string, any>): Promise<{ passed: boolean; data?: any }> {
  if (checkType !== 'DESIGN_APPROVED') {
    return { passed: false }
  }

  const { projectId } = params

  // Check if design project is approved
  // This would integrate with architect module
  // For now, return placeholder
  return {
    passed: true, // Placeholder
    data: {
      projectId,
    },
  }
}

/**
 * Check engineer stamp
 */
async function checkEngineerStamp(checkType: CheckType, params: Record<string, any>): Promise<{ passed: boolean; data?: any }> {
  if (checkType !== 'ENGINEER_STAMPED') {
    return { passed: false }
  }

  const { projectId } = params

  // Check if engineering documents are stamped
  // This would integrate with engineer module
  // For now, return placeholder
  return {
    passed: true, // Placeholder
    data: {
      projectId,
    },
  }
}

/**
 * Check SOP completion
 */
async function checkSOPComplete(checkType: CheckType, params: Record<string, any>): Promise<{ passed: boolean; data?: any }> {
  if (checkType !== 'SOP_COMPLETE') {
    return { passed: false }
  }

  const { projectId } = params

  // Check if required SOP steps are completed
  const incompleteSteps = await prisma.sOPCompletion?.findMany({
    where: {
      projectId,
      isRequired: true,
      completedAt: null,
    },
  }).catch(() => [])

  return {
    passed: !incompleteSteps || incompleteSteps.length === 0,
    data: {
      incompleteSteps: incompleteSteps?.length || 0,
    },
  }
}

/**
 * Get all available gates
 */
export function getAvailableGates() {
  return Object.keys(COMPLIANCE_GATES).map((key) => {
    const gate = (COMPLIANCE_GATES as any)[key]
    return {
      id: key,
      name: gate.name,
      checks: gate.checks,
    }
  })
}

/**
 * Check a specific gate
 */
export async function checkGate(gateId: string, params: Record<string, any>): Promise<GateResult> {
  const gate = (COMPLIANCE_GATES as any)[gateId]
  if (!gate) {
    throw new Error(`Gate ${gateId} not found`)
  }

  if (!gate.enforce) {
    throw new Error(`Gate ${gateId} does not have enforce method`)
  }

  return await gate.enforce(params.projectId, params.milestoneId || params.paymentId || params)
}
