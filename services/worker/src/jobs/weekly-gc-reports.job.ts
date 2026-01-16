import { reportsQueue } from '../queues/reports.queue'
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

    // TODO: Pull real data from database:
    // - GC's projects, permits, inspections, budget
    const weekOf = startOfWeekISO(new Date())
    const reportData = {
      weekOf,
      summary:
        'Weekly portfolio summary (stub). Wire project/permit/inspection/budget sources to replace this content.',
      aiInsights: [
        'Schedule slipping by 3 days on Project X (stub insight)',
        'Budget overrun risk in electrical category (stub insight)',
        'Permit approval expected next week (stub insight)',
      ],
      metrics: {
        'Projects Active': 0,
        'Permits Pending': 0,
        'Inspections Next 7 Days': 0,
        'Budget Used': '$0',
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

