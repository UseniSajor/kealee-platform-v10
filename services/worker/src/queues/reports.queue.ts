import { BaseQueue, BaseJobData } from './base.queue'
import { ReportJobData } from '../types/report.types'

/**
 * Report generation queue for creating PDF reports
 */
export class ReportsQueue extends BaseQueue<ReportJobData> {
  constructor() {
    super('reports', {
      defaultJobOptions: {
        attempts: 3, // Report generation can be retried
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay
        },
        removeOnComplete: {
          age: 90 * 24 * 3600, // Keep completed reports for 90 days
          count: 10000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed reports for 7 days
        },
      },
    })
  }

  /**
   * Add a report generation job to the queue
   */
  async generateReport(data: ReportJobData) {
    return this.add('generate-report', data, {
      priority: data.metadata?.priority || 0,
    })
  }

  /**
   * Generate a weekly summary report
   */
  async generateWeeklySummary(
    data: Record<string, any>,
    options?: Partial<ReportJobData>
  ) {
    return this.generateReport({
      type: 'weekly_summary',
      title: 'Weekly Summary Report',
      data,
      format: 'pdf',
      options: {
        includeCharts: true,
        includeTables: true,
        pageSize: 'A4',
        orientation: 'portrait',
      },
      ...options,
    })
  }

  /**
   * Generate a project status report
   */
  async generateProjectStatus(
    data: Record<string, any>,
    options?: Partial<ReportJobData>
  ) {
    return this.generateReport({
      type: 'project_status',
      title: 'Project Status Report',
      data,
      format: 'pdf',
      options: {
        includeCharts: true,
        includeTables: true,
        pageSize: 'A4',
        orientation: 'portrait',
      },
      ...options,
    })
  }
}

// Singleton instance
export const reportsQueue = new ReportsQueue()
