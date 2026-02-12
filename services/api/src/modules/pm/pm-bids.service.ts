/**
 * PM Bids Service
 * Handles bid requests, submissions, comparison, and awarding
 */
import { prismaAny } from '../../utils/prisma-helper'

class BidService {
  async list(filters: {
    projectId?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 25
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.projectId) where.projectId = filters.projectId
    if (filters.status) where.status = filters.status
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prismaAny.bidRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          _count: { select: { bidSubmissions: true } },
        },
      }),
      prismaAny.bidRequest.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getById(id: string) {
    const bid = await prismaAny.bidRequest.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        bidSubmissions: {
          orderBy: { createdAt: 'desc' },
        },
        invitations: true,
      },
    })

    if (!bid) throw new Error('Bid request not found')
    return bid
  }

  async create(data: {
    projectId: string
    title: string
    description?: string
    dueDate?: string
    scopeOfWork?: string
    tradeCategory?: string
    createdById: string
  }) {
    return prismaAny.bidRequest.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        scopeOfWork: data.scopeOfWork,
        tradeCategory: data.tradeCategory,
        status: 'OPEN',
        createdById: data.createdById,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    })
  }

  async update(id: string, data: {
    title?: string
    description?: string
    dueDate?: string
    scopeOfWork?: string
    tradeCategory?: string
    status?: string
  }) {
    const existing = await prismaAny.bidRequest.findUnique({ where: { id } })
    if (!existing) throw new Error('Bid request not found')

    const updateData: any = { ...data }
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)

    return prismaAny.bidRequest.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { bidSubmissions: true } },
      },
    })
  }

  async close(id: string) {
    const existing = await prismaAny.bidRequest.findUnique({ where: { id } })
    if (!existing) throw new Error('Bid request not found')

    return prismaAny.bidRequest.update({
      where: { id },
      data: { status: 'CLOSED' },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { bidSubmissions: true } },
      },
    })
  }

  async getComparison(id: string) {
    const bid = await prismaAny.bidRequest.findUnique({
      where: { id },
      include: {
        bidSubmissions: {
          orderBy: { totalAmount: 'asc' },
        },
      },
    })

    if (!bid) throw new Error('Bid request not found')

    return {
      bidRequest: { id: bid.id, title: bid.title },
      submissions: bid.bidSubmissions,
      submissionCount: bid.bidSubmissions.length,
    }
  }

  async award(id: string, data: { submissionId: string }) {
    const existing = await prismaAny.bidRequest.findUnique({ where: { id } })
    if (!existing) throw new Error('Bid request not found')

    return prismaAny.bidRequest.update({
      where: { id },
      data: {
        status: 'AWARDED',
        winnerId: data.submissionId,
        awardedAt: new Date(),
      },
      include: {
        project: { select: { id: true, name: true } },
        bidSubmissions: true,
      },
    })
  }
}

export const bidService = new BidService()
