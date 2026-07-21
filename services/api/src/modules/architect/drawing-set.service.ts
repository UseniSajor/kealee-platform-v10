import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

// Discipline prefix mapping
const DISCIPLINE_PREFIX: Record<string, string> = {
  A_ARCHITECTURAL: 'A',
  S_STRUCTURAL: 'S',
  M_MECHANICAL: 'M',
  E_ELECTRICAL: 'E',
  P_PLUMBING: 'P',
  C_CIVIL: 'C',
  L_LANDSCAPE: 'L',
  I_INTERIORS: 'I',
  FP_FIRE_PROTECTION: 'FP',
  T_TELECOMMUNICATIONS: 'T',
  OTHER: 'X',
}

export const drawingSetService = {
  /**
   * Generate next sheet number for a discipline
   */
  async getNextSheetNumber(designProjectId: string, discipline: string): Promise<{
    sequenceNumber: number
    fullSheetNumber: string
  }> {
    const prefix = DISCIPLINE_PREFIX[discipline] || 'X'

    // Get the highest sequence number for this discipline
    const lastSheet = await prismaAny.drawingSheet.findFirst({
      where: {
        designProjectId,
        discipline: discipline as any,
      },
      orderBy: {
        sequenceNumber: 'desc',
      },
    })

    const nextSequence = lastSheet ? lastSheet.sequenceNumber + 1 : 1
    const fullSheetNumber = `${prefix}-${String(nextSequence).padStart(3, '0')}`

    return {
      sequenceNumber: nextSequence,
      fullSheetNumber,
    }
  },

  /**
   * Create a new drawing sheet
   */
  async createSheet(data: {
    designProjectId: string
    deliverableId?: string
    sheetTitle: string
    discipline: string
    sequenceNumber?: number
    drawingFileId?: string
    createdById: string
  }) {
    // Get or generate sheet number
    let sequenceNumber: number
    let fullSheetNumber: string

    if (data.sequenceNumber) {
      sequenceNumber = data.sequenceNumber
      const prefix = DISCIPLINE_PREFIX[data.discipline] || 'X'
      fullSheetNumber = `${prefix}-${String(sequenceNumber).padStart(3, '0')}`

      // Check if this number already exists
      const existing = await prismaAny.drawingSheet.findUnique({
        where: {
          designProjectId_fullSheetNumber: {
            designProjectId: data.designProjectId,
            fullSheetNumber,
          },
        },
      })

      if (existing) {
        throw new ValidationError(`Sheet number ${fullSheetNumber} already exists`)
      }
    } else {
      const next = await this.getNextSheetNumber(data.designProjectId, data.discipline)
      sequenceNumber = next.sequenceNumber
      fullSheetNumber = next.fullSheetNumber
    }

    // Auto-populate title block data
    const project = await prismaAny.designProject.findUnique({
      where: { id: data.designProjectId },
      include: {
        project: {
          select: {
            name: true,
            projectNumber: true,
          },
        },
      },
    })

    if (!project) {
      throw new NotFoundError('DesignProject', data.designProjectId)
    }

    const titleBlockData = {
      projectName: project.name,
      projectNumber: project.project?.projectNumber || '',
      sheetTitle: data.sheetTitle,
      sheetNumber: fullSheetNumber,
      discipline: data.discipline,
      date: new Date().toISOString().split('T')[0],
      drawnBy: null,
      checkedBy: null,
      approvedBy: null,
    }

    const sheet = await prismaAny.drawingSheet.create({
      data: {
        designProjectId: data.designProjectId,
        deliverableId: data.deliverableId,
        sheetNumber: fullSheetNumber,
        sheetTitle: data.sheetTitle,
        discipline: data.discipline as any,
        sequenceNumber,
        fullSheetNumber,
        titleBlockData: titleBlockData as any,
        drawingFileId: data.drawingFileId,
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
      action: 'DRAWING_SHEET_CREATED',
      entityType: 'DrawingSheet',
      entityId: sheet.id,
      userId: data.createdById,
      reason: `Sheet created: ${fullSheetNumber} - ${data.sheetTitle}`,
      after: {
        sheetNumber: fullSheetNumber,
        sheetTitle: data.sheetTitle,
        discipline: data.discipline,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DRAWING_SHEET_CREATED',
      entityType: 'DrawingSheet',
      entityId: sheet.id,
      userId: data.createdById,
      payload: {
        sheetNumber: fullSheetNumber,
        sheetTitle: data.sheetTitle,
        designProjectId: data.designProjectId,
      },
    })

    return sheet
  },

  /**
   * Get a sheet with all related data
   */
  async getSheet(sheetId: string) {
    const sheet = await prismaAny.drawingSheet.findUnique({
      where: { id: sheetId },
      include: {
        drawnBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        checkedBy: {
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
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        designProject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!sheet) {
      throw new NotFoundError('DrawingSheet', sheetId)
    }

    return sheet
  },

  /**
   * List sheets for a project
   */
  async listSheets(designProjectId: string, filters?: {
    discipline?: string
    status?: string
    deliverableId?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.discipline) {
      where.discipline = filters.discipline
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.deliverableId) {
      where.deliverableId = filters.deliverableId
    }

    const sheets = await prismaAny.drawingSheet.findMany({
      where,
      include: {
        drawnBy: {
          select: {
            id: true,
            name: true,
          },
        },
        checkedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { discipline: 'asc' },
        { sequenceNumber: 'asc' },
      ],
    })

    return sheets
  },

  /**
   * Update sheet
   */
  async updateSheet(sheetId: string, data: {
    sheetTitle?: string
    status?: string
    drawingFileId?: string
    pdfFileId?: string
    userId: string
  }) {
    const sheet = await prismaAny.drawingSheet.findUnique({
      where: { id: sheetId },
    })

    if (!sheet) {
      throw new NotFoundError('DrawingSheet', sheetId)
    }

    const updateData: any = {}
    if (data.sheetTitle !== undefined) {
      updateData.sheetTitle = data.sheetTitle
      // Update title block data
      if (sheet.titleBlockData) {
        const titleBlock = sheet.titleBlockData as any
        titleBlock.sheetTitle = data.sheetTitle
        updateData.titleBlockData = titleBlock
      }
    }
    if (data.status !== undefined) {
      updateData.status = data.status

      // Update status timestamps
      if (data.status === 'STARTED' && !sheet.startedAt) {
        updateData.startedAt = new Date()
      }
      if (data.status === 'CHECKED' && !sheet.checkedAt) {
        updateData.checkedAt = new Date()
      }
      if (data.status === 'APPROVED' && !sheet.approvedAt) {
        updateData.approvedAt = new Date()
      }
      if (data.status === 'ISSUED' && !sheet.issuedAt) {
        updateData.issuedAt = new Date()
      }
    }
    if (data.drawingFileId !== undefined) updateData.drawingFileId = data.drawingFileId
    if (data.pdfFileId !== undefined) updateData.pdfFileId = data.pdfFileId

    const updated = await prismaAny.drawingSheet.update({
      where: { id: sheetId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DRAWING_SHEET_UPDATED',
      entityType: 'DrawingSheet',
      entityId: sheetId,
      userId: data.userId,
      reason: 'Sheet updated',
      before: sheet,
      after: updated,
    })

    return updated
  },

  /**
   * Add revision to sheet
   */
  async addRevision(sheetId: string, data: {
    revision: string
    description: string
    type: string
    cloudAreas?: any[]
    userId: string
  }) {
    const sheet = await prismaAny.drawingSheet.findUnique({
      where: { id: sheetId },
    })

    if (!sheet) {
      throw new NotFoundError('DrawingSheet', sheetId)
    }

    const revisionHistory = (sheet.revisionHistory as any[]) || []
    const newRevision = {
      revision: data.revision,
      date: new Date().toISOString().split('T')[0],
      description: data.description,
      type: data.type,
      cloudAreas: data.cloudAreas || [],
      addedBy: data.userId,
    }

    revisionHistory.push(newRevision)

    const updated = await prismaAny.drawingSheet.update({
      where: { id: sheetId },
      data: {
        currentRevision: data.revision,
        revisionHistory: revisionHistory as any,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DRAWING_SHEET_REVISION_ADDED',
      entityType: 'DrawingSheet',
      entityId: sheetId,
      userId: data.userId,
      reason: `Revision ${data.revision} added: ${data.description}`,
      after: {
        currentRevision: data.revision,
        revisionCount: revisionHistory.length,
      },
    })

    return updated
  },

  /**
   * Update title block data
   */
  async updateTitleBlock(sheetId: string, data: {
    drawnById?: string
    checkedById?: string
    approvedById?: string
    customFields?: Record<string, any>
    userId: string
  }) {
    const sheet = await prismaAny.drawingSheet.findUnique({
      where: { id: sheetId },
    })

    if (!sheet) {
      throw new NotFoundError('DrawingSheet', sheetId)
    }

    const titleBlock = (sheet.titleBlockData as any) || {}
    
    if (data.drawnById) {
      const user = await prismaAny.user.findUnique({
        where: { id: data.drawnById },
        select: { name: true },
      })
      titleBlock.drawnBy = user?.name || null
    }

    if (data.checkedById) {
      const user = await prismaAny.user.findUnique({
        where: { id: data.checkedById },
        select: { name: true },
      })
      titleBlock.checkedBy = user?.name || null
    }

    if (data.approvedById) {
      const user = await prismaAny.user.findUnique({
        where: { id: data.approvedById },
        select: { name: true },
      })
      titleBlock.approvedBy = user?.name || null
    }

    if (data.customFields) {
      Object.assign(titleBlock, data.customFields)
    }

    const updateData: any = {
      titleBlockData: titleBlock,
    }

    if (data.drawnById) updateData.drawnById = data.drawnById
    if (data.checkedById) updateData.checkedById = data.checkedById
    if (data.approvedById) updateData.approvedById = data.approvedById

    const updated = await prismaAny.drawingSheet.update({
      where: { id: sheetId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DRAWING_SHEET_TITLE_BLOCK_UPDATED',
      entityType: 'DrawingSheet',
      entityId: sheetId,
      userId: data.userId,
      reason: 'Title block updated',
      after: {
        titleBlockData: titleBlock,
      },
    })

    return updated
  },

  /**
   * Create drawing set
   */
  async createSet(data: {
    designProjectId: string
    deliverableId?: string
    name: string
    description?: string
    setType?: string
    sheetIds: string[]
    createdById: string
  }) {
    // Validate all sheets belong to the project
    if (data.sheetIds.length > 0) {
      const sheets = await prismaAny.drawingSheet.findMany({
        where: {
          id: { in: data.sheetIds },
        },
      })

      if (sheets.length !== data.sheetIds.length) {
        throw new ValidationError('One or more sheets not found')
      }

      const invalidSheets = sheets.filter(
        (s: any) => s.designProjectId !== data.designProjectId
      )
      if (invalidSheets.length > 0) {
        throw new ValidationError('All sheets must belong to the same project')
      }
    }

    const set = await prismaAny.drawingSet.create({
      data: {
        designProjectId: data.designProjectId,
        deliverableId: data.deliverableId,
        name: data.name,
        description: data.description,
        setType: data.setType,
        sheetIds: data.sheetIds,
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
      action: 'DRAWING_SET_CREATED',
      entityType: 'DrawingSet',
      entityId: set.id,
      userId: data.createdById,
      reason: `Drawing set created: ${data.name}`,
      after: {
        name: data.name,
        sheetCount: data.sheetIds.length,
      },
    })

    return set
  },

  /**
   * Get drawing set with sheets
   */
  async getSet(setId: string) {
    const set = await prismaAny.drawingSet.findUnique({
      where: { id: setId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        designProject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!set) {
      throw new NotFoundError('DrawingSet', setId)
    }

    // Fetch all sheets in the set
    const sheets = await prismaAny.drawingSheet.findMany({
      where: {
        id: { in: set.sheetIds },
      },
      include: {
        drawnBy: {
          select: {
            id: true,
            name: true,
          },
        },
        checkedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { discipline: 'asc' },
        { sequenceNumber: 'asc' },
      ],
    })

    return {
      ...set,
      sheets,
    }
  },

  /**
   * List drawing sets for a project
   */
  async listSets(designProjectId: string) {
    const sets = await prismaAny.drawingSet.findMany({
      where: { designProjectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return sets
  },

  /**
   * Generate PDF for drawing set (placeholder - would integrate with PDF generation service)
   */
  async generateSetPdf(setId: string, userId: string) {
    const set = await prismaAny.drawingSet.findUnique({
      where: { id: setId },
    })

    if (!set) {
      throw new NotFoundError('DrawingSet', setId)
    }

    // Create a PDF metadata record (actual PDF generation deferred to a dedicated service)
    const sheets = await prismaAny.drawingSheet.findMany({
      where: { id: { in: set.sheetIds || [] } },
      orderBy: [{ discipline: 'asc' }, { sequenceNumber: 'asc' }],
      select: {
        id: true,
        sheetNumber: true,
        sheetTitle: true,
        discipline: true,
        pdfFileId: true,
      },
    })

    const pdfMetadata = {
      generatedAt: new Date().toISOString(),
      setId,
      setName: set.name,
      sheetCount: sheets.length,
      sheets: sheets.map((s: any) => ({
        sheetId: s.id,
        sheetNumber: s.sheetNumber,
        sheetTitle: s.sheetTitle,
        discipline: s.discipline,
        sourcePdfFileId: s.pdfFileId,
      })),
      format: 'PDF',
      status: 'PENDING_GENERATION',
    }

    // Store the metadata record as a design file entry
    const pdfRecord = await prismaAny.designFile.create({
      data: {
        designProjectId: set.designProjectId,
        fileName: `${set.name || 'drawing-set'}.pdf`,
        fileType: 'PDF',
        category: 'DRAWING_SET_PDF',
        status: 'PENDING',
        metadata: pdfMetadata as any,
        uploadedById: userId,
      },
    })

    const pdfFileId = pdfRecord.id

    const updated = await prismaAny.drawingSet.update({
      where: { id: setId },
      data: {
        combinedPdfFileId: pdfFileId,
        pdfGeneratedAt: new Date(),
        pdfGeneratedById: userId,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DRAWING_SET_PDF_GENERATED',
      entityType: 'DrawingSet',
      entityId: setId,
      userId,
      reason: 'PDF generated for drawing set',
      after: {
        pdfGeneratedAt: updated.pdfGeneratedAt,
      },
    })

    return updated
  },
}
