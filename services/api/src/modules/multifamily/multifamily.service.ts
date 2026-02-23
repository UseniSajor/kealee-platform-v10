import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'

export interface CreateUnitInput {
  projectId: string
  unitNumber: string
  building?: string
  floor?: number
  unitType?: string
  sqft?: number
  phaseId?: string
  notes?: string
  turnoverDate?: string
}

export interface BulkCreateUnitsInput {
  projectId: string
  units: Omit<CreateUnitInput, 'projectId'>[]
}

export interface CreateDrawRequestInput {
  projectId: string
  drawNumber: number
  periodEnd: string
  description?: string
  scheduledAmount?: number
  previouslyBilled?: number
  currentBilling?: number
  retainage?: number
  aiaDocumentUrl?: string
  lineItems?: any
  createdBy?: string
}

export interface CreateAreaPhaseInput {
  projectId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  unitCount?: number
  areas?: any
}

class MultifamilyService {
  // ── Units ──

  async createUnit(input: CreateUnitInput) {
    const project = await prismaAny.project.findUnique({ where: { id: input.projectId } })
    if (!project) throw new NotFoundError('Project', input.projectId)

    return prismaAny.multifamilyUnit.create({
      data: {
        projectId: input.projectId,
        unitNumber: input.unitNumber,
        building: input.building ?? null,
        floor: input.floor ?? null,
        unitType: input.unitType ?? null,
        sqft: input.sqft ?? null,
        phaseId: input.phaseId ?? null,
        notes: input.notes ?? null,
        turnoverDate: input.turnoverDate ? new Date(input.turnoverDate) : null,
        status: 'PLANNED',
      },
    })
  }

  async bulkCreateUnits(input: BulkCreateUnitsInput) {
    const project = await prismaAny.project.findUnique({ where: { id: input.projectId } })
    if (!project) throw new NotFoundError('Project', input.projectId)

    if (!input.units.length) throw new ValidationError('At least one unit is required')

    // Check for duplicate unit numbers within the batch
    const numbers = input.units.map((u) => u.unitNumber)
    const dupes = numbers.filter((n, i) => numbers.indexOf(n) !== i)
    if (dupes.length) throw new ValidationError(`Duplicate unit numbers in batch: ${[...new Set(dupes)].join(', ')}`)

    // Check for existing unit numbers in the project
    const existing = await prismaAny.multifamilyUnit.findMany({
      where: { projectId: input.projectId, unitNumber: { in: numbers } },
      select: { unitNumber: true },
    })
    if (existing.length) {
      throw new ValidationError(
        `Unit numbers already exist: ${existing.map((e: any) => e.unitNumber).join(', ')}`
      )
    }

    const created = await prismaAny.$transaction(
      input.units.map((u) =>
        prismaAny.multifamilyUnit.create({
          data: {
            projectId: input.projectId,
            unitNumber: u.unitNumber,
            building: u.building ?? null,
            floor: u.floor ?? null,
            unitType: u.unitType ?? null,
            sqft: u.sqft ?? null,
            phaseId: u.phaseId ?? null,
            notes: u.notes ?? null,
            turnoverDate: u.turnoverDate ? new Date(u.turnoverDate) : null,
            status: 'PLANNED',
          },
        })
      )
    )

    return { created: created.length, units: created }
  }

  async listUnits(projectId: string, filters?: { status?: string; building?: string; floor?: number; phaseId?: string }) {
    const where: any = { projectId }
    if (filters?.status) where.status = filters.status
    if (filters?.building) where.building = filters.building
    if (filters?.floor !== undefined) where.floor = filters.floor
    if (filters?.phaseId) where.phaseId = filters.phaseId

    return prismaAny.multifamilyUnit.findMany({
      where,
      include: { phase: true },
      orderBy: [{ building: 'asc' }, { floor: 'asc' }, { unitNumber: 'asc' }],
    })
  }

  async getUnit(unitId: string) {
    const unit = await prismaAny.multifamilyUnit.findUnique({
      where: { id: unitId },
      include: { phase: true },
    })
    if (!unit) throw new NotFoundError('MultifamilyUnit', unitId)
    return unit
  }

  async updateUnit(unitId: string, data: {
    status?: string
    unitType?: string
    sqft?: number
    building?: string
    floor?: number
    phaseId?: string | null
    notes?: string | null
    turnoverDate?: string | null
    punchItems?: any
  }) {
    const unit = await prismaAny.multifamilyUnit.findUnique({ where: { id: unitId } })
    if (!unit) throw new NotFoundError('MultifamilyUnit', unitId)

    const updateData: any = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.unitType !== undefined) updateData.unitType = data.unitType
    if (data.sqft !== undefined) updateData.sqft = data.sqft
    if (data.building !== undefined) updateData.building = data.building
    if (data.floor !== undefined) updateData.floor = data.floor
    if (data.phaseId !== undefined) updateData.phaseId = data.phaseId
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.turnoverDate !== undefined) updateData.turnoverDate = data.turnoverDate ? new Date(data.turnoverDate) : null
    if (data.punchItems !== undefined) updateData.punchItems = data.punchItems
    if (data.status === 'COMPLETE') updateData.completedAt = new Date()

    return prismaAny.multifamilyUnit.update({ where: { id: unitId }, data: updateData })
  }

  async deleteUnit(unitId: string) {
    const unit = await prismaAny.multifamilyUnit.findUnique({ where: { id: unitId } })
    if (!unit) throw new NotFoundError('MultifamilyUnit', unitId)
    return prismaAny.multifamilyUnit.delete({ where: { id: unitId } })
  }

  async getUnitSummary(projectId: string) {
    const units = await prismaAny.multifamilyUnit.findMany({ where: { projectId } })
    const total = units.length
    const byStatus: Record<string, number> = {}
    const byBuilding: Record<string, number> = {}
    const byType: Record<string, number> = {}

    for (const u of units) {
      byStatus[u.status] = (byStatus[u.status] || 0) + 1
      if (u.building) byBuilding[u.building] = (byBuilding[u.building] || 0) + 1
      if (u.unitType) byType[u.unitType] = (byType[u.unitType] || 0) + 1
    }

    return { total, byStatus, byBuilding, byType }
  }

  // ── Draw Requests ──

  async createDrawRequest(input: CreateDrawRequestInput) {
    const project = await prismaAny.project.findUnique({ where: { id: input.projectId } })
    if (!project) throw new NotFoundError('Project', input.projectId)

    // Check for duplicate draw number
    const existing = await prismaAny.drawRequest.findFirst({
      where: { projectId: input.projectId, drawNumber: input.drawNumber },
    })
    if (existing) throw new ValidationError(`Draw #${input.drawNumber} already exists for this project`)

    return prismaAny.drawRequest.create({
      data: {
        projectId: input.projectId,
        drawNumber: input.drawNumber,
        periodEnd: new Date(input.periodEnd),
        description: input.description ?? null,
        scheduledAmount: input.scheduledAmount ?? null,
        previouslyBilled: input.previouslyBilled ?? null,
        currentBilling: input.currentBilling ?? null,
        retainage: input.retainage ?? null,
        aiaDocumentUrl: input.aiaDocumentUrl ?? null,
        lineItems: input.lineItems ?? null,
        createdBy: input.createdBy ?? null,
        status: 'DRAFT',
      },
    })
  }

  async listDrawRequests(projectId: string) {
    return prismaAny.drawRequest.findMany({
      where: { projectId },
      orderBy: { drawNumber: 'asc' },
    })
  }

  async getDrawRequest(drawId: string) {
    const draw = await prismaAny.drawRequest.findUnique({ where: { id: drawId } })
    if (!draw) throw new NotFoundError('DrawRequest', drawId)
    return draw
  }

  async submitDrawRequest(drawId: string) {
    const draw = await prismaAny.drawRequest.findUnique({ where: { id: drawId } })
    if (!draw) throw new NotFoundError('DrawRequest', drawId)
    if (draw.status !== 'DRAFT') throw new ValidationError(`Draw must be in DRAFT to submit (current: ${draw.status})`)

    return prismaAny.drawRequest.update({
      where: { id: drawId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    })
  }

  async approveDrawRequest(drawId: string, approvedBy: string) {
    const draw = await prismaAny.drawRequest.findUnique({ where: { id: drawId } })
    if (!draw) throw new NotFoundError('DrawRequest', drawId)
    if (draw.status !== 'SUBMITTED' && draw.status !== 'UNDER_REVIEW') {
      throw new ValidationError(`Draw must be SUBMITTED or UNDER_REVIEW to approve (current: ${draw.status})`)
    }

    return prismaAny.drawRequest.update({
      where: { id: drawId },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedBy },
    })
  }

  async fundDrawRequest(drawId: string) {
    const draw = await prismaAny.drawRequest.findUnique({ where: { id: drawId } })
    if (!draw) throw new NotFoundError('DrawRequest', drawId)
    if (draw.status !== 'APPROVED') throw new ValidationError(`Draw must be APPROVED to fund (current: ${draw.status})`)

    return prismaAny.drawRequest.update({
      where: { id: drawId },
      data: { status: 'FUNDED', fundedAt: new Date() },
    })
  }

  async rejectDrawRequest(drawId: string, reason: string) {
    const draw = await prismaAny.drawRequest.findUnique({ where: { id: drawId } })
    if (!draw) throw new NotFoundError('DrawRequest', drawId)

    return prismaAny.drawRequest.update({
      where: { id: drawId },
      data: { status: 'REJECTED', rejectedReason: reason },
    })
  }

  // ── Area Phases ──

  async createAreaPhase(input: CreateAreaPhaseInput) {
    const project = await prismaAny.project.findUnique({ where: { id: input.projectId } })
    if (!project) throw new NotFoundError('Project', input.projectId)

    return prismaAny.multifamilyAreaPhase.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description ?? null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        unitCount: input.unitCount ?? 0,
        areas: input.areas ?? null,
        status: 'NOT_STARTED',
      },
    })
  }

  async listAreaPhases(projectId: string) {
    return prismaAny.multifamilyAreaPhase.findMany({
      where: { projectId },
      include: { units: { select: { id: true, unitNumber: true, status: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async getAreaPhase(phaseId: string) {
    const phase = await prismaAny.multifamilyAreaPhase.findUnique({
      where: { id: phaseId },
      include: { units: true },
    })
    if (!phase) throw new NotFoundError('MultifamilyAreaPhase', phaseId)
    return phase
  }

  async updateAreaPhase(phaseId: string, data: {
    name?: string
    description?: string | null
    status?: string
    startDate?: string | null
    endDate?: string | null
    unitCount?: number
    completedUnits?: number
    areas?: any
  }) {
    const phase = await prismaAny.multifamilyAreaPhase.findUnique({ where: { id: phaseId } })
    if (!phase) throw new NotFoundError('MultifamilyAreaPhase', phaseId)

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.unitCount !== undefined) updateData.unitCount = data.unitCount
    if (data.completedUnits !== undefined) updateData.completedUnits = data.completedUnits
    if (data.areas !== undefined) updateData.areas = data.areas

    return prismaAny.multifamilyAreaPhase.update({ where: { id: phaseId }, data: updateData })
  }

  async deleteAreaPhase(phaseId: string) {
    const phase = await prismaAny.multifamilyAreaPhase.findUnique({ where: { id: phaseId } })
    if (!phase) throw new NotFoundError('MultifamilyAreaPhase', phaseId)
    // Unlink units first
    await prismaAny.multifamilyUnit.updateMany({ where: { phaseId }, data: { phaseId: null } })
    return prismaAny.multifamilyAreaPhase.delete({ where: { id: phaseId } })
  }
}

export const multifamilyService = new MultifamilyService()
