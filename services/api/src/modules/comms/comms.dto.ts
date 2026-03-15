/**
 * comms.dto.ts — Unified Communications Layer DTOs
 * In-app inbox, notification preferences, channel routing.
 */
import { z } from 'zod'

export const NotificationChannelEnum = z.enum(['IN_APP', 'EMAIL', 'SMS'])

export const NotificationEventEnum = z.enum([
  // Project lifecycle
  'PROJECT_CREATED',
  'READINESS_ADVANCED',
  'PHASE_CHANGED',
  // Engagement
  'CONTRACT_SIGNED',
  'MILESTONE_SUBMITTED',
  'MILESTONE_APPROVED',
  'MILESTONE_PAID',
  'CHANGE_ORDER_CREATED',
  'CHANGE_ORDER_APPROVED',
  'CHANGE_ORDER_REJECTED',
  // Disputes
  'DISPUTE_OPENED',
  'DISPUTE_RESOLVED',
  // PM
  'RFI_CREATED',
  'RFI_ANSWERED',
  'SUBMITTAL_CREATED',
  'SUBMITTAL_APPROVED',
  'INSPECTION_SCHEDULED',
  'INSPECTION_COMPLETED',
  'DAILY_LOG_CREATED',
  // Leads
  'LEAD_ASSIGNED',
  'LEAD_ACCEPTED',
  'LEAD_DECLINED',
  // General
  'DOCUMENT_UPLOADED',
  'MESSAGE_RECEIVED',
  'SYSTEM_ALERT',
])

export const UpdateNotificationPrefsDto = z.object({
  preferences: z.array(z.object({
    event: NotificationEventEnum,
    channels: z.array(NotificationChannelEnum),
    enabled: z.boolean(),
  })),
})

export const MarkNotificationsReadDto = z.object({
  notificationIds: z.array(z.string()).min(1),
})

export const SendNotificationDto = z.object({
  userId: z.string(),
  event: NotificationEventEnum,
  title: z.string(),
  body: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  channels: z.array(NotificationChannelEnum).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface InAppNotificationDto {
  id: string
  userId: string
  event: string
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
  metadata: Record<string, unknown>
}

export interface NotificationPreferenceDto {
  event: string
  channels: string[]
  enabled: boolean
}

export interface NotificationCenterDto {
  unreadCount: number
  notifications: InAppNotificationDto[]
  total: number
}

// Inferred types
export type UpdateNotificationPrefsBody = z.infer<typeof UpdateNotificationPrefsDto>
export type MarkNotificationsReadBody = z.infer<typeof MarkNotificationsReadDto>
export type SendNotificationBody = z.infer<typeof SendNotificationDto>
