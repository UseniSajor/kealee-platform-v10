import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'
import { pmPriorityScoringService } from './pm-priority-scoring.service'

interface PMProductivityMetrics {
  productivityScore: number
  activeHoursToday: number
  focusTimeRemaining: number
  complianceScore: {
    sopAdherence: number
    gateCompliance: number
    auditScore: number
  }
  workload: {
    gcProjects: number
    homeownerProjects: number
    permitsPending: number
    escrowReleases: number
  }
  priorityTasks: Array<{
    id: string
    title: string
    source: 'GC' | 'Homeowner' | 'Permit' | 'Escrow'
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
    dueTime: string
    estimatedEffort: number
  }>
}

export const pmProductivityService = {
  async getProductivityDashboard(userId: string): Promise<PMProductivityMetrics> {
    // Get user's organization memberships
    const user = await prismaAny.user.findUnique({
      where: { id: userId },
      include: {
        orgMemberships: {
          include: { org: true },
          take: 1,
          orderBy: { joinedAt: 'asc' },
        },
      },
    })

    if (!user || !user.orgMemberships?.[0]?.org) {
      throw new NotFoundError('User or organization not found')
    }

    const orgId = user.orgMemberships[0].org.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Calculate active hours today (from time tracking or task completion)
    const tasksCompletedToday = await prismaAny.task.findMany({
      where: {
        assignedTo: userId,
        status: 'completed',
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // Estimate active hours from completed tasks (assuming 15 min per task minimum)
    const activeHoursToday = Math.round(
      (tasksCompletedToday.reduce((sum: number, task: any) => sum + (task.estimatedTime || 15), 0) / 60) * 10
    ) / 10

    // Calculate productivity score based on SOP adherence
    // This would integrate with SOP completion tracking
    const sopStepsCompleted = await prismaAny.sOPCompletion?.findMany({
      where: {
        userId,
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }).catch(() => [])

    const totalSOPSteps = 100 // This would come from SOP configuration
    const sopAdherence = sopStepsCompleted?.length
      ? Math.round((sopStepsCompleted.length / totalSOPSteps) * 100)
      : 75 // Default if no SOP tracking

    // Calculate gate compliance
    const mandatoryGates = await prismaAny.projectGate?.findMany({
      where: {
        project: {
          organizationId: orgId,
        },
        isMandatory: true,
      },
    }).catch(() => [])

    const completedGates = await prismaAny.projectGate?.findMany({
      where: {
        project: {
          organizationId: orgId,
        },
        isMandatory: true,
        status: 'APPROVED',
      },
    }).catch(() => [])

    const gateCompliance = mandatoryGates?.length
      ? Math.round((completedGates?.length || 0 / mandatoryGates.length) * 100)
      : 85

    // Calculate audit score (from audit logs)
    const auditLogs = await prismaAny.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    })

    const failedAudits = auditLogs.filter((log: any) => log.severity === 'ERROR').length
    const auditScore = auditLogs.length > 0
      ? Math.max(0, 100 - (failedAudits / auditLogs.length) * 100)
      : 90

    // Calculate productivity score (weighted average)
    const productivityScore = Math.round(
      sopAdherence * 0.4 + gateCompliance * 0.3 + auditScore * 0.3
    )

    // Focus time remaining (8 hours work day - active hours)
    const focusTimeRemaining = Math.max(0, 8 - activeHoursToday)

    // Get workload from all profit centers
    // GC Projects (from m-ops-services / service requests)
    const gcProjects = await prismaAny.serviceRequest?.count({
      where: {
        organizationId: orgId,
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
    }).catch(() => 0)

    // Homeowner Projects (from m-project-owner)
    const homeownerProjects = await prismaAny.project?.count({
      where: {
        organizationId: orgId,
        status: {
          in: ['ACTIVE', 'IN_PROGRESS'],
        },
      },
    }).catch(() => 0)

    // Permits Pending (from m-permits-inspections)
    const permitsPending = await prismaAny.permitApplication?.count({
      where: {
        organizationId: orgId,
        status: {
          in: ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED'],
        },
      },
    }).catch(() => 0)

    // Escrow Releases (from m-finance-trust)
    const escrowReleases = await prismaAny.escrowRelease?.count({
      where: {
        organizationId: orgId,
        status: 'PENDING',
      },
    }).catch(() => 0)

    // Build priority tasks queue
    const priorityTasks: PMProductivityMetrics['priorityTasks'] = []

    // Get critical tasks from GC projects
    const criticalServiceRequests = await prismaAny.serviceRequest?.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        priority: 'URGENT',
      },
      take: 5,
      orderBy: { createdAt: 'asc' },
    }).catch(() => [])

    criticalServiceRequests?.forEach((sr: any) => {
      priorityTasks.push({
        id: sr.id,
        title: sr.title || 'Service Request',
        source: 'GC',
        priority: 'CRITICAL',
        dueTime: sr.dueDate?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedEffort: 30,
      })
    })

    // Get high priority permits
    const highPriorityPermits = await prismaAny.permitApplication?.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['REVISION_REQUIRED', 'UNDER_REVIEW'] },
      },
      take: 3,
      orderBy: { createdAt: 'asc' },
    }).catch(() => [])

    highPriorityPermits?.forEach((perm: any) => {
      priorityTasks.push({
        id: perm.id,
        title: `Permit: ${perm.permitType || 'Application'}`,
        source: 'Permit',
        priority: 'HIGH',
        dueTime: perm.expiresAt?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedEffort: 45,
      })
    })

    // Get homeowner project tasks
    const projectTasks = await prismaAny.task.findMany({
      where: {
        assignedTo: userId,
        status: { in: ['pending', 'in_progress'] },
        priority: 'high',
        dueDate: {
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in next 3 days
        },
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
    })

    projectTasks.forEach((task: any) => {
      priorityTasks.push({
        id: task.id,
        title: task.title,
        source: 'Homeowner',
        priority: 'HIGH',
        dueTime: task.dueDate?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedEffort: task.estimatedTime || 30,
      })
    })

    // Sort by priority and due time
    priorityTasks.sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime()
    })

    return {
      productivityScore,
      activeHoursToday,
      focusTimeRemaining,
      complianceScore: {
        sopAdherence,
        gateCompliance,
        auditScore,
      },
      workload: {
        gcProjects: gcProjects || 0,
        homeownerProjects: homeownerProjects || 0,
        permitsPending: permitsPending || 0,
        escrowReleases: escrowReleases || 0,
      },
      priorityTasks: priorityTasks.slice(0, 10), // Top 10 priority tasks
    }
  },
}

