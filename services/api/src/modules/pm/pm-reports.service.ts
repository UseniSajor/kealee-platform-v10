/**
 * PM Reports Service
 * Handles project, schedule, budget, and safety report generation
 */
import { prismaAny } from '../../utils/prisma-helper'

class ReportService {
  async getProjectReport(projectId: string) {
    const project = await prismaAny.project.findUnique({ where: { id: projectId } })
    if (!project) throw new Error('Project not found')

    const [
      rfiStats,
      submittalStats,
      changeOrderStats,
      scheduleItems,
      budgetLines,
      safetyIncidents,
      dailyLogCount,
    ] = await Promise.all([
      prismaAny.rFI.groupBy({ by: ['status'], where: { projectId }, _count: true }),
      prismaAny.submittal.groupBy({ by: ['status'], where: { projectId }, _count: true }),
      prismaAny.changeOrder.groupBy({ by: ['status'], where: { projectId }, _count: true }),
      prismaAny.scheduleItem.findMany({ where: { projectId } }),
      prismaAny.budgetLine.findMany({ where: { projectId } }),
      prismaAny.safetyIncident.findMany({ where: { projectId } }),
      prismaAny.dailyLog.count({ where: { projectId } }),
    ])

    const toStatusMap = (groups: any[]) =>
      groups.reduce((acc: any, g: any) => ({ ...acc, [g.status]: g._count }), {})

    // Schedule metrics
    const totalTasks = scheduleItems.length
    const completedTasks = scheduleItems.filter((t: any) => t.status === 'COMPLETED').length
    const avgProgress = totalTasks > 0
      ? scheduleItems.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / totalTasks
      : 0

    // Budget metrics
    const totalBudget = budgetLines.reduce((sum: number, l: any) => sum + (parseFloat(l.budgetAmount) || 0), 0)
    const totalActual = budgetLines.reduce((sum: number, l: any) => sum + (parseFloat(l.actualAmount) || 0), 0)
    const totalCommitted = budgetLines.reduce((sum: number, l: any) => sum + (parseFloat(l.committedAmount) || 0), 0)

    // Safety metrics
    const totalIncidents = safetyIncidents.length
    const openIncidents = safetyIncidents.filter((i: any) => i.status !== 'CLOSED').length

    return {
      project: { id: project.id, name: project.name, status: project.status },
      generatedAt: new Date().toISOString(),
      rfis: toStatusMap(rfiStats),
      submittals: toStatusMap(submittalStats),
      changeOrders: toStatusMap(changeOrderStats),
      schedule: {
        totalTasks,
        completedTasks,
        averageProgress: Math.round(avgProgress * 100) / 100,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 10000) / 100 : 0,
      },
      budget: {
        total: totalBudget,
        actual: totalActual,
        committed: totalCommitted,
        variance: totalBudget - totalActual,
        variancePercent: totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget) * 100 : 0,
      },
      safety: {
        totalIncidents,
        openIncidents,
      },
      dailyLogs: dailyLogCount,
    }
  }

  async getScheduleReport(projectId: string) {
    const project = await prismaAny.project.findUnique({ where: { id: projectId } })
    if (!project) throw new Error('Project not found')

    const items = await prismaAny.scheduleItem.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    })

    const now = new Date()

    const report = items.map((item: any) => {
      const startDate = new Date(item.startDate)
      const endDate = item.endDate ? new Date(item.endDate) : null
      const progress = item.progress || 0

      // Calculate expected progress based on elapsed time
      let expectedProgress = 0
      let varianceStatus = 'ON_TRACK'

      if (endDate && startDate < now) {
        const totalDuration = endDate.getTime() - startDate.getTime()
        const elapsed = Math.min(now.getTime() - startDate.getTime(), totalDuration)
        expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 100

        if (progress < expectedProgress - 10) {
          varianceStatus = 'BEHIND'
        } else if (progress > expectedProgress + 10) {
          varianceStatus = 'AHEAD'
        }
      }

      if (item.status === 'COMPLETED') {
        varianceStatus = 'COMPLETED'
      }

      return {
        id: item.id,
        title: item.title,
        trade: item.trade,
        startDate: item.startDate,
        endDate: item.endDate,
        progress,
        expectedProgress: Math.round(expectedProgress * 100) / 100,
        varianceStatus,
        criticalPath: item.criticalPath || false,
        milestone: item.milestone || false,
        status: item.status,
      }
    })

    const behind = report.filter((r: any) => r.varianceStatus === 'BEHIND').length
    const ahead = report.filter((r: any) => r.varianceStatus === 'AHEAD').length
    const onTrack = report.filter((r: any) => r.varianceStatus === 'ON_TRACK').length
    const completed = report.filter((r: any) => r.varianceStatus === 'COMPLETED').length

    return {
      projectId,
      generatedAt: new Date().toISOString(),
      summary: { total: report.length, behind, ahead, onTrack, completed },
      items: report,
    }
  }

  async getBudgetReport(projectId: string) {
    const project = await prismaAny.project.findUnique({ where: { id: projectId } })
    if (!project) throw new Error('Project not found')

    const lines = await prismaAny.budgetLine.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    })

    const entries = await prismaAny.budgetEntry.findMany({
      where: { budgetLine: { projectId } },
      include: { budgetLine: { select: { id: true, name: true, category: true } } },
      orderBy: { date: 'desc' },
    })

    // Group entries by category
    const byCategory: Record<string, { budget: number; actual: number; committed: number }> = {}
    for (const line of lines) {
      const cat = (line as any).category || 'Uncategorized'
      if (!byCategory[cat]) byCategory[cat] = { budget: 0, actual: 0, committed: 0 }
      byCategory[cat].budget += parseFloat((line as any).budgetAmount) || 0
      byCategory[cat].actual += parseFloat((line as any).actualAmount) || 0
      byCategory[cat].committed += parseFloat((line as any).committedAmount) || 0
    }

    const categories = Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data,
      variance: data.budget - data.actual,
      variancePercent: data.budget > 0 ? ((data.budget - data.actual) / data.budget) * 100 : 0,
    }))

    const totalBudget = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.budgetAmount) || 0), 0)
    const totalActual = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.actualAmount) || 0), 0)
    const totalCommitted = lines.reduce((sum: number, l: any) => sum + (parseFloat(l.committedAmount) || 0), 0)

    return {
      projectId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalBudget,
        totalActual,
        totalCommitted,
        totalVariance: totalBudget - totalActual,
        variancePercent: totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget) * 100 : 0,
        lineCount: lines.length,
        entryCount: entries.length,
      },
      categories,
      lines: lines.map((line: any) => ({
        id: line.id,
        code: line.code,
        name: line.name,
        category: line.category,
        budgetAmount: parseFloat(line.budgetAmount) || 0,
        actualAmount: parseFloat(line.actualAmount) || 0,
        committedAmount: parseFloat(line.committedAmount) || 0,
        variance: (parseFloat(line.budgetAmount) || 0) - (parseFloat(line.actualAmount) || 0),
        status: line.status,
      })),
    }
  }

  async getSafetyReport(projectId: string) {
    const project = await prismaAny.project.findUnique({ where: { id: projectId } })
    if (!project) throw new Error('Project not found')

    const incidents = await prismaAny.safetyIncident.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    })

    // Count by severity
    const bySeverity: Record<string, number> = {}
    for (const incident of incidents) {
      const severity = (incident as any).severity || 'UNKNOWN'
      bySeverity[severity] = (bySeverity[severity] || 0) + 1
    }

    // Days since last incident
    const lastIncident = incidents.length > 0 ? incidents[0] : null
    const daysSinceLastIncident = lastIncident
      ? Math.floor((Date.now() - new Date((lastIncident as any).date).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // OSHA recordable count
    const oshaRecordable = incidents.filter((i: any) => i.oshaRecordable).length

    // Toolbox talks
    let toolboxTalks: any[] = []
    let toolboxAttendance = 0
    try {
      toolboxTalks = await prismaAny.toolboxTalk.findMany({
        where: { projectId },
        orderBy: { date: 'desc' },
      })
      toolboxAttendance = toolboxTalks.reduce(
        (sum: number, t: any) => sum + (Array.isArray(t.attendees) ? t.attendees.length : 0),
        0
      )
    } catch {
      // toolboxTalk model may not exist yet
    }

    const openIncidents = incidents.filter((i: any) => i.status !== 'CLOSED').length

    return {
      projectId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalIncidents: incidents.length,
        openIncidents,
        oshaRecordable,
        daysSinceLastIncident,
      },
      bySeverity,
      toolboxTalks: {
        total: toolboxTalks.length,
        totalAttendance: toolboxAttendance,
      },
      recentIncidents: incidents.slice(0, 10).map((i: any) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        date: i.date,
        status: i.status,
        oshaRecordable: i.oshaRecordable,
      })),
    }
  }

  async generate(projectId: string, type: string) {
    switch (type) {
      case 'project':
        return this.getProjectReport(projectId)
      case 'schedule':
        return this.getScheduleReport(projectId)
      case 'budget':
        return this.getBudgetReport(projectId)
      case 'safety':
        return this.getSafetyReport(projectId)
      default:
        throw new Error(`Unknown report type: ${type}`)
    }
  }
}

export const reportService = new ReportService()
