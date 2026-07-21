import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'

export const spatialService = {
  /**
   * Upload a spatial scan for a project
   */
  async uploadScan(
    data: {
      projectId: string
      scanType: string
      fileUrl: string
      fileSize?: number
      format?: string
      deviceInfo?: any
      pointCount?: number
      coverage?: number
      accuracy?: number
    },
    userId: string
  ) {
    const project = await prismaAny.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, ownerId: true, memberships: { select: { userId: true } } },
    })

    if (!project) throw new NotFoundError('Project', data.projectId)

    const isMember =
      project.ownerId === userId ||
      project.memberships?.some((m: any) => m.userId === userId)
    if (!isMember) {
      throw new AuthorizationError('Only project members can upload scans')
    }

    const scan = await prismaAny.spatialScan.create({
      data: {
        projectId: data.projectId,
        scanType: data.scanType,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ?? null,
        format: data.format ?? null,
        deviceInfo: data.deviceInfo ?? null,
        pointCount: data.pointCount ?? null,
        coverage: data.coverage ?? null,
        accuracy: data.accuracy ?? null,
        processed: false,
      },
    })

    return scan
  },

  /**
   * Get all scans for a project
   */
  async getProjectScans(projectId: string, userId: string, scanType?: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, memberships: { select: { userId: true } } },
    })

    if (!project) throw new NotFoundError('Project', projectId)

    const isMember =
      project.ownerId === userId ||
      project.memberships?.some((m: any) => m.userId === userId)
    if (!isMember) {
      throw new AuthorizationError('Only project members can view scans')
    }

    const where: any = { projectId }
    if (scanType) where.scanType = scanType

    const scans = await prismaAny.spatialScan.findMany({
      where,
      include: {
        verifications: {
          include: {
            milestone: { select: { id: true, name: true, status: true } },
            verifiedBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { scanDate: 'desc' },
    })

    return scans
  },

  /**
   * Get a single scan by ID
   */
  async getScan(scanId: string) {
    const scan = await prismaAny.spatialScan.findUnique({
      where: { id: scanId },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        verifications: {
          include: {
            milestone: true,
            verifiedBy: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!scan) throw new NotFoundError('SpatialScan', scanId)
    return scan
  },

  /**
   * Mark a scan as processed (trigger via BullMQ in production)
   */
  async processScan(scanId: string, userId: string) {
    const scan = await prismaAny.spatialScan.findUnique({
      where: { id: scanId },
      include: { project: { select: { ownerId: true, memberships: { select: { userId: true } } } } },
    })

    if (!scan) throw new NotFoundError('SpatialScan', scanId)

    const isMember =
      scan.project.ownerId === userId ||
      scan.project.memberships?.some((m: any) => m.userId === userId)
    if (!isMember) {
      throw new AuthorizationError('Only project members can process scans')
    }

    if (scan.processed) {
      throw new ValidationError('Scan is already processed')
    }

    const updated = await prismaAny.spatialScan.update({
      where: { id: scanId },
      data: {
        processed: true,
        processedAt: new Date(),
        processingNotes: 'Scan processed successfully',
      },
    })

    return updated
  },

  /**
   * Verify a milestone using a spatial scan and AI analysis
   */
  async verifyMilestone(milestoneId: string, scanId: string, verifiedById: string) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: { include: { project: { select: { id: true } } } },
        evidence: true,
      },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)

    const scan = await prismaAny.spatialScan.findUnique({ where: { id: scanId } })
    if (!scan) throw new NotFoundError('SpatialScan', scanId)
    if (!scan.processed) {
      throw new ValidationError('Scan must be processed before verification')
    }

    // Create verification record with PENDING status
    // Actual AI verification runs via BullMQ worker
    const verification = await prismaAny.spatialVerification.create({
      data: {
        milestoneId,
        scanId,
        verifiedById,
        status: 'PENDING',
        manualReview: false,
      },
    })

    return verification
  },

  /**
   * Manual review override for a verification
   */
  async manualReview(
    verificationId: string,
    reviewerId: string,
    decision: { status: string; notes: string }
  ) {
    const verification = await prismaAny.spatialVerification.findUnique({
      where: { id: verificationId },
      include: { milestone: true },
    })

    if (!verification) throw new NotFoundError('SpatialVerification', verificationId)

    const updated = await prismaAny.spatialVerification.update({
      where: { id: verificationId },
      data: {
        status: decision.status,
        manualReview: true,
        reviewNotes: decision.notes,
        verifiedById: reviewerId,
        verifiedAt: new Date(),
      },
      include: { milestone: true },
    })

    // Update milestone status based on review decision
    if (decision.status === 'PASSED') {
      await prismaAny.milestone.update({
        where: { id: verification.milestoneId },
        data: { status: 'APPROVED' },
      })
    }

    return updated
  },

  /**
   * Compare two scans (before/after)
   */
  async compareScans(scan1Id: string, scan2Id: string) {
    const [scan1, scan2] = await Promise.all([
      prismaAny.spatialScan.findUnique({ where: { id: scan1Id } }),
      prismaAny.spatialScan.findUnique({ where: { id: scan2Id } }),
    ])

    if (!scan1) throw new NotFoundError('SpatialScan', scan1Id)
    if (!scan2) throw new NotFoundError('SpatialScan', scan2Id)

    if (scan1.projectId !== scan2.projectId) {
      throw new ValidationError('Scans must be from the same project')
    }

    // In production, this would invoke actual point cloud comparison
    const comparison = {
      scan1: { id: scan1.id, scanDate: scan1.scanDate, pointCount: scan1.pointCount },
      scan2: { id: scan2.id, scanDate: scan2.scanDate, pointCount: scan2.pointCount },
      changes: {
        volumeChange: 0,
        areaChange: 0,
        majorChanges: [] as any[],
      },
      matchScore: 0,
    }

    return comparison
  },

  /**
   * Get scan statistics for a project
   */
  async getScanStatistics(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, memberships: { select: { userId: true } } },
    })

    if (!project) throw new NotFoundError('Project', projectId)

    const isMember =
      project.ownerId === userId ||
      project.memberships?.some((m: any) => m.userId === userId)
    if (!isMember) {
      throw new AuthorizationError('Only project members can view statistics')
    }

    const scans = await prismaAny.spatialScan.findMany({
      where: { projectId },
      include: { verifications: true },
    })

    const byType: Record<string, number> = {}
    scans.forEach((scan: any) => {
      byType[scan.scanType] = (byType[scan.scanType] || 0) + 1
    })

    return {
      totalScans: scans.length,
      byType,
      processed: scans.filter((s: any) => s.processed).length,
      unprocessed: scans.filter((s: any) => !s.processed).length,
      withVerification: scans.filter((s: any) => s.verifications.length > 0).length,
      totalPointCount: scans.reduce((sum: number, s: any) => sum + (s.pointCount || 0), 0),
      averageCoverage:
        scans.length > 0
          ? scans.reduce((sum: number, s: any) => sum + (s.coverage || 0), 0) / scans.length
          : 0,
      averageAccuracy:
        scans.length > 0
          ? scans.reduce((sum: number, s: any) => sum + (s.accuracy || 0), 0) / scans.length
          : 0,
    }
  },
}
