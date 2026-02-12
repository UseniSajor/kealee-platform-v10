import { prismaAny } from '../../utils/prisma-helper'

class DailyLogService {
  async list(filters: { projectId?: string; contractorId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const { projectId, contractorId, startDate, endDate, page = 1, limit = 50 } = filters
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (contractorId) where.contractorId = contractorId
    if (startDate || endDate) { where.date = {}; if (startDate) where.date.gte = new Date(startDate); if (endDate) where.date.lte = new Date(endDate) }

    const [items, total] = await Promise.all([
      prismaAny.dailyLog.findMany({ where, include: { project: { select: { id: true, name: true } }, contractor: { select: { id: true, name: true, email: true } } }, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prismaAny.dailyLog.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getById(id: string) {
    return prismaAny.dailyLog.findUnique({ where: { id }, include: { project: { select: { id: true, name: true } }, contractor: { select: { id: true, name: true, email: true } } } })
  }

  async create(data: any) {
    return prismaAny.dailyLog.create({ data, include: { project: { select: { id: true, name: true } } } })
  }

  async update(id: string, data: any) {
    return prismaAny.dailyLog.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prismaAny.dailyLog.delete({ where: { id } })
  }

  async signOff(id: string, userId: string) {
    const log = await prismaAny.dailyLog.findUnique({ where: { id } })
    const metadata = (log?.metadata as any) || {}
    return prismaAny.dailyLog.update({ where: { id }, data: { metadata: { ...metadata, signedBy: userId, signedAt: new Date().toISOString() } } })
  }

  async getSummary(filters: { projectId: string; startDate: string; endDate: string }) {
    const where: any = { projectId: filters.projectId, date: { gte: new Date(filters.startDate), lte: new Date(filters.endDate) } }
    const logs = await prismaAny.dailyLog.findMany({ where, orderBy: { date: 'asc' } })
    const totalCrewHours = logs.reduce((sum: number, l: any) => sum + ((l.crewCount || 0) * (l.hoursWorked || 0)), 0)
    const totalLogs = logs.length
    const weatherDays = logs.reduce((acc: any, l: any) => { const w = l.weather || 'unknown'; acc[w] = (acc[w] || 0) + 1; return acc }, {})
    return { totalLogs, totalCrewHours, weatherDays, logs }
  }
}

export const dailyLogService = new DailyLogService()
