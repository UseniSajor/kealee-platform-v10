/**
 * Report Generator
 * Generates reports from completed tasks with AI enhancement
 */

import { prisma } from '@kealee/database'
import { reportsQueue } from '../queues/reports.queue'
import { mlQueue } from '../queues/ml.queue'
import { emailQueue } from '../queues/email.queue'

export interface GCWeeklyReport {
  gcId: string
  weekStart: Date
  weekEnd: Date
  summary: string
  hoursUtilized: number
  keyAccomplishments: string[]
  pendingItems: Array<{
    id: string
    title: string
    priority: string
    dueDate?: Date
  }>
  permitUpdates: Array<{
    permitId: string
    projectId: string
    status: string
    update: string
  }>
  recommendations: string[]
  generatedAt: Date
}

export interface HomeownerUpdate {
  projectId: string
  update: string
  photos: Array<{
    id: string
    url: string
    caption?: string
    takenAt: Date
  }>
  timelineUpdate: {
    originalEndDate?: Date
    projectedEndDate: Date
    status: string
    progress: number
  }
  nextSteps: Array<{
    id: string
    title: string
    description: string
    estimatedDate: Date
  }>
  questions: Array<{
    id: string
    question: string
    context: string
  }>
  generatedAt: Date
}

export class ReportGenerator {
  /**
   * Generate GC weekly report (for m-ops-services)
   */
  async generateGCWeeklyReport(gcId: string): Promise<GCWeeklyReport> {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const weekEnd = new Date(now)

    // Get completed tasks for GC in the last week
    const weekTasks = await this.getCompletedTasksForGC(gcId, 'last_week')

    // Get project updates
    const projectUpdates = await this.getProjectUpdates(gcId)

    // Get permit statuses
    const permitStatuses = await this.getPermitStatuses(gcId)

    // Calculate hours utilized
    const hoursUtilized = this.calculateHours(weekTasks)

    // Extract accomplishments
    const keyAccomplishments = this.extractAccomplishments(weekTasks)

    // Get pending tasks
    const pendingItems = await this.getPendingTasks(gcId)

    // Generate AI summary
    const summary = await this.generateAISummary(weekTasks, projectUpdates)

    // Generate AI recommendations
    const recommendations = await this.generateAIRecommendations(gcId, weekTasks, pendingItems)

    const report: GCWeeklyReport = {
      gcId,
      weekStart,
      weekEnd,
      summary,
      hoursUtilized,
      keyAccomplishments,
      pendingItems,
      permitUpdates: permitStatuses,
      recommendations,
      generatedAt: new Date(),
    }

    // Save and email report
    await this.saveReport(report, 'GC_WEEKLY')
    await this.emailGC(gcId, report)

    return report
  }

  /**
   * Generate homeowner update
   */
  async generateHomeownerUpdate(projectId: string): Promise<HomeownerUpdate> {
    // Get recent project activity
    const activity = await this.getProjectActivity(projectId, 'last_3_days')

    // Get recent photos
    const photos = await this.getRecentPhotos(projectId)

    // Get next milestones
    const nextSteps = await this.getNextMilestones(projectId)

    // Generate timeline update
    const timelineUpdate = await this.generateTimelineUpdate(projectId)

    // Generate questions for homeowner
    const questions = await this.generateQuestionsForHomeowner(projectId, activity)

    // Generate update text
    const updateText = await this.generateUpdateText(activity, timelineUpdate)

    const update: HomeownerUpdate = {
      projectId,
      update: updateText,
      photos,
      timelineUpdate,
      nextSteps,
      questions,
      generatedAt: new Date(),
    }

    // Save and email update
    await this.saveReport(update, 'HOMEOWNER_UPDATE')
    await this.emailHomeowner(projectId, update)

    return update
  }

  /**
   * Get completed tasks for GC
   */
  private async getCompletedTasksForGC(gcId: string, period: 'last_week' | 'last_month'): Promise<any[]> {
    const now = new Date()
    const startDate = new Date(now)
    if (period === 'last_week') {
      startDate.setDate(now.getDate() - 7)
    } else {
      startDate.setMonth(now.getMonth() - 1)
    }

    // Get tasks completed by assignee
    const tasks = await prisma.task?.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: now,
        },
        assignedTo: gcId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    }).catch(() => [])

    return tasks || []
  }

  /**
   * Get project updates
   */
  private async getProjectUpdates(gcId: string): Promise<any[]> {
    // Get projects for this GC (as PM)
    const projects = await prisma.project?.findMany({
      where: {
        pmId: gcId,
        status: {
          in: ['PLANNING', 'ACTIVE', 'IN_PROGRESS'],
        },
      },
      include: {
        contracts: true,
      },
    }).catch(() => [])

    return projects || []
  }

  /**
   * Get permit statuses
   */
  private async getPermitStatuses(gcId: string): Promise<GCWeeklyReport['permitUpdates']> {
    // Get permits for GC's projects
    const permits = await prisma.permit?.findMany({
      where: {
        project: {
          pmId: gcId,
        },
        status: {
          in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ISSUED', 'REJECTED'],
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }).catch(() => [])

    return (permits || []).map((permit: any) => ({
      permitId: permit.id,
      projectId: permit.projectId,
      status: permit.status,
      update: `Permit ${permit.status.toLowerCase()}`,
    }))
  }

  /**
   * Calculate hours from tasks
   */
  private calculateHours(tasks: any[]): number {
    // Estimate hours based on task completion
    // In a real system, this would track actual time spent
    return tasks.length * 2 // Assume 2 hours per task on average
  }

  /**
   * Extract accomplishments from tasks
   */
  private extractAccomplishments(tasks: any[]): string[] {
    return tasks
      .filter((task) => task.status === 'COMPLETED')
      .map((task) => task.title)
      .slice(0, 10) // Top 10 accomplishments
  }

  /**
   * Get pending tasks
   */
  private async getPendingTasks(gcId: string): Promise<GCWeeklyReport['pendingItems']> {
    const tasks = await prisma.task?.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        assignedTo: gcId,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 20,
    }).catch(() => [])

    return (tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate || undefined,
    }))
  }

  /**
   * Generate AI summary using Claude
   */
  private async generateAISummary(tasks: any[], projectUpdates: any[]): Promise<string> {
    const context = {
      tasksCompleted: tasks.length,
      projectsActive: projectUpdates.length,
      taskTitles: tasks.map((t: any) => t.title).slice(0, 10),
    }

    const prompt = `Generate a professional weekly summary for a General Contractor based on:
- Tasks completed: ${context.tasksCompleted}
- Active projects: ${context.projectsActive}
- Key tasks: ${context.taskTitles.join(', ')}

Write a concise, professional summary (2-3 paragraphs) highlighting key accomplishments and progress.`

    try {
      await mlQueue.processMLJob({
        type: 'summarize',
        prompt,
        systemPrompt: 'You are a professional construction project manager writing weekly reports.',
        metadata: {
          eventType: 'gc_weekly_report_summary',
        },
      })

      // Return placeholder summary
      return `This week, ${context.tasksCompleted} tasks were completed across ${context.projectsActive} active projects. Key accomplishments include ${context.taskTitles.slice(0, 3).join(', ')}.`
    } catch (error) {
      console.error('Failed to generate AI summary:', error)
      return `This week, ${context.tasksCompleted} tasks were completed across ${context.projectsActive} active projects.`
    }
  }

  /**
   * Generate AI recommendations
   */
  private async generateAIRecommendations(
    gcId: string,
    tasks: any[],
    pendingItems: any[]
  ): Promise<string[]> {
    const context = {
      tasksCompleted: tasks.length,
      pendingCount: pendingItems.length,
      pendingTitles: pendingItems.map((p) => p.title).slice(0, 5),
    }

    const prompt = `Based on completed tasks (${context.tasksCompleted}) and pending items (${context.pendingCount}), provide 3-5 actionable recommendations for the General Contractor.

Pending items: ${context.pendingTitles.join(', ')}

Provide specific, actionable recommendations.`

    try {
      await mlQueue.processMLJob({
        type: 'generate_recommendation',
        prompt,
        systemPrompt: 'You are a construction project management advisor providing actionable recommendations.',
        metadata: {
          eventType: 'gc_weekly_report_recommendations',
        },
      })

      // Return placeholder recommendations
      return [
        'Prioritize pending permit applications to avoid delays',
        'Schedule site visits for projects entering construction phase',
        'Review contractor availability for upcoming milestones',
      ]
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error)
      return ['Review pending tasks and prioritize based on due dates']
    }
  }

  /**
   * Get project activity
   */
  private async getProjectActivity(projectId: string, period: 'last_3_days' | 'last_week'): Promise<any[]> {
    const now = new Date()
    const startDate = new Date(now)
    if (period === 'last_3_days') {
      startDate.setDate(now.getDate() - 3)
    } else {
      startDate.setDate(now.getDate() - 7)
    }

    // Get activity logs for project
    const activity = await prisma.activityLog?.findMany({
      where: {
        entityType: 'PROJECT',
        entityId: projectId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    }).catch(() => [])

    return activity || []
  }

  /**
   * Get recent photos
   */
  private async getRecentPhotos(projectId: string): Promise<HomeownerUpdate['photos']> {
    // Get photos for project
    const photos = await prisma.photo?.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }).catch(() => [])

    return (photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      caption: photo.caption || undefined,
      takenAt: photo.takenAt || photo.createdAt,
    }))
  }

  /**
   * Get next milestones
   */
  private async getNextMilestones(projectId: string): Promise<HomeownerUpdate['nextSteps']> {
    // Get upcoming tasks for project
    const tasks = await prisma.task?.findMany({
      where: {
        projectId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    }).catch(() => [])

    return (tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      estimatedDate: task.dueDate || new Date(),
    }))
  }

  /**
   * Generate timeline update
   */
  private async generateTimelineUpdate(projectId: string): Promise<HomeownerUpdate['timelineUpdate']> {
    const project = await prisma.project?.findUnique({
      where: { id: projectId },
    }).catch(() => null)

    if (!project) {
      return {
        projectedEndDate: new Date(),
        status: 'UNKNOWN',
        progress: 0,
      }
    }

    // Calculate progress based on status
    const progressMap: Record<string, number> = {
      PLANNING: 10,
      ACTIVE: 30,
      IN_PROGRESS: 50,
      CONSTRUCTION: 60,
      COMPLETED: 100,
    }

    return {
      originalEndDate: project.scheduledEndDate || undefined,
      projectedEndDate: project.projectedEndDate || project.scheduledEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: project.status,
      progress: progressMap[project.status] || 0,
    }
  }

  /**
   * Generate questions for homeowner
   */
  private async generateQuestionsForHomeowner(
    projectId: string,
    activity: any[]
  ): Promise<HomeownerUpdate['questions']> {
    const prompt = `Based on recent project activity (${activity.length} events), generate 2-3 relevant questions to ask the homeowner about their project preferences or decisions needed.`

    try {
      await mlQueue.processMLJob({
        type: 'generate_recommendation',
        prompt,
        systemPrompt: 'You are a project manager generating helpful questions for homeowners.',
        metadata: {
          eventType: 'homeowner_update_questions',
        },
      })

      // Return placeholder questions
      return [
        {
          id: 'q1',
          question: 'Do you have any preferences for the next phase?',
          context: 'Upcoming milestone requires homeowner input',
        },
        {
          id: 'q2',
          question: 'Are there any concerns about the current timeline?',
          context: 'Project is on track, checking for concerns',
        },
      ]
    } catch (error) {
      console.error('Failed to generate questions:', error)
      return []
    }
  }

  /**
   * Generate update text
   */
  private async generateUpdateText(activity: any[], timelineUpdate: any): Promise<string> {
    return `Here's what happened on your project this week:

- ${activity.length} activities completed
- Project status: ${timelineUpdate.status}
- Progress: ${timelineUpdate.progress}%
- Projected completion: ${timelineUpdate.projectedEndDate.toLocaleDateString()}

We're making great progress and will keep you updated on next steps.`
  }

  /**
   * Save report to database
   */
  private async saveReport(report: GCWeeklyReport | HomeownerUpdate, type: string): Promise<void> {
    // Queue a report generation job
    await reportsQueue.generateReport({
      type: type === 'GC_WEEKLY' ? 'weekly_summary' : 'project_status',
      title: type === 'GC_WEEKLY' ? 'GC Weekly Report' : 'Homeowner Status Update',
      data: report,
      format: 'pdf',
      metadata: {
        reportType: type,
        generatedAt: new Date(),
      },
    })
  }

  /**
   * Email GC with report
   */
  private async emailGC(gcId: string, report: GCWeeklyReport): Promise<void> {
    const gc = await prisma.user?.findUnique({
      where: { id: gcId },
    }).catch(() => null)

    if (!gc || !gc.email) {
      console.warn(`GC ${gcId} not found or has no email`)
      return
    }

    await emailQueue.sendEmail({
      to: gc.email,
      subject: `Weekly Report - ${report.weekStart.toLocaleDateString()} to ${report.weekEnd.toLocaleDateString()}`,
      html: `
        <h1>Weekly Report</h1>
        <p>${report.summary}</p>
        <h2>Key Accomplishments</h2>
        <ul>
          ${report.keyAccomplishments.map((a) => `<li>${a}</li>`).join('')}
        </ul>
        <h2>Hours Utilized</h2>
        <p>${report.hoursUtilized} hours</p>
        <h2>Recommendations</h2>
        <ul>
          ${report.recommendations.map((r) => `<li>${r}</li>`).join('')}
        </ul>
      `,
      text: `Weekly Report\n\n${report.summary}\n\nHours: ${report.hoursUtilized}\n\nAccomplishments:\n${report.keyAccomplishments.join('\n')}`,
      metadata: {
        eventType: 'gc_weekly_report',
        gcId,
      },
    })
  }

  /**
   * Email homeowner with update
   */
  private async emailHomeowner(projectId: string, update: HomeownerUpdate): Promise<void> {
    const project = await prisma.project?.findUnique({
      where: { id: projectId },
      include: {
        client: true,
      },
    }).catch(() => null)

    if (!project || !project.client?.email) {
      console.warn(`Project ${projectId} not found or client has no email`)
      return
    }

    await emailQueue.sendEmail({
      to: project.client.email,
      subject: `Project Update: ${project.name}`,
      html: `
        <h1>Project Update</h1>
        <p>${update.update}</p>
        <h2>Timeline</h2>
        <p>Status: ${update.timelineUpdate.status}</p>
        <p>Progress: ${update.timelineUpdate.progress}%</p>
        <p>Projected Completion: ${update.timelineUpdate.projectedEndDate.toLocaleDateString()}</p>
        <h2>Next Steps</h2>
        <ul>
          ${update.nextSteps.map((step) => `<li><strong>${step.title}</strong>: ${step.description}</li>`).join('')}
        </ul>
        ${update.questions.length > 0 ? `
          <h2>Questions for You</h2>
          <ul>
            ${update.questions.map((q) => `<li><strong>${q.question}</strong><br>${q.context}</li>`).join('')}
          </ul>
        ` : ''}
      `,
      text: `Project Update\n\n${update.update}\n\nTimeline: ${update.timelineUpdate.status} - ${update.timelineUpdate.progress}%\n\nNext Steps:\n${update.nextSteps.map((s) => `- ${s.title}`).join('\n')}`,
      metadata: {
        eventType: 'homeowner_update',
        projectId,
      },
    })
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator()
