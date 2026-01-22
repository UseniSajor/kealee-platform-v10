import { prismaAny } from '../../utils/prisma-helper'

interface ComplianceCheckResult {
  canComplete: boolean
  blockers: Array<{
    type: 'SOP' | 'GATE' | 'AUDIT' | 'PERMIT' | 'DOCUMENT'
    message: string
    severity: 'ERROR' | 'WARNING'
    actionRequired: string
  }>
  warnings: Array<{
    type: string
    message: string
    actionRecommended: string
  }>
}

/**
 * Compliance checking service that blocks task completion
 * if required compliance steps are not met
 */
export const pmComplianceCheckService = {
  /**
   * Check if a task can be completed based on compliance requirements
   */
  async checkTaskCompletionCompliance(
    taskId: string,
    userId: string,
    projectId?: string
  ): Promise<ComplianceCheckResult> {
    const blockers: ComplianceCheckResult['blockers'] = []
    const warnings: ComplianceCheckResult['warnings'] = []

    // Get task details
    const task = await prismaAny.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            gates: {
              where: { isMandatory: true, status: { not: 'APPROVED' } },
            },
          },
        },
      },
    })

    if (!task) {
      blockers.push({
        type: 'AUDIT',
        message: 'Task not found',
        severity: 'ERROR',
        actionRequired: 'Verify task exists',
      })
      return { canComplete: false, blockers, warnings }
    }

    // Check 1: Required SOP steps completed
    if (projectId) {
      const requiredSOPSteps = await prismaAny.sOPCompletion?.findMany({
        where: {
          projectId,
          isRequired: true,
          completedAt: null,
        },
      }).catch(() => [])

      if (requiredSOPSteps && requiredSOPSteps.length > 0) {
        blockers.push({
          type: 'SOP',
          message: `${requiredSOPSteps.length} required SOP step(s) not completed`,
          severity: 'ERROR',
          actionRequired: 'Complete all required SOP steps before completing this task',
        })
      }
    }

    // Check 2: Mandatory gates approved
    if (task.project?.gates && task.project.gates.length > 0) {
      const unapprovedGates = task.project.gates.filter(
        (gate: any) => gate.status !== 'APPROVED'
      )

      if (unapprovedGates.length > 0) {
        blockers.push({
          type: 'GATE',
          message: `${unapprovedGates.length} mandatory gate(s) not approved`,
          severity: 'ERROR',
          actionRequired: 'All mandatory gates must be approved before task completion',
        })
      }
    }

    // Check 3: Required permits approved (if task is permit-related)
    if (task.title.toLowerCase().includes('permit') && projectId) {
      const pendingPermits = await prismaAny.permitApplication?.findMany({
        where: {
          projectId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED'] },
        },
      }).catch(() => [])

      if (pendingPermits && pendingPermits.length > 0) {
        blockers.push({
          type: 'PERMIT',
          message: `${pendingPermits.length} permit(s) still pending approval`,
          severity: 'ERROR',
          actionRequired: 'All required permits must be approved',
        })
      }
    }

    // Check 4: Required documents uploaded
    if (projectId) {
      const requiredDocs = await prismaAny.projectDocument?.findMany({
        where: {
          projectId,
          isRequired: true,
          uploadedAt: null,
        },
      }).catch(() => [])

      if (requiredDocs && requiredDocs.length > 0) {
        warnings.push({
          type: 'DOCUMENT',
          message: `${requiredDocs.length} required document(s) not uploaded`,
          actionRecommended: 'Upload required documents for compliance',
        })
      }
    }

    // Check 5: Audit score threshold (warning only)
    const recentAuditLogs = await prismaAny.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    })

    const failedAudits = recentAuditLogs.filter((log: any) => log.severity === 'ERROR').length
    const auditScore = recentAuditLogs.length > 0
      ? 100 - (failedAudits / recentAuditLogs.length) * 100
      : 100

    if (auditScore < 70) {
      warnings.push({
        type: 'AUDIT',
        message: `Low audit score: ${Math.round(auditScore)}%`,
        actionRecommended: 'Review and address recent audit issues',
      })
    }

    const canComplete = blockers.length === 0

    return { canComplete, blockers, warnings }
  },

  /**
   * Get compliance status for a project
   */
  async getProjectComplianceStatus(projectId: string): Promise<{
    overall: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING'
    details: {
      sopSteps: { required: number; completed: number }
      gates: { mandatory: number; approved: number }
      permits: { required: number; approved: number }
      documents: { required: number; uploaded: number }
    }
  }> {
    const [sopSteps, gates, permits, documents] = await Promise.all([
      prismaAny.sOPCompletion?.findMany({
        where: { projectId, isRequired: true },
      }).catch(() => []),
      prismaAny.projectGate?.findMany({
        where: { projectId, isMandatory: true },
      }).catch(() => []),
      prismaAny.permitApplication?.findMany({
        where: { projectId },
      }).catch(() => []),
      prismaAny.projectDocument?.findMany({
        where: { projectId, isRequired: true },
      }).catch(() => []),
    ])

    const details = {
      sopSteps: {
        required: sopSteps?.length || 0,
        completed: sopSteps?.filter((s: any) => s.completedAt).length || 0,
      },
      gates: {
        mandatory: gates?.length || 0,
        approved: gates?.filter((g: any) => g.status === 'APPROVED').length || 0,
      },
      permits: {
        required: permits?.length || 0,
        approved: permits?.filter((p: any) => p.status === 'APPROVED').length || 0,
      },
      documents: {
        required: documents?.length || 0,
        uploaded: documents?.filter((d: any) => d.uploadedAt).length || 0,
      },
    }

    // Determine overall compliance
    const allCompliant =
      details.sopSteps.completed === details.sopSteps.required &&
      details.gates.approved === details.gates.mandatory &&
      details.permits.approved === details.permits.required &&
      details.documents.uploaded === details.documents.required

    const hasWarnings =
      details.sopSteps.completed < details.sopSteps.required ||
      details.gates.approved < details.gates.mandatory ||
      details.permits.approved < details.permits.required

    const overall = allCompliant
      ? 'COMPLIANT'
      : hasWarnings
      ? 'NON_COMPLIANT'
      : 'WARNING'

    return { overall, details }
  },
}




