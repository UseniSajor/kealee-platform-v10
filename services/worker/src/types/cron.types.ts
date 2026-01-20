/**
 * Cron job types and interfaces
 */

export type CronJobType =
  | 'daily_digest'
  | 'weekly_gc_reports'
  | 'performance_calculation'
  | 'readiness_overdue_reminders'
  | 'sales_sla_reminders'
  | 'file_cleanup'
  | 'custom'

export interface CronJobConfig {
  name: string
  type: CronJobType
  schedule: string // Cron expression (e.g., "0 9 * * *" for daily at 9 AM)
  enabled: boolean
  timezone?: string // Timezone (default: UTC)
  metadata?: {
    description?: string
    [key: string]: any
  }
}

export interface CronJobResult {
  success: boolean
  jobType: CronJobType
  executedAt: Date
  duration?: number // milliseconds
  result?: any
  error?: string
}

/**
 * Predefined cron job configurations
 */
export const CRON_JOBS: Record<string, CronJobConfig> = {
  dailyDigest: {
    name: 'Daily Digest',
    type: 'daily_digest',
    schedule: '0 9 * * *', // Daily at 9:00 AM UTC
    enabled: true,
    timezone: 'UTC',
    metadata: {
      description: 'Generates and sends daily digest emails to users',
    },
  },
  weeklyGCReports: {
    name: 'Weekly GC Reports',
    type: 'weekly_gc_reports',
    schedule: '0 17 * * 5', // Fridays at 5:00 PM UTC
    enabled: true,
    timezone: 'UTC',
    metadata: {
      description: 'Generates and emails weekly reports to GCs (from Kealee PMs)',
    },
  },
  performanceCalculation: {
    name: 'Performance Calculation',
    type: 'performance_calculation',
    schedule: '0 0 * * *', // Daily at midnight UTC
    enabled: true,
    timezone: 'UTC',
    metadata: {
      description: 'Calculates performance metrics for projects and users',
    },
  },
  readinessOverdueReminders: {
    name: 'Readiness Overdue Reminders',
    type: 'readiness_overdue_reminders',
    schedule: '0 9 * * *', // Daily at 9:00 AM UTC
    enabled: true,
    timezone: 'UTC',
    metadata: {
      description: 'Sends email reminders for overdue readiness items',
    },
  },
  salesSlaReminders: {
    name: 'Sales SLA Reminders',
    type: 'sales_sla_reminders',
    schedule: '*/15 * * * *', // Every 15 minutes
    enabled: true,
    timezone: 'UTC',
    metadata: {
      description: 'Sends SLA reminders for sales tasks due within 2 hours',
    },
  },
  fileCleanup: {
    name: 'File Cleanup',
    type: 'file_cleanup',
    schedule: '0 2 * * *', // Daily at 2:00 AM UTC
    enabled: true,
    timezone: 'UTC',
    metadata: {
      description: 'Cleans up incomplete uploads, orphaned files, and old deleted files from S3/R2',
    },
  },
}
