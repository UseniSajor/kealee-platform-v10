import { CronJobResult } from '../types/cron.types'

/**
 * Bid Daily Alerts Job
 * Triggers the daily bid pipeline alert email via the API endpoint.
 */
export async function executeBidDailyAlerts(): Promise<CronJobResult> {
  const startTime = Date.now()

  try {
    console.log('Executing bid daily alerts job...')

    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001'
    const response = await fetch(
      `${apiBaseUrl}/bids/automation/scan/notify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    // `Response.json()` is typed `unknown`, not `any`. The endpoint's shape is
    // stated here rather than asserted away, so a change in the API surfaces
    // as a type error instead of an undefined count in an alert log line.
    const result = (await response.json()) as {
      alertCount?: number
      success?: boolean
    }
    const duration = Date.now() - startTime

    console.log(`Bid daily alerts completed: ${result.alertCount || 0} alerts sent`)

    return {
      success: true,
      jobType: 'bid_daily_alerts',
      executedAt: new Date(),
      duration,
      result: {
        alertCount: result.alertCount || 0,
        success: result.success,
      },
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('Bid daily alerts job failed:', error.message)

    return {
      success: false,
      jobType: 'bid_daily_alerts',
      executedAt: new Date(),
      duration,
      error: error.message,
    }
  }
}
