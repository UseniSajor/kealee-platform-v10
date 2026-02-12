import { reportsQueue } from '../queues/reports.queue'
import { prisma } from '@kealee/database'
import { CronJobResult } from '../types/cron.types'

function startOfWeekISO(d: Date) {
  const date = new Date(d)
  const day = date.getDay() // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day // move to Monday
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function parseRecipients(): string[] {
  const raw = process.env.WEEKLY_GC_REPORT_EMAILS || process.env.GC_REPORT_EMAILS || ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Weekly GC reports cron job
 * Generates weekly reports (PDF) and emails them to GCs.
 *
 * MVP notes:
 * - Recipient selection is env-driven for now (WEEKLY_GC_REPORT_EMAILS)
 * - Data sourcing from DB (projects/permits/inspections/budget) is stubbed
 * - AI insights (Claude) are stubbed unless you wire real data + prompts
 */
export async function executeWeeklyGCReports(): Promise<CronJobResult> {
  const startTime = Date.now()

  try {
    console.log('🗓️ Starting weekly GC reports job...')

    const recipients = parseRecipients()
    if (recipients.length === 0) {
      console.log('ℹ️ No GC recipients configured (set WEEKLY_GC_REPORT_EMAILS)')
      return {
        success: true,
        jobType: 'weekly_gc_reports',
        executedAt: new Date(),
        duration: Date.now() - startTime,
        result: { reportsQueued: 0, recipients: 0 },
      }
    }

    const weekOf = startOfWeekISO(new Date())
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Pull real data from database for project stats, milestone progress, budget data
    const [projectsActive, permitsPending, inspectionsNext7Days, budgetAgg, milestoneStats] = await Promise.all([
      (prisma as any).project.count({ where: { status: 'ACTIVE' } }),
      (prisma as any).permit.count({ where: { status: 'PENDING' } }),
      (prisma as any).inspection.count({
        where: {
          scheduledDate: { gte: new Date(), lte: nextWeek },
        },
      }),
      (prisma as any).payment.aggregate({
        where: { createdAt: { gte: new Date(weekOf) } },
        _sum: { amount: true },
      }),
      (prisma as any).milestone.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ])

    const budgetUsed = Number(budgetAgg._sum?.amount || 0)
    const completedMilestones = milestoneStats.find((s: any) => s.status === 'APPROVED')?._count?.id || 0
    const totalMilestones = milestoneStats.reduce((sum: number, s: any) => sum + (s._count?.id || 0), 0)

    const reportData = {
      weekOf,
      summary: 'Weekly portfolio summary: ' + projectsActive + ' active projects, ' + permitsPending + ' permits pending, ' + inspectionsNext7Days + ' inspections in next 7 days.',
      aiInsights: [
        totalMilestones > 0
          ? completedMilestones + '/' + totalMilestones + ' milestones completed across all projects'
          : 'No milestones tracked this period',
        permitsPending > 0
          ? permitsPending + ' permit(s) pending review'
          : 'All permits are up to date',
        inspectionsNext7Days > 0
          ? inspectionsNext7Days + ' inspection(s) scheduled in the next 7 days'
          : 'No inspections scheduled for next week',
      ],
      metrics: {
        'Projects Active': projectsActive,
        'Permits Pending': permitsPending,
        'Inspections Next 7 Days': inspectionsNext7Days,
        'Budget Used': '$' + budgetUsed.toLocaleString(),
      },
    }

    const reportJob = await reportsQueue.generateReport({
      type: 'weekly_summary',
      title: `Weekly Report — Week of ${new Date(weekOf).toLocaleDateString()}`,
      data: reportData,
      format: 'pdf',
      metadata: {
        eventType: 'weekly_gc_reports',
        generatedAt: new Date(),
        emailTo: recipients,
        emailSubject: `Your weekly report is ready — week of ${new Date(weekOf).toLocaleDateString()}`,
        emailIntro:
          'Your weekly report from Kealee PMs is attached. You can review, comment, approve, and share from the portal.',
        portalPath: '/portal/weekly-reports',
        weekOf,
      },
    })

    console.log('✅ Weekly GC report queued', { jobId: reportJob.id, recipients: recipients.length })

    return {
      success: true,
      jobType: 'weekly_gc_reports',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      result: { reportsQueued: 1, recipients: recipients.length, reportJobId: reportJob.id },
    }
  } catch (error: any) {
    console.error('❌ Weekly GC reports job failed:', error)
    return {
      success: false,
      jobType: 'weekly_gc_reports',
      executedAt: new Date(),
      duration: Date.now() - startTime,
      error: error.message || 'Unknown error',
    }
  }
}
