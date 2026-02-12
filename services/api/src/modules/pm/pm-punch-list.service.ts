import { prismaAny } from '../../utils/prisma-helper'

class PunchListService {
  async list(filters: { projectId?: string; status?: string; severity?: string; type?: string; assignedTo?: string; location?: string; page?: number; limit?: number }) {
    const { projectId, status, severity, type, assignedTo, location, page = 1, limit = 50 } = filters
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (severity) where.severity = severity
    if (type) where.type = type
    if (assignedTo) where.assignedTo = assignedTo
    if (location) where.location = { contains: location, mode: 'insensitive' }

    const [items, total] = await Promise.all([
      prismaAny.qualityIssue.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prismaAny.qualityIssue.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getById(id: string) {
    return prismaAny.qualityIssue.findUnique({ where: { id } })
  }

  async create(data: any) {
    return prismaAny.qualityIssue.create({ data })
  }

  async update(id: string, data: any) {
    return prismaAny.qualityIssue.update({ where: { id }, data })
  }

  async softDelete(id: string) {
    return prismaAny.qualityIssue.update({ where: { id }, data: { status: 'CLOSED' } })
  }

  async resolve(id: string, data: { resolution: string; resolvedBy: string }) {
    return prismaAny.qualityIssue.update({ where: { id }, data: { status: 'RESOLVED', resolution: data.resolution, resolvedAt: new Date() } })
  }

  async verify(id: string, data: { verifiedBy: string }) {
    return prismaAny.qualityIssue.update({ where: { id }, data: { status: 'VERIFIED', verifiedAt: new Date(), verifiedBy: data.verifiedBy } })
  }

  async reopen(id: string) {
    return prismaAny.qualityIssue.update({ where: { id }, data: { status: 'OPEN', resolvedAt: null, resolution: null, verifiedAt: null, verifiedBy: null } })
  }

  async getStats(projectId?: string) {
    const where: any = projectId ? { projectId } : {}
    const [total, byStatus, bySeverity] = await Promise.all([
      prismaAny.qualityIssue.count({ where }),
      prismaAny.qualityIssue.groupBy({ by: ['status'], where, _count: true }),
      prismaAny.qualityIssue.groupBy({ by: ['severity'], where, _count: true }),
    ])
    return { total, byStatus: byStatus.reduce((acc: any, s: any) => ({ ...acc, [s.status]: s._count }), {}), bySeverity: bySeverity.reduce((acc: any, s: any) => ({ ...acc, [s.severity]: s._count }), {}) }
  }
}

export const punchListService = new PunchListService()
