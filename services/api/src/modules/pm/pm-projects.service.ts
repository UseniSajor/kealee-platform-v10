/**
 * PM Projects Service
 * Handles project CRUD, overview, activity feed, and status reports
 */
import { prismaAny } from '../../utils/prisma-helper'

class ProjectService {
  async list(filters: {
    clientId?: string
    status?: string
    phase?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 25
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.status) where.status = filters.status
    if (filters.phase) where.phase = filters.phase
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prismaAny.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              tasks: true,
              changeOrders: true,
              rfis: true,
              submittals: true,
              dailyLogs: true,
            },
          },
        },
      }),
      prismaAny.project.count({ where }),
    ])

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getById(id: string) {
    const project = await prismaAny.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            changeOrders: true,
            rfis: true,
            submittals: true,
            dailyLogs: true,
          },
        },
      },
    })

    if (!project) throw new Error('Project not found')
    return project
  }

  async create(data: {
    name: string
    description?: string
    clientId?: string
    startDate?: string
    endDate?: string
    budget?: number
    address?: string
    orgId: string
    createdById: string
  }) {
    return prismaAny.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        budget: data.budget,
        address: data.address,
        orgId: data.orgId,
        createdById: data.createdById,
        status: 'ACTIVE',
      },
    })
  }

  async update(id: string, data: {
    name?: string
    description?: string
    clientId?: string
    startDate?: string
    endDate?: string
    budget?: number
    address?: string
    status?: string
    phase?: string
  }) {
    const existing = await prismaAny.project.findUnique({ where: { id } })
    if (!existing) throw new Error('Project not found')

    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    return prismaAny.project.update({
      where: { id },
      data: updateData,
    })
  }

  async archive(id: string) {
    const existing = await prismaAny.project.findUnique({ where: { id } })
    if (!existing) throw new Error('Project not found')

    return prismaAny.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  }

  async getOverview(id: string) {
    const project = await prismaAny.project.findUnique({ where: { id } })
    if (!project) throw new Error('Project not found')

    const [
      taskCount,
      changeOrderCount,
      rfiCount,
      submittalCount,
      dailyLogCount,
      openRfis,
      pendingSubmittals,
      pendingChangeOrders,
      recentItems,
    ] = await Promise.all([
      prismaAny.scheduleItem.count({ where: { projectId: id } }),
      prismaAny.changeOrder.count({ where: { projectId: id } }),
      prismaAny.rFI.count({ where: { projectId: id, status: { not: 'VOID' } } }),
      prismaAny.submittal.count({ where: { projectId: id } }),
      prismaAny.dailyLog.count({ where: { projectId: id } }),
      prismaAny.rFI.count({ where: { projectId: id, status: 'OPEN' } }),
      prismaAny.submittal.count({ where: { projectId: id, status: { in: ['PENDING', 'IN_REVIEW'] } } }),
      prismaAny.changeOrder.count({ where: { projectId: id, status: { in: ['DRAFT', 'SUBMITTED', 'PENDING'] } } }),
      prismaAny.dailyLog.findMany({
        where: { projectId: id },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ])

    // Budget summary
    const budgetLines = await prismaAny.budgetLine.findMany({ where: { projectId: id } })
    const totalBudget = budgetLines.reduce((sum: number, l: any) => sum + (parseFloat(l.budgetAmount) || 0), 0)
    const totalActual = budgetLines.reduce((sum: number, l: any) => sum + (parseFloat(l.actualAmount) || 0), 0)

    return {
      project: { id: project.id, name: project.name, status: project.status },
      counts: {
        tasks: taskCount,
        changeOrders: changeOrderCount,
        rfis: rfiCount,
        submittals: submittalCount,
        dailyLogs: dailyLogCount,
      },
      actionItems: {
        openRfis,
        pendingSubmittals,
        pendingChangeOrders,
      },
      budget: {
        total: totalBudget,
        actual: totalActual,
        variance: totalBudget - totalActual,
      },
      recentActivity: recentItems,
    }
  }

  async getActivity(id: string, filters: { page?: number; limit?: number }) {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20

    // Gather recent items from multiple models
    const [rfis, submittals, changeOrders, dailyLogs] = await Promise.all([
      prismaAny.rFI.findMany({
        where: { projectId: id },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: { id: true, subject: true, status: true, createdAt: true, updatedAt: true },
      }),
      prismaAny.submittal.findMany({
        where: { projectId: id },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: { id: true, title: true, status: true, createdAt: true, updatedAt: true },
      }),
      prismaAny.changeOrder.findMany({
        where: { projectId: id },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: { id: true, title: true, status: true, createdAt: true, updatedAt: true },
      }),
      prismaAny.dailyLog.findMany({
        where: { projectId: id },
        orderBy: { date: 'desc' },
        take: limit,
        select: { id: true, date: true, summary: true, createdAt: true },
      }),
    ])

    // Combine and sort by most recent
    const activity = [
      ...rfis.map((r: any) => ({ type: 'rfi', id: r.id, title: r.subject, status: r.status, date: r.updatedAt })),
      ...submittals.map((s: any) => ({ type: 'submittal', id: s.id, title: s.title, status: s.status, date: s.updatedAt })),
      ...changeOrders.map((co: any) => ({ type: 'changeOrder', id: co.id, title: co.title, status: co.status, date: co.updatedAt })),
      ...dailyLogs.map((dl: any) => ({ type: 'dailyLog', id: dl.id, title: dl.summary, date: dl.createdAt })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice((page - 1) * limit, page * limit)

    return { activity, page, limit }
  }

  async getStatusReport(id: string) {
    const project = await prismaAny.project.findUnique({ where: { id } })
    if (!project) throw new Error('Project not found')

    const [
      rfiStats,
      submittalStats,
      changeOrderStats,
      scheduleItems,
      budgetLines,
    ] = await Promise.all([
      prismaAny.rFI.groupBy({ by: ['status'], where: { projectId: id }, _count: true }),
      prismaAny.submittal.groupBy({ by: ['status'], where: { projectId: id }, _count: true }),
      prismaAny.changeOrder.groupBy({ by: ['status'], where: { projectId: id }, _count: true }),
      prismaAny.scheduleItem.findMany({ where: { projectId: id } }),
      prismaAny.budgetLine.findMany({ where: { projectId: id } }),
    ])

    const toStatusMap = (groups: any[]) =>
      groups.reduce((acc: any, g: any) => ({ ...acc, [g.status]: g._count }), {})

    // Schedule summary
    const totalTasks = scheduleItems.length
    const completedTasks = scheduleItems.filter((t: any) => t.status === 'COMPLETED').length
    const avgProgress = totalTasks > 0
      ? scheduleItems.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / totalTasks
      : 0

    // Budget summary
    const totalBudget = budgetLines.reduce((sum: number, l: any) => sum + (parseFloat(l.budgetAmount) || 0), 0)
    const totalActual = budgetLines.reduce((sum: number, l: any) => sum + (parseFloat(l.actualAmount) || 0), 0)

    return {
      project: { id: project.id, name: project.name, status: project.status },
      rfis: toStatusMap(rfiStats),
      submittals: toStatusMap(submittalStats),
      changeOrders: toStatusMap(changeOrderStats),
      schedule: {
        totalTasks,
        completedTasks,
        averageProgress: Math.round(avgProgress * 100) / 100,
      },
      budget: {
        total: totalBudget,
        actual: totalActual,
        variance: totalBudget - totalActual,
        variancePercent: totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget) * 100 : 0,
      },
    }
  }
}

export const projectService = new ProjectService()
