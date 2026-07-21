/**
 * Sales queue types and interfaces
 */

export interface SalesJobData {
  type: 'sla_reminder'
  taskId: string
  leadId: string
  assignedToUserId: string
  slaDueAt: string // ISO date string
  metadata?: {
    [key: string]: any
  }
}

export interface SalesSlaReminderResult {
  success: boolean
  taskId: string
  notificationSent: boolean
  auditEventId?: string
  error?: string
  message?: string
}
