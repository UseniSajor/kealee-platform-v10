/**
 * RFI Reminder Service
 *
 * Schedules and processes automated reminders for open RFIs:
 *   - 3 days before due date: "approaching due date" notification
 *   - 1 day before due date: "due tomorrow" notification
 *   - Day of due date: "due today" notification
 *   - 1+ days overdue: "overdue" notification (daily until closed)
 *
 * Uses BullMQ repeatable jobs to scan for RFIs needing reminders.
 */

import { prismaAny } from '../../utils/prisma-helper'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RFIReminderPayload {
  rfiId: string
  projectId: string
  subject: string
  dueDate: string
  daysUntilDue: number // negative = overdue
  assignedToId?: string
  createdById: string
  priority: string
  rfiNumber?: string
}

export type ReminderType = 'APPROACHING' | 'DUE_TOMORROW' | 'DUE_TODAY' | 'OVERDUE'

export interface ReminderResult {
  processed: number
  reminders: Array<{
    rfiId: string
    type: ReminderType
    daysUntilDue: number
  }>
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const rfiReminderService = {
  /**
   * Scan all open RFIs and return those needing reminders.
   * Called by the scheduled job processor.
   */
  async scanForReminders(): Promise<ReminderResult> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Fetch all open RFIs with due dates
    const openRfis = await prismaAny.rFI.findMany({
      where: {
        status: { in: ['OPEN', 'open', 'IN_REVIEW', 'in_review'] },
        dueDate: { not: null },
      },
      select: {
        id: true,
        number: true,
        subject: true,
        dueDate: true,
        priority: true,
        projectId: true,
        assignedToId: true,
        createdById: true,
        lastReminderSentAt: true,
      },
    }).catch(() => [])

    const reminders: ReminderResult['reminders'] = []

    for (const rfi of openRfis) {
      const dueDate = new Date(rfi.dueDate)
      const dueDateNormalized = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
      )
      const diffMs = dueDateNormalized.getTime() - today.getTime()
      const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24))

      let reminderType: ReminderType | null = null

      if (daysUntilDue === 3) {
        reminderType = 'APPROACHING'
      } else if (daysUntilDue === 1) {
        reminderType = 'DUE_TOMORROW'
      } else if (daysUntilDue === 0) {
        reminderType = 'DUE_TODAY'
      } else if (daysUntilDue < 0) {
        // Overdue — send daily reminder
        // Check if we already sent a reminder today
        if (rfi.lastReminderSentAt) {
          const lastSent = new Date(rfi.lastReminderSentAt)
          const lastSentDate = new Date(
            lastSent.getFullYear(),
            lastSent.getMonth(),
            lastSent.getDate(),
          )
          if (lastSentDate.getTime() >= today.getTime()) {
            continue // Already sent today
          }
        }
        reminderType = 'OVERDUE'
      }

      if (reminderType) {
        reminders.push({
          rfiId: rfi.id,
          type: reminderType,
          daysUntilDue,
        })

        // Record that we sent a reminder
        await prismaAny.rFI.update({
          where: { id: rfi.id },
          data: { lastReminderSentAt: now },
        }).catch(() => {
          // Non-critical — if the field doesn't exist yet, skip
        })
      }
    }

    // Dispatch notifications for each reminder
    for (const reminder of reminders) {
      const rfi = openRfis.find((r: any) => r.id === reminder.rfiId)
      if (!rfi) continue

      await this.sendReminderNotification({
        rfiId: rfi.id,
        projectId: rfi.projectId,
        subject: rfi.subject,
        dueDate: rfi.dueDate?.toISOString?.() ?? String(rfi.dueDate),
        daysUntilDue: reminder.daysUntilDue,
        assignedToId: rfi.assignedToId,
        createdById: rfi.createdById,
        priority: rfi.priority || 'MEDIUM',
        rfiNumber: rfi.number,
      }, reminder.type)
    }

    return { processed: openRfis.length, reminders }
  },

  /**
   * Send a reminder notification for an RFI.
   * Creates an in-app notification and optionally triggers email.
   */
  async sendReminderNotification(
    payload: RFIReminderPayload,
    type: ReminderType,
  ): Promise<void> {
    const messages: Record<ReminderType, string> = {
      APPROACHING: `RFI "${payload.subject}" is due in 3 days (${formatDate(payload.dueDate)})`,
      DUE_TOMORROW: `RFI "${payload.subject}" is due tomorrow (${formatDate(payload.dueDate)})`,
      DUE_TODAY: `RFI "${payload.subject}" is due today!`,
      OVERDUE: `RFI "${payload.subject}" is ${Math.abs(payload.daysUntilDue)} day(s) overdue!`,
    }

    const message = messages[type]
    const recipientIds: string[] = []

    // Notify assigned user
    if (payload.assignedToId) {
      recipientIds.push(payload.assignedToId)
    }

    // Notify creator for overdue/due-today
    if ((type === 'OVERDUE' || type === 'DUE_TODAY') && payload.createdById) {
      if (!recipientIds.includes(payload.createdById)) {
        recipientIds.push(payload.createdById)
      }
    }

    // Create in-app notifications
    for (const userId of recipientIds) {
      try {
        await prismaAny.notification.create({
          data: {
            userId,
            type: `RFI_REMINDER_${type}`,
            title: type === 'OVERDUE' ? 'Overdue RFI' : 'RFI Reminder',
            message,
            entityType: 'RFI',
            entityId: payload.rfiId,
            projectId: payload.projectId,
            priority: type === 'OVERDUE' ? 'HIGH' : 'MEDIUM',
            read: false,
          },
        })
      } catch {
        // Notification model might not exist yet — log and continue
        console.warn(`[rfi-reminder] Could not create notification for user ${userId}`)
      }
    }

    console.log(
      `[rfi-reminder] ${type} reminder sent for RFI ${payload.rfiId} to ${recipientIds.length} recipient(s)`,
    )
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
