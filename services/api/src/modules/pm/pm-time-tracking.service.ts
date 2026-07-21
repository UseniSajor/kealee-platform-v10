import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

class TimeTrackingService {
  async list(filters: {
    projectId: string
    userId?: string
    startDate?: string
    endDate?: string
    type?: string
    approved?: boolean
    page?: number
    limit?: number
  }) {
    const { projectId, userId, startDate, endDate, type, approved, page = 1, limit = 50 } = filters
    const skip = (page - 1) * limit
    const where: any = { projectId }
    if (userId) where.userId = userId
    if (type) where.type = type
    if (approved !== undefined) where.approved = approved
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const [data, total] = await Promise.all([
      prismaAny.timeEntry.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prismaAny.timeEntry.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getById(id: string) {
    const entry = await prismaAny.timeEntry.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    })
    if (!entry) throw new NotFoundError('TimeEntry', id)
    return entry
  }

  async create(data: {
    projectId: string
    userId: string
    date: string
    hours: number
    type?: string
    description?: string
    taskId?: string
    trade?: string
    costCode?: string
    overtime?: boolean
  }) {
    return prismaAny.timeEntry.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        date: new Date(data.date),
        hours: data.hours,
        type: data.type || 'REGULAR',
        description: data.description,
        taskId: data.taskId,
        trade: data.trade,
        costCode: data.costCode,
        overtime: data.overtime || false,
        approved: false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    })
  }

  async update(id: string, data: {
    date?: string
    hours?: number
    type?: string
    description?: string
    taskId?: string
    trade?: string
    costCode?: string
    overtime?: boolean
  }) {
    const existing = await prismaAny.timeEntry.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('TimeEntry', id)

    const updateData: any = { ...data }
    if (data.date) updateData.date = new Date(data.date)

    return prismaAny.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    })
  }

  async delete(id: string) {
    const existing = await prismaAny.timeEntry.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('TimeEntry', id)
    await prismaAny.timeEntry.delete({ where: { id } })
    return { success: true }
  }

  async bulkCreate(entries: Array<{
    projectId: string
    userId: string
    date: string
    hours: number
    type?: string
    description?: string
    taskId?: string
    trade?: string
    costCode?: string
    overtime?: boolean
  }>) {
    const created = await prismaAny.timeEntry.createMany({
      data: entries.map(entry => ({
        projectId: entry.projectId,
        userId: entry.userId,
        date: new Date(entry.date),
        hours: entry.hours,
        type: entry.type || 'REGULAR',
        description: entry.description,
        taskId: entry.taskId,
        trade: entry.trade,
        costCode: entry.costCode,
        overtime: entry.overtime || false,
        approved: false,
      })),
    })
    return { count: created.count }
  }

  async approve(id: string, approverId: string) {
    const existing = await prismaAny.timeEntry.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('TimeEntry', id)

    return prismaAny.timeEntry.update({
      where: { id },
      data: { approved: true, approvedById: approverId, approvedAt: new Date() },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    })
  }

  async bulkApprove(ids: string[], approverId: string) {
    const result = await prismaAny.timeEntry.updateMany({
      where: { id: { in: ids } },
      data: { approved: true, approvedById: approverId, approvedAt: new Date() },
    })
    return { count: result.count }
  }

  async getSummary(filters: {
    projectId: string
    startDate?: string
    endDate?: string
    groupBy?: string
  }) {
    const { projectId, startDate, endDate } = filters
    const where: any = { projectId }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const entries = await prismaAny.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    const byUser: Record<string, { userId: string; name: string; totalHours: number; entries: number }> = {}
    const byTrade: Record<string, { totalHours: number; entries: number }> = {}
    const byDate: Record<string, { totalHours: number; entries: number }> = {}
    let totalHours = 0

    for (const entry of entries) {
      totalHours += Number(entry.hours)

      const userId = entry.userId
      if (!byUser[userId]) byUser[userId] = { userId, name: entry.user?.name || 'Unknown', totalHours: 0, entries: 0 }
      byUser[userId].totalHours += Number(entry.hours)
      byUser[userId].entries++

      const trade = entry.trade || 'Unassigned'
      if (!byTrade[trade]) byTrade[trade] = { totalHours: 0, entries: 0 }
      byTrade[trade].totalHours += Number(entry.hours)
      byTrade[trade].entries++

      const dateKey = new Date(entry.date).toISOString().split('T')[0]
      if (!byDate[dateKey]) byDate[dateKey] = { totalHours: 0, entries: 0 }
      byDate[dateKey].totalHours += Number(entry.hours)
      byDate[dateKey].entries++
    }

    return { totalHours, totalEntries: entries.length, byUser: Object.values(byUser), byTrade, byDate }
  }

  async getTimesheet(userId: string, weekStart: string) {
    const start = new Date(weekStart)
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)

    const entries = await prismaAny.timeEntry.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    })

    const days: Record<string, any[]> = {}
    let totalHours = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
      days[d.toISOString().split('T')[0]] = []
    }

    for (const entry of entries) {
      const dateKey = new Date(entry.date).toISOString().split('T')[0]
      if (days[dateKey]) days[dateKey].push(entry)
      totalHours += Number(entry.hours)
    }

    return { userId, weekStart: start.toISOString(), weekEnd: end.toISOString(), totalHours, days }
  }
}

export const timeTrackingService = new TimeTrackingService()
