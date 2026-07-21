import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

interface SubmittalListFilters {
  projectId: string
  status?: string
  type?: string
  assignedTo?: string
  specSection?: string
  search?: string
  page?: number
  limit?: number
}

class SubmittalService {
  async list(filters: SubmittalListFilters) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 25
    const skip = (page - 1) * limit

    const where: any = {
      projectId: filters.projectId,
    }

    if (filters.status) where.status = filters.status
    if (filters.type) where.type = filters.type
    if (filters.assignedTo) where.assignedToId = filters.assignedTo
    if (filters.specSection) where.specSection = filters.specSection
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prismaAny.submittal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prismaAny.submittal.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getById(id: string) {
    const submittal = await prismaAny.submittal.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!submittal) throw new NotFoundError('Submittal', id)
    return submittal
  }

  async create(data: {
    projectId: string
    title: string
    description?: string
    type?: string
    specSection?: string
    assignedToId?: string
    dueDate?: string
    contractorId?: string
    subcontractorName?: string
    copies?: number
    remarks?: string
    createdById: string
  }) {
    const count = await prismaAny.submittal.count({
      where: { projectId: data.projectId },
    })

    return prismaAny.submittal.create({
      data: {
        projectId: data.projectId,
        submittalNumber: count + 1,
        title: data.title,
        description: data.description,
        type: data.type ?? 'PRODUCT_DATA',
        status: 'DRAFT',
        specSection: data.specSection,
        createdById: data.createdById,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        contractorId: data.contractorId,
        subcontractorName: data.subcontractorName,
        copies: data.copies ?? 1,
        remarks: data.remarks,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async update(id: string, data: {
    title?: string
    description?: string
    type?: string
    specSection?: string
    assignedToId?: string
    dueDate?: string
    contractorId?: string
    subcontractorName?: string
    copies?: number
    remarks?: string
  }) {
    const existing = await prismaAny.submittal.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Submittal', id)

    const updateData: any = { ...data }
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)

    return prismaAny.submittal.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async softDelete(id: string) {
    const existing = await prismaAny.submittal.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Submittal', id)

    return prismaAny.submittal.update({
      where: { id },
      data: { status: 'DRAFT' },
    })
  }

  async submit(id: string) {
    const existing = await prismaAny.submittal.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Submittal', id)

    return prismaAny.submittal.update({
      where: { id },
      data: { status: 'SUBMITTED', receivedDate: new Date() },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async addReview(data: {
    submittalId: string
    reviewerId: string
    status: string
    comments?: string
    stampUrl?: string
  }) {
    const submittal = await prismaAny.submittal.findUnique({ where: { id: data.submittalId } })
    if (!submittal) throw new NotFoundError('Submittal', data.submittalId)

    const review = await prismaAny.submittalReview.create({
      data: {
        submittalId: data.submittalId,
        reviewerId: data.reviewerId,
        status: data.status,
        comments: data.comments,
        stampUrl: data.stampUrl,
        reviewedAt: new Date(),
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
      },
    })

    // Update submittal status based on review
    const newStatus = data.status
    const updateData: any = { status: newStatus }
    if (newStatus === 'APPROVED' || newStatus === 'APPROVED_AS_NOTED') {
      updateData.approvedDate = new Date()
    }

    await prismaAny.submittal.update({
      where: { id: data.submittalId },
      data: updateData,
    })

    return review
  }

  async resubmit(id: string) {
    const existing = await prismaAny.submittal.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Submittal', id)

    return prismaAny.submittal.update({
      where: { id },
      data: { status: 'SUBMITTED', receivedDate: new Date(), approvedDate: null },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async getStats(projectId: string) {
    const [total, draft, submitted, underReview, approved, rejected] = await Promise.all([
      prismaAny.submittal.count({ where: { projectId } }),
      prismaAny.submittal.count({ where: { projectId, status: 'DRAFT' } }),
      prismaAny.submittal.count({ where: { projectId, status: 'SUBMITTED' } }),
      prismaAny.submittal.count({ where: { projectId, status: 'UNDER_REVIEW' } }),
      prismaAny.submittal.count({ where: { projectId, status: { in: ['APPROVED', 'APPROVED_AS_NOTED'] } } }),
      prismaAny.submittal.count({ where: { projectId, status: { in: ['REJECTED', 'REVISE_RESUBMIT'] } } }),
    ])

    return { total, draft, submitted, underReview, approved, rejected }
  }

  async getLog(projectId: string) {
    return prismaAny.submittal.findMany({
      where: { projectId },
      orderBy: { submittalNumber: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { reviews: true } },
      },
    })
  }
}

export const submittalService = new SubmittalService()
