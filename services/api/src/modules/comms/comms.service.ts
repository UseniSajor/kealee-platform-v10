/**
 * comms.service.ts — Unified Communications Layer
 * In-app inbox, preference management, channel routing.
 */
import { prisma } from '../../lib/prisma'
import type {
  SendNotificationBody,
  UpdateNotificationPrefsBody,
  MarkNotificationsReadBody,
  InAppNotificationDto,
  NotificationPreferenceDto,
  NotificationCenterDto,
} from './comms.dto'

const db = prisma as any

// ─── In-App Notifications ─────────────────────────────────────────────────────

export async function getNotificationCenter(
  userId: string,
  page = 1,
  limit = 30,
): Promise<NotificationCenterDto> {
  const skip = (page - 1) * limit

  const [notifications, total, unreadCount] = await Promise.all([
    db.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.inAppNotification.count({ where: { userId } }),
    db.inAppNotification.count({ where: { userId, isRead: false } }),
  ])

  return {
    unreadCount,
    total,
    notifications: notifications.map(mapNotification),
  }
}

export async function markNotificationsRead(
  userId: string,
  body: MarkNotificationsReadBody,
): Promise<{ updated: number }> {
  const result = await db.inAppNotification.updateMany({
    where: {
      id: { in: body.notificationIds },
      userId, // enforce ownership
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
  return { updated: result.count }
}

export async function markAllRead(userId: string): Promise<{ updated: number }> {
  const result = await db.inAppNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
  return { updated: result.count }
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const existing = await db.inAppNotification.findFirst({
    where: { id: notificationId, userId },
  })
  if (!existing) throw Object.assign(new Error('Notification not found'), { statusCode: 404 })
  await db.inAppNotification.delete({ where: { id: notificationId } })
}

// ─── Send (Internal) ──────────────────────────────────────────────────────────

export async function sendNotification(body: SendNotificationBody): Promise<InAppNotificationDto> {
  const channels = body.channels ?? ['IN_APP']

  // Always write in-app record
  const notification = await db.inAppNotification.create({
    data: {
      userId: body.userId,
      event: body.event,
      title: body.title,
      body: body.body,
      entityType: body.entityType ?? null,
      entityId: body.entityId ?? null,
      metadata: body.metadata ?? {},
      isRead: false,
    },
  })

  // Route to external channels (fire-and-forget; log errors, don't throw)
  if (channels.includes('EMAIL')) {
    routeEmail(body).catch(err =>
      console.error('[comms] email routing error', { userId: body.userId, err }),
    )
  }
  if (channels.includes('SMS')) {
    routeSms(body).catch(err =>
      console.error('[comms] sms routing error', { userId: body.userId, err }),
    )
  }

  return mapNotification(notification)
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export async function getPreferences(userId: string): Promise<NotificationPreferenceDto[]> {
  const prefs = await db.notifEventPreference.findMany({
    where: { userId },
    orderBy: { event: 'asc' },
  })
  return prefs.map((p: any) => ({
    event: p.event,
    channels: p.channels,
    enabled: p.enabled,
  }))
}

export async function updatePreferences(
  userId: string,
  body: UpdateNotificationPrefsBody,
): Promise<NotificationPreferenceDto[]> {
  // Upsert each preference entry
  await Promise.all(
    body.preferences.map(pref =>
      db.notifEventPreference.upsert({
        where: { notifEventPref_userId_event: { userId, event: pref.event } },
        create: {
          userId,
          event: pref.event,
          channels: pref.channels,
          enabled: pref.enabled,
        },
        update: {
          channels: pref.channels,
          enabled: pref.enabled,
        },
      }),
    ),
  )

  return getPreferences(userId)
}

// ─── Channel Routing Stubs ────────────────────────────────────────────────────
// These will be wired to Resend (email) and Twilio (SMS) when credentials are configured.

async function routeEmail(body: SendNotificationBody): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return // silently skip if not configured

  const user = await db.user.findUnique({
    where: { id: body.userId },
    select: { email: true, name: true },
  })
  if (!user?.email) return

  const from = process.env.RESEND_FROM_EMAIL ?? 'Kealee <noreply@kealee.com>'
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1A2B4A;">${body.title}</h2>
      <p style="color:#333;">${body.body}</p>
      ${body.entityType && body.entityId ? `<p style="font-size:12px;color:#999;">Ref: ${body.entityType}/${body.entityId}</p>` : ''}
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [user.email], subject: body.title, html }),
  })

  if (!res.ok) {
    throw new Error(`Resend API error ${res.status}: ${await res.text()}`)
  }
}

async function routeSms(body: SendNotificationBody): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  if (!accountSid) return // silently skip if not configured

  // TODO: resolve user phone from userId, call Twilio API
  // const user = await db.user.findUnique({ where: { id: body.userId }, select: { phone: true } })
  // if (!user?.phone) return
  // await twilio.messages.create({ body: body.body, to: user.phone, from: process.env.TWILIO_PHONE_NUMBER })
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function mapNotification(n: any): InAppNotificationDto {
  return {
    id: n.id,
    userId: n.userId,
    event: n.event,
    title: n.title,
    body: n.body,
    entityType: n.entityType ?? null,
    entityId: n.entityId ?? null,
    isRead: n.isRead,
    readAt: n.readAt ? new Date(n.readAt).toISOString() : null,
    createdAt: new Date(n.createdAt).toISOString(),
    metadata: n.metadata ?? {},
  }
}
