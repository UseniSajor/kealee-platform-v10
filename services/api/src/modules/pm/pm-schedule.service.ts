/**
 * PM Schedule Service
 * Handles schedule items, Gantt data, critical path, and milestones
 */
import { prismaAny } from '../../utils/prisma-helper'

class PmScheduleService {
  async list(params: any) {
    const where: any = {}
    if (params.projectId) where.projectId = params.projectId
    if (params.status) where.status = params.status.toUpperCase()
    if (params.assignedTo) where.assignedTo = params.assignedTo
    if (params.trade) where.trade = params.trade
    if (params.startDate || params.endDate) {
      where.startDate = {}
      if (params.startDate) where.startDate.gte = new Date(params.startDate)
      if (params.endDate) where.startDate.lte = new Date(params.endDate)
    }
    const page = params.page || 1
    const limit = params.limit || 50
    const [items, total] = await Promise.all([
      prismaAny.scheduleItem.findMany({ where, orderBy: { startDate: 'asc' }, skip: (page - 1) * limit, take: limit }),
      prismaAny.scheduleItem.count({ where }),
    ])
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  async getById(id: string) {
    const item = await prismaAny.scheduleItem.findUnique({ where: { id } })
    if (!item) throw new Error('Schedule item not found')
    return item
  }

  async create(data: any, userId: string) {
    return prismaAny.scheduleItem.create({
      data: {
        projectId: data.projectId, title: data.title, description: data.description || null,
        startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null,
        duration: data.duration || null, trade: data.trade || null,
        assignedTo: data.assignedTo || null, dependencies: data.dependencies || [],
        milestone: data.milestone || false, criticalPath: data.criticalPath || false,
        progress: data.progress || 0, status: data.status || 'NOT_STARTED',
        priority: data.priority || 'MEDIUM', color: data.color || null,
        createdById: userId, metadata: data.metadata || {},
      },
    })
  }

  async update(id: string, updates: any) {
    const existing = await prismaAny.scheduleItem.findUnique({ where: { id } })
    if (!existing) throw new Error('Schedule item not found')
    return prismaAny.scheduleItem.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.startDate && { startDate: new Date(updates.startDate) }),
        ...(updates.endDate !== undefined && { endDate: updates.endDate ? new Date(updates.endDate) : null }),
        ...(updates.duration !== undefined && { duration: updates.duration }),
        ...(updates.trade !== undefined && { trade: updates.trade }),
        ...(updates.assignedTo !== undefined && { assignedTo: updates.assignedTo }),
        ...(updates.dependencies && { dependencies: updates.dependencies }),
        ...(updates.milestone !== undefined && { milestone: updates.milestone }),
        ...(updates.criticalPath !== undefined && { criticalPath: updates.criticalPath }),
        ...(updates.progress !== undefined && { progress: updates.progress }),
        ...(updates.status && { status: updates.status.toUpperCase() }),
        ...(updates.priority && { priority: updates.priority.toUpperCase() }),
        ...(updates.color !== undefined && { color: updates.color }),
        ...(updates.metadata && { metadata: updates.metadata }),
      },
    })
  }

  async delete(id: string) {
    const existing = await prismaAny.scheduleItem.findUnique({ where: { id } })
    if (!existing) throw new Error('Schedule item not found')
    await prismaAny.scheduleItem.delete({ where: { id } })
    return { success: true }
  }

  async updateProgress(id: string, progress: number) {
    const existing = await prismaAny.scheduleItem.findUnique({ where: { id } })
    if (!existing) throw new Error('Schedule item not found')
    const status = progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    return prismaAny.scheduleItem.update({ where: { id }, data: { progress, status } })
  }

  async bulkUpdate(items: Array<{ id: string; updates: any }>) {
    const results = await Promise.all(
      items.map(({ id, updates }) => this.update(id, updates))
    )
    return { updated: results.length, items: results }
  }

  async getGanttData(projectId: string) {
    const items = await prismaAny.scheduleItem.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    })
    return {
      tasks: items.map((item: any) => ({
        id: item.id, name: item.title, start: item.startDate, end: item.endDate,
        progress: item.progress || 0, dependencies: item.dependencies || [],
        milestone: item.milestone || false, criticalPath: item.criticalPath || false,
        color: item.color, trade: item.trade, assignedTo: item.assignedTo,
        status: item.status,
      })),
    }
  }

  async getCriticalPath(projectId: string) {
    const items = await prismaAny.scheduleItem.findMany({
      where: { projectId, criticalPath: true },
      orderBy: { startDate: 'asc' },
    })
    return { items }
  }

  async getMilestones(projectId: string) {
    const items = await prismaAny.scheduleItem.findMany({
      where: { projectId, milestone: true },
      orderBy: { startDate: 'asc' },
    })
    return { milestones: items }
  }
}

export const pmScheduleService = new PmScheduleService()
