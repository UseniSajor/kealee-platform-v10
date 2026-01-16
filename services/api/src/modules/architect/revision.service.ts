import { prisma } from '@kealee/database'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const revisionService = {
  /**
   * Create revision
   */
  async createRevision(data: {
    designProjectId: string
    revisionLetter: string
    revisionDate: Date
    description: string
    revisionType: string
    issuanceType?: string
    affectedDisciplines?: string[]
    impactLevel?: string
    requiresCoordination?: boolean
    relatedChangeOrderId?: string
    relatedAddendumId?: string
    createdById: string
  }) {
    // Get next revision number
    const existingRevisions = await prisma.revision.findMany({
      where: { designProjectId: data.designProjectId },
      orderBy: { revisionNumber: 'desc' },
      take: 1,
    })

    const nextRevisionNumber = existingRevisions.length > 0
      ? existingRevisions[0].revisionNumber + 1
      : 1

    // Validate revision letter uniqueness
    const existing = await prisma.revision.findUnique({
      where: {
        designProjectId_revisionLetter: {
          designProjectId: data.designProjectId,
          revisionLetter: data.revisionLetter,
        },
      },
    })

    if (existing) {
      throw new ValidationError(`Revision "${data.revisionLetter}" already exists`)
    }

    const revision = await prisma.revision.create({
      data: {
        designProjectId: data.designProjectId,
        revisionLetter: data.revisionLetter,
        revisionNumber: nextRevisionNumber,
        revisionDate: data.revisionDate,
        description: data.description,
        revisionType: data.revisionType as any,
        issuanceType: data.issuanceType as any,
        affectedDisciplines: data.affectedDisciplines || [],
        impactLevel: (data.impactLevel as any) || 'NONE',
        requiresCoordination: data.requiresCoordination || false,
        relatedChangeOrderId: data.relatedChangeOrderId,
        relatedAddendumId: data.relatedAddendumId,
        status: 'DRAFT',
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVISION_CREATED',
      entityType: 'Revision',
      entityId: revision.id,
      userId: data.createdById,
      reason: `Revision ${data.revisionLetter} created: ${data.description}`,
      after: {
        revisionLetter: data.revisionLetter,
        revisionNumber: nextRevisionNumber,
      },
    })

    return revision
  },

  /**
   * Get revision with all details
   */
  async getRevision(revisionId: string) {
    const revision = await prisma.revision.findUnique({
      where: { id: revisionId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        sheetRevisions: {
          include: {
            sheet: {
              select: {
                id: true,
                sheetNumber: true,
                sheetTitle: true,
                discipline: true,
              },
            },
          },
        },
        impacts: {
          include: {
            coordinatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!revision) {
      throw new NotFoundError('Revision', revisionId)
    }

    return revision
  },

  /**
   * List revisions
   */
  async listRevisions(designProjectId: string, filters?: {
    status?: string
    issuanceType?: string
    fromDate?: Date
    toDate?: Date
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.issuanceType) {
      where.issuanceType = filters.issuanceType
    }

    if (filters?.fromDate || filters?.toDate) {
      where.revisionDate = {}
      if (filters.fromDate) {
        where.revisionDate.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.revisionDate.lte = filters.toDate
      }
    }

    const revisions = await prisma.revision.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sheetRevisions: true,
            impacts: true,
          },
        },
      },
      orderBy: {
        revisionDate: 'desc',
      },
    })

    return revisions
  },

  /**
   * Add sheet to revision
   */
  async addSheetToRevision(data: {
    revisionId: string
    sheetId: string
    cloudAreas?: any[]
    revisionDescription?: string
    affectedAreas?: string[]
    changeType: string
  }) {
    const revision = await prisma.revision.findUnique({
      where: { id: data.revisionId },
    })

    if (!revision) {
      throw new NotFoundError('Revision', data.revisionId)
    }

    const sheet = await prisma.drawingSheet.findUnique({
      where: { id: data.sheetId },
    })

    if (!sheet) {
      throw new NotFoundError('DrawingSheet', data.sheetId)
    }

    if (sheet.designProjectId !== revision.designProjectId) {
      throw new ValidationError('Sheet must be from the same project as revision')
    }

    const sheetRevision = await prisma.sheetRevision.upsert({
      where: {
        revisionId_sheetId: {
          revisionId: data.revisionId,
          sheetId: data.sheetId,
        },
      },
      update: {
        cloudAreas: (data.cloudAreas || []) as any,
        revisionDescription: data.revisionDescription,
        affectedAreas: data.affectedAreas || [],
        changeType: data.changeType as any,
      },
      create: {
        revisionId: data.revisionId,
        sheetId: data.sheetId,
        cloudAreas: (data.cloudAreas || []) as any,
        revisionDescription: data.revisionDescription,
        affectedAreas: data.affectedAreas || [],
        changeType: data.changeType as any,
      },
    })

    // Update sheet's current revision
    await prisma.drawingSheet.update({
      where: { id: data.sheetId },
      data: {
        currentRevision: revision.revisionLetter,
        revisionHistory: {
          push: {
            revision: revision.revisionLetter,
            date: revision.revisionDate.toISOString(),
            description: data.revisionDescription || revision.description,
            type: data.changeType,
            cloudAreas: data.cloudAreas || [],
          },
        } as any,
      },
    })

    return sheetRevision
  },

  /**
   * Approve revision
   */
  async approveRevision(revisionId: string, data: {
    approvalNotes?: string
    userId: string
  }) {
    const revision = await prisma.revision.findUnique({
      where: { id: revisionId },
    })

    if (!revision) {
      throw new NotFoundError('Revision', revisionId)
    }

    if (revision.status !== 'DRAFT' && revision.status !== 'PENDING_APPROVAL') {
      throw new ValidationError('Only draft or pending revisions can be approved')
    }

    const updated = await prisma.revision.update({
      where: { id: revisionId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: data.userId,
        approvalNotes: data.approvalNotes,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVISION_APPROVED',
      entityType: 'Revision',
      entityId: revisionId,
      userId: data.userId,
      reason: data.approvalNotes || 'Revision approved',
      after: {
        status: 'APPROVED',
        approvedAt: updated.approvedAt,
      },
    })

    return updated
  },

  /**
   * Issue revision
   */
  async issueRevision(revisionId: string, data: {
    issuedTo?: string
    userId: string
  }) {
    const revision = await prisma.revision.findUnique({
      where: { id: revisionId },
    })

    if (!revision) {
      throw new NotFoundError('Revision', revisionId)
    }

    if (revision.status !== 'APPROVED') {
      throw new ValidationError('Only approved revisions can be issued')
    }

    const updated = await prisma.revision.update({
      where: { id: revisionId },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
        issuedById: data.userId,
        issuedTo: data.issuedTo,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVISION_ISSUED',
      entityType: 'Revision',
      entityId: revisionId,
      userId: data.userId,
      reason: `Revision issued${data.issuedTo ? ` to ${data.issuedTo}` : ''}`,
      after: {
        status: 'ISSUED',
        issuedAt: updated.issuedAt,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'REVISION_ISSUED',
      entityType: 'Revision',
      entityId: revisionId,
      userId: data.userId,
      payload: {
        revisionLetter: revision.revisionLetter,
        designProjectId: revision.designProjectId,
        issuedTo: data.issuedTo,
      },
    })

    return updated
  },

  /**
   * Generate revision schedule
   */
  async generateRevisionSchedule(data: {
    designProjectId: string
    revisionId?: string
    scheduleType: string
    format?: string
    templateId?: string
    createdById: string
  }) {
    // Get revisions to include
    const where: any = {
      designProjectId: data.designProjectId,
      status: { not: 'CANCELLED' },
    }

    if (data.revisionId) {
      where.id = data.revisionId
    }

    const revisions = await prisma.revision.findMany({
      where,
      include: {
        sheetRevisions: {
          include: {
            sheet: {
              select: {
                id: true,
                sheetNumber: true,
                sheetTitle: true,
                discipline: true,
              },
            },
          },
        },
      },
      orderBy: {
        revisionDate: 'desc',
      },
    })

    // Get all sheets
    const sheets = await prisma.drawingSheet.findMany({
      where: { designProjectId: data.designProjectId },
      select: {
        id: true,
        sheetNumber: true,
        sheetTitle: true,
        discipline: true,
        currentRevision: true,
      },
    })

    // Generate schedule data
    const scheduleData = {
      revisions: revisions.map((r) => ({
        id: r.id,
        revisionLetter: r.revisionLetter,
        revisionNumber: r.revisionNumber,
        revisionDate: r.revisionDate,
        description: r.description,
        issuanceType: r.issuanceType,
        status: r.status,
        sheetCount: r.sheetRevisions.length,
      })),
      sheets: sheets.map((s) => ({
        id: s.id,
        sheetNumber: s.sheetNumber,
        sheetTitle: s.sheetTitle,
        discipline: s.discipline,
        currentRevision: s.currentRevision,
        revisions: revisions
          .filter((r) => r.sheetRevisions.some((sr) => sr.sheetId === s.id))
          .map((r) => r.revisionLetter),
      })),
      summary: {
        totalRevisions: revisions.length,
        totalSheets: sheets.length,
        issuedRevisions: revisions.filter((r) => r.status === 'ISSUED').length,
        pendingRevisions: revisions.filter((r) => r.status === 'PENDING_APPROVAL').length,
      },
    }

    const schedule = await prisma.revisionSchedule.create({
      data: {
        designProjectId: data.designProjectId,
        revisionId: data.revisionId,
        scheduleType: data.scheduleType,
        scheduleData: scheduleData as any,
        format: data.format,
        templateId: data.templateId,
        createdById: data.createdById,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVISION_SCHEDULE_GENERATED',
      entityType: 'RevisionSchedule',
      entityId: schedule.id,
      userId: data.createdById,
      reason: `Revision schedule generated (${data.scheduleType})`,
      after: {
        scheduleType: data.scheduleType,
        revisionCount: revisions.length,
      },
    })

    return schedule
  },

  /**
   * Get revision schedule
   */
  async getRevisionSchedule(scheduleId: string) {
    const schedule = await prisma.revisionSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        revision: {
          select: {
            id: true,
            revisionLetter: true,
            description: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!schedule) {
      throw new NotFoundError('RevisionSchedule', scheduleId)
    }

    return schedule
  },

  /**
   * Analyze revision impact
   */
  async analyzeRevisionImpact(revisionId: string) {
    const revision = await prisma.revision.findUnique({
      where: { id: revisionId },
      include: {
        sheetRevisions: {
          include: {
            sheet: {
              select: {
                id: true,
                sheetNumber: true,
                discipline: true,
              },
            },
          },
        },
      },
    })

    if (!revision) {
      throw new NotFoundError('Revision', revisionId)
    }

    // Get affected disciplines from sheets
    const affectedDisciplines = new Set<string>()
    const affectedSheetIds: string[] = []

    revision.sheetRevisions.forEach((sr) => {
      affectedDisciplines.add(sr.sheet.discipline)
      affectedSheetIds.push(sr.sheet.id)
    })

    // Check for cross-discipline impacts
    const impacts: any[] = []
    const disciplineMap: Record<string, string[]> = {
      'A_ARCHITECTURAL': ['S_STRUCTURAL', 'M_MECHANICAL', 'E_ELECTRICAL', 'P_PLUMBING'],
      'S_STRUCTURAL': ['A_ARCHITECTURAL', 'M_MECHANICAL', 'E_ELECTRICAL'],
      'M_MECHANICAL': ['A_ARCHITECTURAL', 'S_STRUCTURAL', 'E_ELECTRICAL', 'P_PLUMBING'],
      'E_ELECTRICAL': ['A_ARCHITECTURAL', 'S_STRUCTURAL', 'M_MECHANICAL'],
      'P_PLUMBING': ['A_ARCHITECTURAL', 'M_MECHANICAL'],
    }

    affectedDisciplines.forEach((discipline) => {
      const relatedDisciplines = disciplineMap[discipline] || []
      
      relatedDisciplines.forEach((relatedDisc) => {
        // Check if there are sheets in related discipline that might be affected
        // This is a simplified check - would need more sophisticated analysis
        impacts.push({
          affectedDiscipline: relatedDisc,
          impactLevel: 'MEDIUM', // Would be calculated based on actual changes
          requiresCoordination: true,
        })
      })
    })

    // Create or update impact records
    for (const impact of impacts) {
      await prisma.revisionImpact.upsert({
        where: {
          revisionId_affectedDiscipline: {
            revisionId,
            affectedDiscipline: impact.affectedDiscipline,
          },
        },
        update: {
          impactLevel: impact.impactLevel as any,
          requiresCoordination: impact.requiresCoordination,
        },
        create: {
          revisionId,
          designProjectId: revision.designProjectId,
          affectedDiscipline: impact.affectedDiscipline,
          impactLevel: impact.impactLevel as any,
          requiresCoordination: impact.requiresCoordination,
          affectedSheetIds: [],
        },
      })
    }

    // Update revision with impact analysis
    const impactAnalysis = {
      affectedDisciplines: Array.from(affectedDisciplines),
      crossDisciplineImpacts: impacts.length,
      requiresCoordination: impacts.some((i) => i.requiresCoordination),
    }

    await prisma.revision.update({
      where: { id: revisionId },
      data: {
        affectedDisciplines: Array.from(affectedDisciplines),
        impactAnalysis: impactAnalysis as any,
        requiresCoordination: impacts.some((i) => i.requiresCoordination),
      },
    })

    return {
      revision,
      impacts,
      impactAnalysis,
    }
  },

  /**
   * Mark impact as coordinated
   */
  async markImpactCoordinated(impactId: string, data: {
    coordinationNotes?: string
    userId: string
  }) {
    const impact = await prisma.revisionImpact.findUnique({
      where: { id: impactId },
    })

    if (!impact) {
      throw new NotFoundError('RevisionImpact', impactId)
    }

    const updated = await prisma.revisionImpact.update({
      where: { id: impactId },
      data: {
        requiresCoordination: false,
        coordinationNotes: data.coordinationNotes,
        coordinatedAt: new Date(),
        coordinatedById: data.userId,
      },
    })

    return updated
  },

  /**
   * Archive revision
   */
  async archiveRevision(revisionId: string, data: {
    archiveReason?: string
    searchKeywords?: string[]
    tags?: string[]
    relatedDocuments?: string[]
    userId: string
  }) {
    const revision = await prisma.revision.findUnique({
      where: { id: revisionId },
      include: {
        sheetRevisions: true,
        impacts: true,
      },
    })

    if (!revision) {
      throw new NotFoundError('Revision', revisionId)
    }

    // Create archive record
    const archive = await prisma.revisionArchive.create({
      data: {
        designProjectId: revision.designProjectId,
        revisionId,
        archiveReason: data.archiveReason,
        searchKeywords: data.searchKeywords || [],
        tags: data.tags || [],
        archiveData: {
          revision: {
            id: revision.id,
            revisionLetter: revision.revisionLetter,
            revisionNumber: revision.revisionNumber,
            revisionDate: revision.revisionDate,
            description: revision.description,
            status: revision.status,
          },
          sheetRevisions: revision.sheetRevisions,
          impacts: revision.impacts,
        } as any,
        relatedDocuments: data.relatedDocuments || [],
        archivedById: data.userId,
      },
    })

    // Mark revision as superseded
    await prisma.revision.update({
      where: { id: revisionId },
      data: {
        status: 'SUPERSEDED',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVISION_ARCHIVED',
      entityType: 'RevisionArchive',
      entityId: archive.id,
      userId: data.userId,
      reason: data.archiveReason || 'Revision archived',
      after: {
        revisionId,
        archivedAt: archive.archivedAt,
      },
    })

    return archive
  },

  /**
   * Search revision archive
   */
  async searchRevisionArchive(designProjectId: string, filters?: {
    keywords?: string[]
    tags?: string[]
    fromDate?: Date
    toDate?: Date
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.keywords && filters.keywords.length > 0) {
      where.searchKeywords = {
        hasSome: filters.keywords,
      }
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      }
    }

    if (filters?.fromDate || filters?.toDate) {
      where.archivedAt = {}
      if (filters.fromDate) {
        where.archivedAt.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.archivedAt.lte = filters.toDate
      }
    }

    const archives = await prisma.revisionArchive.findMany({
      where,
      include: {
        revision: {
          select: {
            id: true,
            revisionLetter: true,
            revisionNumber: true,
            description: true,
          },
        },
        archivedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        archivedAt: 'desc',
      },
    })

    return archives
  },
}
