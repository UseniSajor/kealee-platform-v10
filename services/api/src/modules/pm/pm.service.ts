import { prismaAny } from '../../utils/prisma-helper'

/**
 * PM service with real data and workload balancing
 */
class PMService {
  async getStatsForUser(userId: string) {
    const user = await prismaAny.user.findUnique({ where: { id: userId }, select: { name: true } })

    // Get tasks assigned to this PM
    const now = new Date()
    const startOfToday = new Date(now.setHours(0, 0, 0, 0))
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

    // Count tasks
    const allTasks = await prismaAny.task.findMany({
      where: { pmId: userId },
    })

    const tasksToday = allTasks.filter((t: any) => {
      const created = new Date(t.createdAt || t.dueDate || 0)
      return created >= startOfToday && t.status !== 'completed'
    }).length

    const highPriority = allTasks.filter((t: any) => 
      (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed'
    ).length

    // Get clients (orgs with service requests assigned to this PM)
    const serviceRequests = await prismaAny.serviceRequest.findMany({
      where: { assignedTo: userId },
      include: { org: { select: { id: true, name: true } } },
    })

    const uniqueOrgs = new Set(serviceRequests.map((sr: any) => sr.orgId))
    const totalClients = uniqueOrgs.size

    // Get active projects (projects with active service requests)
    const activeProjects = new Set(serviceRequests
      .filter((sr: any) => sr.status !== 'completed' && sr.status !== 'canceled')
      .map((sr: any) => (sr as any).projectId)
      .filter(Boolean)
    ).size

    // Calculate hours (simplified - using timeSpentMinutes from metadata)
    const hoursThisWeek = serviceRequests.reduce((total: number, sr: any) => {
      const metadata = (sr.metadata as any) || {}
      const timeSpent = metadata.timeSpentMinutes || 0
      const created = new Date(sr.createdAt)
      if (created >= startOfWeek) {
        return total + timeSpent
      }
      return total
    }, 0) / 60

    // Calculate satisfaction (from completed requests)
    const completedRequests = serviceRequests.filter((sr: any) => sr.status === 'completed')
    const satisfactionScores = completedRequests
      .map((sr: any) => {
        const metadata = (sr.metadata as any) || {}
        return metadata.satisfaction || null
      })
      .filter((s: any) => s !== null) as number[]

    const satisfactionScore = satisfactionScores.length > 0
      ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
      : 0

    // Billable percent (simplified - assume all service request work is billable)
    const billablePercent = 100

    return {
      name: user?.name ?? undefined,
      tasksToday,
      highPriority,
      totalClients,
      activeProjects,
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      billablePercent,
      satisfactionScore: Math.round(satisfactionScore * 10) / 10,
    }
  }

  async listMyClients(userId: string, opts?: { active?: boolean; limit?: number }) {
    const where: any = {
      serviceRequests: {
        some: {
          assignedTo: userId,
        },
      },
    }

    if (opts?.active !== undefined) {
      where.status = opts.active ? 'ACTIVE' : { not: 'ACTIVE' }
    }

    const orgs = await prismaAny.org.findMany({
      where,
      include: {
        serviceRequests: {
          where: { assignedTo: userId },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      take: opts?.limit || 50,
    })

    return orgs.map((org: any) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      activeRequests: org.serviceRequests.filter((sr: any) => 
        sr.status !== 'completed' && sr.status !== 'canceled'
      ).length,
      totalRequests: org.serviceRequests.length,
      recentRequests: org.serviceRequests,
    }))
  }

  async listMyTasks(
    userId: string,
    opts?: {
      status?: string
      priority?: string
      assignedTo?: string
      client?: string
      search?: string
      page?: number
      pageSize?: number
      sortBy?: 'dueDate' | 'priority' | 'createdAt'
      sortOrder?: 'asc' | 'desc'
      limit?: number
    }
  ) {
    const where: any = { pmId: userId }

    if (opts?.status && opts.status !== 'all') {
      where.status = opts.status
    }

    if (opts?.priority && opts.priority !== 'all') {
      where.priority = opts.priority === 'high' ? { in: ['high', 'urgent'] } : opts.priority
    }

    if (opts?.assignedTo && opts.assignedTo !== 'all') {
      where.pmId = opts.assignedTo
    }

    if (opts?.client) {
      where.serviceRequest = {
        orgId: opts.client,
      }
    }

    if (opts?.search) {
      where.OR = [
        { title: { contains: opts.search, mode: 'insensitive' } },
        { description: { contains: opts.search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy
    const orderBy: any[] = []
    if (opts?.sortBy === 'dueDate') {
      orderBy.push({ dueDate: opts.sortOrder || 'asc' })
    } else if (opts?.sortBy === 'priority') {
      orderBy.push({ priority: opts.sortOrder || 'desc' })
    } else if (opts?.sortBy === 'createdAt') {
      orderBy.push({ createdAt: opts.sortOrder || 'desc' })
    } else {
      // Default ordering
      orderBy.push({ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' })
    }

    // Pagination
    const page = opts?.page || 1
    const pageSize = opts?.pageSize || 20
    const skip = (page - 1) * pageSize
    const take = opts?.limit || pageSize

    // Get total count
    const total = await prismaAny.task.count({ where })

    // Get tasks
    const tasks = await prismaAny.task.findMany({
      where,
      include: {
        serviceRequest: {
          select: {
            id: true,
            title: true,
            category: true,
            org: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take,
    })

    return {
      tasks: tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        serviceRequest: t.serviceRequest,
        assignedTo: t.pmId,
      })),
      total,
      page,
      pageSize,
    }
  }

  async getTask(userId: string, taskId: string) {
    const task = await prismaAny.task.findFirst({
      where: {
        id: taskId,
        pmId: userId,
      },
      include: {
        serviceRequest: {
          include: {
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!task) return null

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      serviceRequest: task.serviceRequest,
      assignedTo: task.pmId,
    }
  }

  /**
   * Workload balancing: Assign service request to PM with least active tasks
   */
  async assignToBestPM(serviceRequestId: string, orgId: string) {
    // Get all PMs (users with PM role in this org or all PMs)
    const orgMembers = await prismaAny.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        role: {
          select: { key: true },
        },
      },
    })

    // Filter to PMs (users with PM role or all users if no role system)
    const pms = orgMembers
      .filter((m: any) => !m.role || m.role.key === 'pm' || m.role.key === 'project_manager')
      .map((m: any) => m.user)

    if (pms.length === 0) {
      // No PMs found, leave unassigned
      return null
    }

    // Calculate workload for each PM
    const workloads = await Promise.all(
      pms.map(async (pm: any) => {
        const activeTasks = await prismaAny.task.count({
          where: {
            pmId: pm.id,
            status: { not: 'completed' },
          },
        })

        const activeServiceRequests = await prismaAny.serviceRequest.count({
          where: {
            assignedTo: pm.id,
            status: { notIn: ['completed', 'canceled'] },
          },
        })

        return {
          pmId: pm.id,
          pmName: pm.name,
          activeTasks,
          activeServiceRequests,
          totalWorkload: activeTasks + activeServiceRequests,
        }
      })
    )

    // Sort by workload (ascending) and assign to PM with least work
    workloads.sort((a, b) => a.totalWorkload - b.totalWorkload)
    const bestPM = workloads[0]

    // Assign the service request
    await prismaAny.serviceRequest.update({
      where: { id: serviceRequestId },
      data: {
        assignedTo: bestPM.pmId,
        status: 'in_progress',
      },
    })

    // Create a task for the PM
    const serviceRequest = await prismaAny.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    })

    if (serviceRequest) {
      await prismaAny.task.create({
        data: {
          serviceRequestId,
          pmId: bestPM.pmId,
          title: `[GC] ${serviceRequest.title}`,
          description: serviceRequest.description || '',
          status: 'pending',
          priority: serviceRequest.priority === 'urgent' ? 'urgent' : 
                   serviceRequest.priority === 'high' ? 'high' : 'medium',
          dueDate: serviceRequest.dueDate,
        },
      })
    }

    return bestPM
  }

  /**
   * Generate weekly report for PM
   */
  async generateWeeklyReport(userId: string, weekStart?: Date) {
    const now = new Date()
    const startOfWeek = weekStart || new Date(now.setDate(now.getDate() - now.getDay()))
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    // Get all tasks and service requests for this week
    const tasks = await prismaAny.task.findMany({
      where: {
        pmId: userId,
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
      include: {
        serviceRequest: {
          include: {
            org: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    const serviceRequests = await prismaAny.serviceRequest.findMany({
      where: {
        assignedTo: userId,
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate metrics
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const completedRequests = serviceRequests.filter((sr: any) => sr.status === 'completed').length
    const totalRequests = serviceRequests.length
    const requestCompletionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0

    // Calculate hours (from metadata)
    const totalHours = [...tasks, ...serviceRequests].reduce((total: number, item: any) => {
      const metadata = (item.metadata as any) || {}
      const timeSpent = metadata.timeSpentMinutes || 0
      return total + timeSpent
    }, 0) / 60

    // Calculate satisfaction
    const satisfactionScores = serviceRequests
      .filter((sr: any) => sr.status === 'completed')
      .map((sr: any) => {
        const metadata = (sr.metadata as any) || {}
        return metadata.satisfaction || null
      })
      .filter((s: any) => s !== null) as number[]

    const avgSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
      : 0

    // Group by client
    const clientStats = new Map<string, any>()
    serviceRequests.forEach((sr: any) => {
      const orgId = sr.orgId
      if (!clientStats.has(orgId)) {
        clientStats.set(orgId, {
          orgId,
          orgName: sr.org?.name || 'Unknown',
          requests: 0,
          completed: 0,
          hours: 0,
        })
      }
      const stats = clientStats.get(orgId)!
      stats.requests++
      if (sr.status === 'completed') stats.completed++
      const metadata = (sr.metadata as any) || {}
      stats.hours += (metadata.timeSpentMinutes || 0) / 60
    })

    return {
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString(),
      generatedAt: new Date().toISOString(),
      summary: {
        totalTasks,
        completedTasks,
        completionRate: Math.round(completionRate * 10) / 10,
        totalRequests,
        completedRequests,
        requestCompletionRate: Math.round(requestCompletionRate * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      },
      clients: Array.from(clientStats.values()),
      tasks: tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        completedAt: t.completedAt,
        serviceRequest: t.serviceRequest ? {
          id: t.serviceRequest.id,
          title: t.serviceRequest.title,
          org: t.serviceRequest.org,
        } : null,
      })),
      serviceRequests: serviceRequests.map((sr: any) => ({
        id: sr.id,
        title: sr.title,
        status: sr.status,
        priority: sr.priority,
        category: sr.category,
        org: sr.org,
        createdAt: sr.createdAt,
        completedAt: sr.completedAt,
      })),
    }
  }

  /**
   * Bulk assign tasks to a PM
   */
  async bulkAssignTasks(userId: string, taskIds: string[], newAssigneeId: string) {
    const updated = await Promise.all(
      taskIds.map(async (taskId) => {
        const task = await prismaAny.task.findFirst({
          where: {
            id: taskId,
            pmId: userId, // Only allow if user owns the task or is admin
          },
        })

        if (!task) {
          throw new Error(`Task ${taskId} not found or access denied`)
        }

        return prismaAny.task.update({
          where: { id: taskId },
          data: { pmId: newAssigneeId },
        })
      })
    )

    return updated
  }

  /**
   * Bulk complete tasks
   */
  async bulkCompleteTasks(userId: string, taskIds: string[]) {
    const updated = await Promise.all(
      taskIds.map(async (taskId) => {
        const task = await prismaAny.task.findFirst({
          where: {
            id: taskId,
            pmId: userId,
          },
        })

        if (!task) {
          throw new Error(`Task ${taskId} not found or access denied`)
        }

        return prismaAny.task.update({
          where: { id: taskId },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        })
      })
    )

    return updated
  }

  /**
   * Update task
   */
  async updateTask(userId: string, taskId: string, data: {
    title?: string
    description?: string
    priority?: string
    status?: string
    dueDate?: string
    assignedTo?: string
  }) {
    const task = await prismaAny.task.findFirst({
      where: {
        id: taskId,
        pmId: userId,
      },
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.status !== undefined) updateData.status = data.status
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.assignedTo !== undefined) updateData.pmId = data.assignedTo

    const updated = await prismaAny.task.update({
      where: { id: taskId },
      data: updateData,
    })

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      dueDate: updated.dueDate,
      createdAt: updated.createdAt,
      completedAt: updated.completedAt,
      assignedTo: updated.pmId,
    }
  }

  /**
   * Get task comments
   */
  async getTaskComments(userId: string, taskId: string) {
    const task = await prismaAny.task.findFirst({
      where: {
        id: taskId,
        pmId: userId,
      },
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }

    // Comments stored in metadata for now
    const metadata = (task.metadata as any) || {}
    return metadata.comments || []
  }

  /**
   * Add task comment
   */
  async addTaskComment(userId: string, taskId: string, message: string) {
    const task = await prismaAny.task.findFirst({
      where: {
        id: taskId,
        pmId: userId,
      },
    })

    if (!task) {
      throw new Error('Task not found or access denied')
    }

    const metadata = (task.metadata as any) || {}
    const comments = Array.isArray(metadata.comments) ? metadata.comments : []

    const comment = {
      id: `comment_${Date.now()}`,
      message,
      userId,
      createdAt: new Date().toISOString(),
    }

    comments.push(comment)

    await prismaAny.task.update({
      where: { id: taskId },
      data: {
        metadata: {
          ...metadata,
          comments,
        },
      },
    })

    return comment
  }

  /**
   * Get workload stats for all PMs
   */
  async getWorkloadStats() {
    // Get all users with PM role
    const pms = await prismaAny.user.findMany({
      where: {
        orgMemberships: {
          some: {
            role: {
              key: { in: ['pm', 'project_manager'] },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    const workloads = await Promise.all(
      pms.map(async (pm) => {
        const activeTasks = await prismaAny.task.count({
          where: {
            pmId: pm.id,
            status: { not: 'completed' },
          },
        })

        const allTasks = await prismaAny.task.findMany({
          where: { pmId: pm.id },
        })

        // Calculate priority weight (high=3, medium=2, low=1)
        const priorityWeight = allTasks.reduce((total: number, t: any) => {
          if (t.status === 'completed') return total
          const weight = t.priority === 'high' || t.priority === 'urgent' ? 3 :
                        t.priority === 'medium' ? 2 : 1
          return total + weight
        }, 0)

        // Calculate total hours (from service requests)
        const serviceRequests = await prismaAny.serviceRequest.findMany({
          where: { assignedTo: pm.id },
        })

        const totalHours = serviceRequests.reduce((total: number, sr: any) => {
          const metadata = (sr.metadata as any) || {}
          return total + ((metadata.timeSpentMinutes || 0) / 60)
        }, 0)

        return {
          pmId: pm.id,
          pmName: pm.name || pm.email,
          activeTasks,
          totalHours: Math.round(totalHours * 10) / 10,
          priorityWeight,
          workloadPercentage: 0, // Will calculate below
        }
      })
    )

    // Calculate workload percentage (normalize to 0-100)
    const maxWorkload = Math.max(...workloads.map(w => w.activeTasks + w.priorityWeight), 1)
    workloads.forEach(w => {
      w.workloadPercentage = Math.round(((w.activeTasks + w.priorityWeight) / maxWorkload) * 100)
    })

    return workloads.sort((a, b) => a.workloadPercentage - b.workloadPercentage)
  }

  /**
   * Assign client to PM
   */
  async assignClientToPM(clientId: string, pmId: string, effectiveDate?: Date) {
    // For now, we'll update service requests to assign them to the PM
    // In a full implementation, we'd have a ClientAssignment table
    const org = await prismaAny.org.findUnique({
      where: { id: clientId },
      include: {
        serviceRequests: {
          where: {
            status: { notIn: ['completed', 'canceled'] },
          },
        },
      },
    })

    if (!org) {
      throw new Error('Client not found')
    }

    // Assign all active service requests to the PM
    await Promise.all(
      org.serviceRequests.map((sr: any) =>
        prismaAny.serviceRequest.update({
          where: { id: sr.id },
          data: {
            assignedTo: pmId,
            status: sr.status === 'open' ? 'in_progress' : sr.status,
          },
        })
      )
    )

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      assignedTo: pmId,
      assignedAt: effectiveDate || new Date(),
    }
  }

  /**
   * Get unassigned clients (orgs with no PM assigned to service requests)
   */
  async getUnassignedClients() {
    // Get all orgs
    const allOrgs = await prismaAny.org.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        serviceRequests: {
          where: {
            status: { notIn: ['completed', 'canceled'] },
          },
        },
      },
    })

    // Filter to orgs with unassigned service requests
    const unassigned = allOrgs.filter((org: any) => {
      const hasUnassigned = org.serviceRequests.some((sr: any) => !sr.assignedTo)
      return hasUnassigned || org.serviceRequests.length === 0
    })

    return unassigned.map((org: any) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      activeRequests: org.serviceRequests.filter((sr: any) => !sr.assignedTo).length,
      totalRequests: org.serviceRequests.length,
    }))
  }
}

export const pmService = new PMService()

