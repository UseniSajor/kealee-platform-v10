/**
 * Report job data types
 */

export type ReportType =
  | 'weekly_summary'
  | 'project_status'
  | 'financial_summary'
  | 'performance_report'
  | 'custom'

export interface ReportJobData {
  type: ReportType
  title: string
  data: Record<string, any> // Report data to include
  template?: string // Template name or path
  format?: 'pdf' | 'html' | 'csv' // Output format (default: pdf)
  options?: {
    includeCharts?: boolean
    includeTables?: boolean
    pageSize?: 'A4' | 'Letter' | 'Legal'
    orientation?: 'portrait' | 'landscape'
    margins?: {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }
  }
  metadata?: {
    userId?: string
    orgId?: string
    projectId?: string
    reportId?: string
    generatedAt?: Date
    [key: string]: any
  }
}

export interface ReportResult {
  success: boolean
  filePath?: string
  fileUrl?: string
  fileSize?: number // bytes
  format?: string
  pages?: number
  error?: string
  generatedAt?: Date
}

/**
 * Common report templates
 */
export const REPORT_TEMPLATES = {
  weeklySummary: (data: Record<string, any>): Partial<ReportJobData> => ({
    type: 'weekly_summary',
    title: 'Weekly Summary Report',
    data,
    options: {
      includeCharts: true,
      includeTables: true,
      pageSize: 'A4',
      orientation: 'portrait',
    },
  }),

  projectStatus: (data: Record<string, any>): Partial<ReportJobData> => ({
    type: 'project_status',
    title: 'Project Status Report',
    data,
    options: {
      includeCharts: true,
      includeTables: true,
      pageSize: 'A4',
      orientation: 'portrait',
    },
  }),

  financialSummary: (data: Record<string, any>): Partial<ReportJobData> => ({
    type: 'financial_summary',
    title: 'Financial Summary Report',
    data,
    options: {
      includeCharts: true,
      includeTables: true,
      pageSize: 'A4',
      orientation: 'landscape',
    },
  }),
}
