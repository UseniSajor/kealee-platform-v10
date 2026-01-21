/**
 * Workflow Integration Service
 * Integrates with all Kealee modules to check workflow requirements
 */

import { prisma } from '@kealee/database'
import type { CheckType, ModuleName, CheckResult } from '../types'

export class WorkflowIntegrationService {
  /**
   * Check SOW validation from m-project-owner
   */
  async checkSOWValidated(projectId: string): Promise<CheckResult> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      }) as any

      if (!project) {
        return {
          check: 'SOW_VALIDATED',
          module: 'm-project-owner',
          passed: false,
          message: 'Project not found',
          timestamp: new Date(),
        }
      }

      // Check if SOW exists and is validated
      // SOW validation is typically indicated by project status or readiness completion
      const sowValidated = project.status === 'READINESS' || 
                          project.status === 'PERMITTING' ||
                          project.status === 'CONSTRUCTION' ||
                          project.readinessCompletedAt !== null ||
                          project.sowValidated === true

      return {
        check: 'SOW_VALIDATED',
        module: 'm-project-owner',
        passed: sowValidated,
        message: sowValidated 
          ? 'SOW is validated' 
          : 'SOW validation required',
        data: { projectId, projectStatus: project.status },
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'SOW_VALIDATED',
        module: 'm-project-owner',
        passed: false,
        message: `Error checking SOW: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check permit status from m-permits-inspections
   */
  async checkPermitApplied(projectId: string): Promise<CheckResult> {
    try {
      // Use optional chaining for models that may not exist in Prisma schema
      const permit = await (prisma as any).permitApplication?.findFirst({
        where: {
          projectId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ISSUED'] },
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null) || null

      return {
        check: 'PERMIT_APPLIED',
        module: 'm-permits-inspections',
        passed: permit !== null,
        message: permit 
          ? `Permit ${permit.status}` 
          : 'No permit application found',
        data: permit ? { permitId: permit.id, status: permit.status } : null,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'PERMIT_APPLIED',
        module: 'm-permits-inspections',
        passed: false,
        message: `Error checking permit: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  async checkPermitApproved(projectId: string): Promise<CheckResult> {
    try {
      const permit = await (prisma as any).permitApplication?.findFirst({
        where: {
          projectId,
          status: { in: ['APPROVED', 'ISSUED'] },
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null) || null

      return {
        check: 'PERMIT_APPROVED',
        module: 'm-permits-inspections',
        passed: permit !== null,
        message: permit 
          ? `Permit approved: ${permit.permitNumber || permit.id}` 
          : 'Permit not yet approved',
        data: permit ? { permitId: permit.id, permitNumber: permit.permitNumber } : null,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'PERMIT_APPROVED',
        module: 'm-permits-inspections',
        passed: false,
        message: `Error checking permit approval: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check escrow funding from m-finance-trust
   */
  async checkEscrowFunded(projectId: string): Promise<CheckResult> {
    try {
      const escrow = await (prisma as any).escrowAccount?.findFirst({
        where: {
          projectId,
          status: { in: ['FUNDED', 'ACTIVE'] },
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null) || null

      return {
        check: 'ESCROW_FUNDED',
        module: 'm-finance-trust',
        passed: escrow !== null && (escrow.status === 'FUNDED' || escrow.status === 'ACTIVE'),
        message: escrow 
          ? `Escrow funded: $${escrow.balance || 0}` 
          : 'Escrow not funded',
        data: escrow ? { escrowId: escrow.id, balance: escrow.balance } : null,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'ESCROW_FUNDED',
        module: 'm-finance-trust',
        passed: false,
        message: `Error checking escrow: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check contractor assignment from m-marketplace
   */
  async checkContractorAssigned(projectId: string): Promise<CheckResult> {
    try {
      const contract = await (prisma as any).contractAgreement?.findFirst({
        where: {
          projectId,
          contractorId: { not: null },
          status: { in: ['SENT', 'SIGNED', 'ACTIVE'] },
        },
        include: {
          contractor: true,
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null) || null

      return {
        check: 'CONTRACTOR_ASSIGNED',
        module: 'm-marketplace',
        passed: contract !== null && contract.contractorId !== null,
        message: contract 
          ? `Contractor assigned: ${(contract.contractor as any)?.name || 'Unknown'}` 
          : 'No contractor assigned',
        data: contract ? { 
          contractId: contract.id, 
          contractorId: contract.contractorId,
          contractorName: (contract.contractor as any)?.name,
        } : null,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'CONTRACTOR_ASSIGNED',
        module: 'm-marketplace',
        passed: false,
        message: `Error checking contractor: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check resource allocation from m-marketplace
   */
  async checkResourceAllocated(projectId: string): Promise<CheckResult> {
    try {
      // Check if project has assigned resources (contractors, materials, etc.)
      const contract = await (prisma as any).contractAgreement?.findFirst({
        where: {
          projectId,
          contractorId: { not: null },
        },
      }).catch(() => null) || null

      const hasResources = contract !== null

      return {
        check: 'RESOURCE_ALLOCATED',
        module: 'm-marketplace',
        passed: hasResources,
        message: hasResources 
          ? 'Resources allocated' 
          : 'Resource allocation required',
        data: { projectId, hasContractor: contract !== null },
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'RESOURCE_ALLOCATED',
        module: 'm-marketplace',
        passed: false,
        message: `Error checking resources: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check schedule approval from os-pm
   */
  async checkScheduleApproved(projectId: string): Promise<CheckResult> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      }) as any

      // Check if project has an approved schedule
      // Schedule approval is typically indicated by project status
      const scheduleApproved = project?.status === 'PERMITTING' || 
                              project?.status === 'CONSTRUCTION' ||
                              project?.status === 'CLOSEOUT' ||
                              project?.scheduleApproved === true

      return {
        check: 'SCHEDULE_APPROVED',
        module: 'os-pm',
        passed: scheduleApproved,
        message: scheduleApproved 
          ? 'Schedule approved' 
          : 'Schedule approval required',
        data: { projectId, projectStatus: project?.status },
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'SCHEDULE_APPROVED',
        module: 'os-pm',
        passed: false,
        message: `Error checking schedule: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check budget verification from m-finance-trust
   */
  async checkBudgetVerified(projectId: string): Promise<CheckResult> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      }) as any

      // Check if budget is verified (has budget amount and is approved)
      const budgetVerified = project?.budget !== null && 
                            project?.budget !== undefined &&
                            project?.budgetApproved === true

      return {
        check: 'BUDGET_VERIFIED',
        module: 'm-finance-trust',
        passed: budgetVerified,
        message: budgetVerified 
          ? `Budget verified: $${project?.budget || 0}` 
          : 'Budget verification required',
        data: { projectId, budget: project?.budget },
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'BUDGET_VERIFIED',
        module: 'm-finance-trust',
        passed: false,
        message: `Error checking budget: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check client signed contract
   */
  async checkClientSignedContract(projectId: string): Promise<CheckResult> {
    try {
      const contract = await (prisma as any).contractAgreement?.findFirst({
        where: {
          projectId,
          status: { in: ['SIGNED', 'ACTIVE'] },
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null) || null

      return {
        check: 'CLIENT_SIGNED_CONTRACT',
        module: 'm-project-owner',
        passed: contract !== null && contract.status === 'SIGNED',
        message: contract 
          ? 'Contract signed by client' 
          : 'Client contract signature required',
        data: contract ? { contractId: contract.id, status: contract.status } : null,
        timestamp: new Date(),
      }
    } catch (error: any) {
      return {
        check: 'CLIENT_SIGNED_CONTRACT',
        module: 'm-project-owner',
        passed: false,
        message: `Error checking contract: ${error.message}`,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Generic check executor
   */
  async executeCheck(check: CheckType, projectId: string): Promise<CheckResult> {
    switch (check) {
      case 'SOW_VALIDATED':
        return this.checkSOWValidated(projectId)
      case 'PERMIT_APPLIED':
        return this.checkPermitApplied(projectId)
      case 'PERMIT_APPROVED':
        return this.checkPermitApproved(projectId)
      case 'ESCROW_FUNDED':
        return this.checkEscrowFunded(projectId)
      case 'CONTRACTOR_ASSIGNED':
        return this.checkContractorAssigned(projectId)
      case 'RESOURCE_ALLOCATED':
        return this.checkResourceAllocated(projectId)
      case 'SCHEDULE_APPROVED':
        return this.checkScheduleApproved(projectId)
      case 'BUDGET_VERIFIED':
        return this.checkBudgetVerified(projectId)
      case 'CLIENT_SIGNED_CONTRACT':
        return this.checkClientSignedContract(projectId)
      default:
        return {
          check,
          module: 'm-project-owner' as ModuleName,
          passed: false,
          message: `Unknown check type: ${check}`,
          timestamp: new Date(),
        }
    }
  }
}

