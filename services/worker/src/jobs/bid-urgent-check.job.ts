import { prisma } from '@kealee/database'
import { CronJobResult } from '../types/cron.types'

const prismaAny = prisma as any

/**
 * Bid Urgent Check Job
 * Finds bids due within 48 hours and sends urgent alerts via the API.
 */
export async function executeBidUrgentCheck(): Promise<CronJobResult> {
  const startTime = Date.now()

  try {
    console.log('Executing bid urgent check job...')

    const now = new Date()
    const fortyEightHours = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    // Find bids due within 48 hours that are still active
    const urgentBids = await prismaAny.bidOpportunity.findMany({
      where: {
        status: { in: ['NEW', 'REVIEWING', 'PREPARING'] },
        dueDate: { lte: fortyEightHours, gte: now },
      },
      select: { id: true, projectName: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
    })

    if (urgentBids.length === 0) {
      const duration = Date.now() - startTime
      console.log('No urgent bids found')
      return {
        success: true,
        jobType: 'bid_urgent_check',
        executedAt: new Date(),
        duration,
        result: { urgentCount: 0, notified: 0 },
      }
    }

    console.log(`Found ${urgentBids.length} urgent bid(s)`)

    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001'
    let notified = 0
    let errors = 0

    for (const bid of urgentBids) {
      try {
        const response = await fetch(
          `${apiBaseUrl}/bids/automation/scan/urgent-notify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bidId: bid.id }),
          }
        )

        if (response.ok) {
          notified++
          console.log(`Urgent alert sent for: ${bid.projectName}`)
        } else {
          errors++
          console.error(`Failed to send urgent alert for ${bid.projectName}: ${response.status}`)
        }
      } catch (err: any) {
        errors++
        console.error(`Error sending urgent alert for ${bid.projectName}:`, err.message)
      }
    }

    const duration = Date.now() - startTime
    console.log(`Bid urgent check completed: ${notified} notified, ${errors} errors`)

    return {
      success: errors === 0,
      jobType: 'bid_urgent_check',
      executedAt: new Date(),
      duration,
      result: {
        urgentCount: urgentBids.length,
        notified,
        errors,
      },
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('Bid urgent check job failed:', error.message)

    return {
      success: false,
      jobType: 'bid_urgent_check',
      executedAt: new Date(),
      duration,
      error: error.message,
    }
  }
}
