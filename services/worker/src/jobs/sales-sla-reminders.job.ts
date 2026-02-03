import { CronJobResult } from '../types/cron.types'

/**
 * Sales SLA reminders cron job
 * Finds SalesTasks with slaDueAt within next 2 hours and status not DONE/CANCELLED
 * Queues reminder jobs for each task
 *
 * NOTE: This job is temporarily stubbed as the SalesTask model
 * is not yet implemented in the Prisma schema.
 */
export async function executeSalesSlaReminders(): Promise<CronJobResult> {
  const startTime = Date.now()

  console.log('📧 Sales SLA reminders job - feature not yet implemented')

  return {
    success: true,
    jobType: 'sales_sla_reminders',
    executedAt: new Date(),
    duration: Date.now() - startTime,
    result: { tasksProcessed: 0, message: 'Feature not yet implemented - SalesTask model pending' },
  }
}
