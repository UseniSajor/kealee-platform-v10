import cron from 'node-cron'
import { CRON_JOBS, CronJobConfig, CronJobResult } from '../types/cron.types'
import { executeDailyDigest } from '../jobs/daily-digest.job'
import { executeWeeklyGCReports } from '../jobs/weekly-gc-reports.job'
import { executePerformanceCalculation } from '../jobs/performance-calculation.job'
import { executeReadinessOverdueReminders } from '../jobs/readiness-reminders.job'
import { executeSalesSlaReminders } from '../jobs/sales-sla-reminders.job'
import { executeFileCleanup } from '../jobs/file-cleanup.job'
import { executeBidDailyAlerts } from '../jobs/bid-daily-alerts.job'
import { executeBidUrgentCheck } from '../jobs/bid-urgent-check.job'

/**
 * Cron job manager
 * Manages all scheduled cron jobs
 */
export class CronManager {
  private jobs: Map<
    string,
    {
      task: cron.ScheduledTask
      config: CronJobConfig
      running: boolean
    }
  > = new Map()

  /**
   * Register a cron job
   */
  registerJob(config: CronJobConfig): void {
    if (!config.enabled) {
      console.log(`⏭️ Skipping disabled cron job: ${config.name}`)
      return
    }

    // Validate cron expression
    if (!cron.validate(config.schedule)) {
      console.error(`❌ Invalid cron expression for job ${config.name}: ${config.schedule}`)
      return
    }

    // Create cron task
    const task = cron.schedule(
      config.schedule,
      async () => {
        console.log(`⏰ Executing cron job: ${config.name}`)
        try {
          let result: CronJobResult

          switch (config.type) {
            case 'daily_digest':
              result = await executeDailyDigest()
              break
            case 'weekly_gc_reports':
              result = await executeWeeklyGCReports()
              break
            case 'performance_calculation':
              result = await executePerformanceCalculation()
              break
            case 'readiness_overdue_reminders':
              result = await executeReadinessOverdueReminders()
              break
            case 'sales_sla_reminders':
              result = await executeSalesSlaReminders()
              break
            case 'file_cleanup':
              result = await executeFileCleanup()
              break
            case 'bid_daily_alerts':
              result = await executeBidDailyAlerts()
              break
            case 'bid_urgent_check':
              result = await executeBidUrgentCheck()
              break
            default:
              console.error(`❌ Unknown cron job type: ${config.type}`)
              return
          }

          if (result.success) {
            console.log(`✅ Cron job ${config.name} completed successfully`, {
              duration: result.duration ? `${result.duration}ms` : 'N/A',
            })
          } else {
            console.error(`❌ Cron job ${config.name} failed:`, result.error)
          }
        } catch (error: unknown) {
          console.error(`❌ Error executing cron job ${config.name}:`, error)
        }
      },
      {
        scheduled: true,
        timezone: config.timezone || 'UTC',
      }
    )

    this.jobs.set(config.name, { task, config, running: true })
    console.log(`✅ Registered cron job: ${config.name} (${config.schedule})`)
  }

  /**
   * Register all predefined cron jobs
   */
  registerAllJobs(): void {
    console.log('📅 Registering cron jobs...')

    // Register daily digest
    this.registerJob(CRON_JOBS.dailyDigest)

    // Register weekly GC reports
    this.registerJob(CRON_JOBS.weeklyGCReports)

    // Register performance calculation
    this.registerJob(CRON_JOBS.performanceCalculation)

    // Register readiness overdue reminders
    this.registerJob(CRON_JOBS.readinessOverdueReminders)

    // Register sales SLA reminders
    this.registerJob(CRON_JOBS.salesSlaReminders)

    // Register file cleanup
    this.registerJob(CRON_JOBS.fileCleanup)

    // Register bid pipeline jobs
    this.registerJob(CRON_JOBS.bidDailyAlerts)
    this.registerJob(CRON_JOBS.bidUrgentCheck)

    console.log(`✅ Registered ${this.jobs.size} cron jobs`)
  }

  /**
   * Start a specific cron job
   */
  startJob(name: string): void {
    const job = this.jobs.get(name)
    if (job) {
      job.task.start()
      job.running = true
      console.log(`▶️ Started cron job: ${name}`)
    } else {
      console.error(`❌ Cron job not found: ${name}`)
    }
  }

  /**
   * Stop a specific cron job
   */
  stopJob(name: string): void {
    const job = this.jobs.get(name)
    if (job) {
      job.task.stop()
      job.running = false
      console.log(`⏸️ Stopped cron job: ${name}`)
    } else {
      console.error(`❌ Cron job not found: ${name}`)
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs(): void {
    console.log('⏸️ Stopping all cron jobs...')
    this.jobs.forEach((job, name) => {
      job.task.stop()
      job.running = false
      console.log(`⏸️ Stopped cron job: ${name}`)
    })
  }

  /**
   * Get status of all cron jobs
   */
  getStatus(): Array<{ name: string; running: boolean; schedule: string }> {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: job.running,
      schedule: job.config.schedule,
    }))
  }
}

// Singleton instance
export const cronManager = new CronManager()
