import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

class WarrantyService {
  async list(filters: {
    projectId: string
    status?: string
    type?: string
    page?: number
    limit?: number
  }) {
    const { projectId, status, type, page = 1, limit = 50 } = filters
    const skip = (page - 1) * limit
    const where: any = { projectId }
    if (status) where.status = status
    if (type) where.type = type

    const [data, total] = await Promise.all([
      prismaAny.warranty.findMany({
        where,
        include: {
          _count: { select: { claims: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prismaAny.warranty.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getById(id: string) {
    const warranty = await prismaAny.warranty.findUnique({
      where: { id },
      include: {
        claims: { orderBy: { createdAt: 'desc' } },
        project: { select: { id: true, name: true } },
      },
    })
    if (!warranty) throw new NotFoundError('Warranty', id)
    return warranty
  }

  async create(data: {
    projectId: string
    title: string
    description?: string
    type?: string
    contractor?: string
    manufacturer?: string
    startDate: string
    endDate: string
    coverageDetails?: string
    contactInfo?: string
    documentUrl?: string
    createdById: string
  }) {
    return prismaAny.warranty.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        type: data.type || 'GENERAL',
        contractor: data.contractor,
        manufacturer: data.manufacturer,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        coverageDetails: data.coverageDetails,
        contactInfo: data.contactInfo,
        documentUrl: data.documentUrl,
        createdById: data.createdById,
        status: 'ACTIVE',
      },
      include: {
        _count: { select: { claims: true } },
      },
    })
  }

  async update(id: string, data: {
    title?: string
    description?: string
    type?: string
    contractor?: string
    manufacturer?: string
    startDate?: string
    endDate?: string
    coverageDetails?: string
    contactInfo?: string
    documentUrl?: string
    status?: string
  }) {
    const existing = await prismaAny.warranty.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Warranty', id)

    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    return prismaAny.warranty.update({
      where: { id },
      data: updateData,
      include: {
        claims: true,
        _count: { select: { claims: true } },
      },
    })
  }

  async delete(id: string) {
    const existing = await prismaAny.warranty.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Warranty', id)
    await prismaAny.warranty.delete({ where: { id } })
    return { success: true }
  }

  async fileClaim(warrantyId: string, data: {
    title: string
    description: string
    severity?: string
    reportedBy: string
    reportedDate?: string
    photos?: string[]
  }) {
    const warranty = await prismaAny.warranty.findUnique({ where: { id: warrantyId } })
    if (!warranty) throw new NotFoundError('Warranty', warrantyId)

    return prismaAny.warrantyClaim.create({
      data: {
        warrantyId,
        title: data.title,
        description: data.description,
        severity: data.severity || 'MEDIUM',
        reportedBy: data.reportedBy,
        reportedDate: data.reportedDate ? new Date(data.reportedDate) : new Date(),
        photos: data.photos || [],
        status: 'OPEN',
      },
    })
  }

  async updateClaim(claimId: string, data: {
    title?: string
    description?: string
    severity?: string
    status?: string
    photos?: string[]
  }) {
    const claim = await prismaAny.warrantyClaim.findUnique({ where: { id: claimId } })
    if (!claim) throw new NotFoundError('WarrantyClaim', claimId)

    return prismaAny.warrantyClaim.update({
      where: { id: claimId },
      data,
    })
  }

  async resolveClaim(claimId: string, data: {
    resolution: string
    resolvedBy: string
    resolvedDate?: string
  }) {
    const claim = await prismaAny.warrantyClaim.findUnique({ where: { id: claimId } })
    if (!claim) throw new NotFoundError('WarrantyClaim', claimId)

    return prismaAny.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: 'RESOLVED',
        resolution: data.resolution,
        resolvedBy: data.resolvedBy,
        resolvedDate: data.resolvedDate ? new Date(data.resolvedDate) : new Date(),
      },
    })
  }

  async getExpiring(projectId: string) {
    const now = new Date()
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    return prismaAny.warranty.findMany({
      where: {
        projectId,
        status: 'ACTIVE',
        endDate: { gte: now, lte: ninetyDays },
      },
      include: {
        _count: { select: { claims: true } },
      },
      orderBy: { endDate: 'asc' },
    })
  }

  async getStats(projectId: string) {
    const now = new Date()
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const [active, expired, expiring, claims] = await Promise.all([
      prismaAny.warranty.count({ where: { projectId, status: 'ACTIVE' } }),
      prismaAny.warranty.count({ where: { projectId, status: 'EXPIRED' } }),
      prismaAny.warranty.count({ where: { projectId, status: 'ACTIVE', endDate: { gte: now, lte: ninetyDays } } }),
      prismaAny.warrantyClaim.findMany({
        where: { warranty: { projectId } },
        select: { status: true },
      }),
    ])

    const claimsByStatus: Record<string, number> = {}
    for (const claim of claims) {
      claimsByStatus[claim.status] = (claimsByStatus[claim.status] || 0) + 1
    }

    return { active, expired, expiring, totalClaims: claims.length, claimsByStatus }
  }
}

export const warrantyService = new WarrantyService()
