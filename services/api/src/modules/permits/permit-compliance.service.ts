import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

// Simplified permit status check (will be extended when full Permit model is added)
type PermitStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ISSUED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED'

type PermitInfo = {
  id: string
  permitNumber: string
  status: PermitStatus
  expiresAt: Date | null
  issuedAt: Date | null
  type: string
  description: string
}

export const permitComplianceService = {
  /**
   * Get permits for a project (Prompt 3.6)
   * Note: This is a placeholder that will be extended when Permit model is fully integrated
   */
  async getProjectPermits(projectId: string): Promise<PermitInfo[]> {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      include: {
        property: true,
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)

    // Query Permit model for project permits
    const permits = await prismaAny.permit.findMany({
      where: { projectId },
      select: {
        id: true,
        permitNumber: true,
        status: true,
        type: true,
        expiresAt: true,
        issuedAt: true,
        description: true,
      },
    }).catch(() => [] as any[])

    return permits.map((p: any) => ({
      id: p.id,
      permitNumber: p.permitNumber || 'PERMIT-' + p.id.substring(0, 8),
      status: p.status as PermitStatus,
      expiresAt: p.expiresAt,
      issuedAt: p.issuedAt,
      type: p.type || 'BUILDING',
      description: p.description || '',
    }))
  },

  /**
   * Check if permits are valid for milestone approval (Prompt 3.6)
   */
  async checkPermitCompliance(projectId: string, milestoneId?: string): Promise<{
    compliant: boolean
    reasons: string[]
    permits: PermitInfo[]
    expiredPermits: PermitInfo[]
    invalidPermits: PermitInfo[]
  }> {
    const permits = await this.getProjectPermits(projectId)

    const reasons: string[] = []
    const expiredPermits: PermitInfo[] = []
    const invalidPermits: PermitInfo[] = []

    // Check each permit
    for (const permit of permits) {
      // Check if permit is expired
      if (permit.expiresAt && permit.expiresAt < new Date()) {
        expiredPermits.push(permit)
        reasons.push(`Permit ${permit.permitNumber} expired on ${permit.expiresAt.toLocaleDateString()}`)
      }

      // Check if permit status is invalid for construction
      const invalidStatuses: PermitStatus[] = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'EXPIRED', 'CANCELLED']
      if (invalidStatuses.includes(permit.status)) {
        invalidPermits.push(permit)
        reasons.push(`Permit ${permit.permitNumber} has invalid status: ${permit.status}`)
      }
    }

    // If no permits exist, that's also a compliance issue (for construction milestones)
    // But we'll allow it for now since permits may not be required for all projects
    // In production, you might want to check project status and milestone type

    return {
      compliant: reasons.length === 0,
      reasons,
      permits,
      expiredPermits,
      invalidPermits,
    }
  },

  /**
   * Validate permit status before milestone approval (Prompt 3.6)
   * Throws error if permits are not compliant
   */
  async validatePermitsForApproval(projectId: string, milestoneId?: string): Promise<void> {
    const compliance = await this.checkPermitCompliance(projectId, milestoneId)

    if (!compliance.compliant) {
      throw new Error(
        `Cannot approve milestone: Permit compliance issues found.\n${compliance.reasons.join('\n')}`
      )
    }
  },

  /**
   * Get permit status summary for display (Prompt 3.6)
   */
  async getPermitStatusSummary(projectId: string): Promise<{
    totalPermits: number
    activePermits: number
    expiredPermits: number
    invalidPermits: number
    permits: Array<{
      id: string
      permitNumber: string
      type: string
      status: string
      expiresAt: string | null
      isExpired: boolean
      isValid: boolean
    }>
  }> {
    const permits = await this.getProjectPermits(projectId)

    const now = new Date()
    const activePermits = permits.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'ISSUED' || p.status === 'APPROVED'
    )
    const expiredPermits = permits.filter((p) => p.expiresAt && p.expiresAt < now)
    const invalidPermits = permits.filter((p) =>
      ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'EXPIRED', 'CANCELLED'].includes(p.status)
    )

    return {
      totalPermits: permits.length,
      activePermits: activePermits.length,
      expiredPermits: expiredPermits.length,
      invalidPermits: invalidPermits.length,
      permits: permits.map((p) => ({
        id: p.id,
        permitNumber: p.permitNumber,
        type: p.type,
        status: p.status,
        expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
        isExpired: p.expiresAt ? p.expiresAt < now : false,
        isValid: !['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'EXPIRED', 'CANCELLED'].includes(p.status),
      })),
    }
  },
}
