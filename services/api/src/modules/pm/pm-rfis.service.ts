import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

interface RFIListFilters {
  projectId: string
  status?: string
  priority?: string
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}

class RFIService {
  async list(filters: RFIListFilters) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 25
    const skip = (page - 1) * limit

    const where: any = {
      projectId: filters.projectId,
      status: { not: 'VOID' },
    }

    if (filters.status) {
      where.status = filters.status
    }
    if (filters.priority) {
      where.priority = filters.priority
    }
    if (filters.assignedTo) {
      where.assignedToId = filters.assignedTo
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { question: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prismaAny.rFI.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { responses: true } },
        },
      }),
      prismaAny.rFI.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getById(id: string) {
    const rfi = await prismaAny.rFI.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        closedBy: { select: { id: true, name: true, email: true } },
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            responder: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!rfi) {
      throw new NotFoundError('RFI', id)
    }

    return rfi
  }

  async create(data: {
    projectId: string
    subject: string
    question: string
    priority?: string
    assignedToId?: string
    dueDate?: string
    costImpact?: boolean
    scheduleImpact?: boolean
    drawingRef?: string
    specSection?: string
    distributionList?: string[]
    createdById: string
  }) {
    const count = await prismaAny.rFI.count({
      where: { projectId: data.projectId },
    })

    return prismaAny.rFI.create({
      data: {
        projectId: data.projectId,
        rfiNumber: count + 1,
        subject: data.subject,
        question: data.question,
        status: 'DRAFT',
        priority: data.priority ?? 'MEDIUM',
        createdById: data.createdById,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        costImpact: data.costImpact ?? false,
        scheduleImpact: data.scheduleImpact ?? false,
        drawingRef: data.drawingRef,
        specSection: data.specSection,
        distributionList: data.distributionList ?? [],
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async update(id: string, data: {
    subject?: string
    question?: string
    priority?: string
    status?: string
    assignedToId?: string
    dueDate?: string
    costImpact?: boolean
    scheduleImpact?: boolean
    drawingRef?: string
    specSection?: string
    distributionList?: string[]
  }) {
    const existing = await prismaAny.rFI.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('RFI', id)

    const updateData: any = { ...data }
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)

    return prismaAny.rFI.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async softDelete(id: string) {
    const existing = await prismaAny.rFI.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('RFI', id)

    return prismaAny.rFI.update({
      where: { id },
      data: { status: 'VOID' },
    })
  }

  async addResponse(data: {
    rfiId: string
    responderId: string
    response: string
    isOfficial?: boolean
    attachmentIds?: string[]
  }) {
    const rfi = await prismaAny.rFI.findUnique({ where: { id: data.rfiId } })
    if (!rfi) throw new NotFoundError('RFI', data.rfiId)

    const responseRecord = await prismaAny.rFIResponse.create({
      data: {
        rfiId: data.rfiId,
        responderId: data.responderId,
        response: data.response,
        isOfficial: data.isOfficial ?? false,
        attachmentIds: data.attachmentIds ?? [],
      },
      include: {
        responder: { select: { id: true, name: true, email: true } },
      },
    })

    if (rfi.status === 'OPEN') {
      await prismaAny.rFI.update({
        where: { id: data.rfiId },
        data: { status: 'ANSWERED' },
      })
    }

    return responseRecord
  }

  async editResponse(responseId: string, data: { response?: string; isOfficial?: boolean }) {
    const existing = await prismaAny.rFIResponse.findUnique({ where: { id: responseId } })
    if (!existing) throw new NotFoundError('RFIResponse', responseId)

    return prismaAny.rFIResponse.update({
      where: { id: responseId },
      data,
      include: {
        responder: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async close(id: string, closedById: string) {
    const existing = await prismaAny.rFI.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('RFI', id)

    return prismaAny.rFI.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedById },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        closedBy: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async reopen(id: string) {
    const existing = await prismaAny.rFI.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('RFI', id)

    return prismaAny.rFI.update({
      where: { id },
      data: { status: 'OPEN', closedAt: null, closedById: null },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async getStats(projectId: string) {
    const now = new Date()

    const [total, open, closed, overdue] = await Promise.all([
      prismaAny.rFI.count({ where: { projectId, status: { not: 'VOID' } } }),
      prismaAny.rFI.count({ where: { projectId, status: 'OPEN' } }),
      prismaAny.rFI.count({ where: { projectId, status: 'CLOSED' } }),
      prismaAny.rFI.count({
        where: { projectId, status: { in: ['OPEN', 'DRAFT'] }, dueDate: { lt: now } },
      }),
    ])

    return { total, open, closed, overdue }
  }
}

export const rfiService = new RFIService()
