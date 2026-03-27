/**
 * comms.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../lib/prisma', () => ({
  default: {
    inAppNotification: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    notifEventPreference: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from '../../../lib/prisma'
import {
  getNotificationCenter,
  markNotificationsRead,
  markAllRead,
  deleteNotification,
  sendNotification,
  getPreferences,
  updatePreferences,
} from '../comms.service'

const db = prisma as any

const USER_ID = 'user-001'

const MOCK_NOTIF = {
  id: 'notif-001',
  userId: USER_ID,
  event: 'MILESTONE_APPROVED',
  title: 'Milestone approved',
  body: 'Your milestone has been approved.',
  entityType: 'milestone',
  entityId: 'ms-001',
  isRead: false,
  readAt: null,
  createdAt: new Date('2026-03-15T10:00:00Z'),
  metadata: {},
}

// ─── getNotificationCenter ───────────────────────────────────────────────────

describe('getNotificationCenter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns unreadCount, total, notifications', async () => {
    db.inAppNotification.findMany.mockResolvedValue([MOCK_NOTIF])
    db.inAppNotification.count
      .mockResolvedValueOnce(5)  // total
      .mockResolvedValueOnce(2)  // unread

    const result = await getNotificationCenter(USER_ID)

    expect(result.total).toBe(5)
    expect(result.unreadCount).toBe(2)
    expect(result.notifications).toHaveLength(1)
    expect(result.notifications[0].event).toBe('MILESTONE_APPROVED')
  })

  it('maps readAt to ISO string when present', async () => {
    const readDate = new Date('2026-03-15T11:00:00Z')
    db.inAppNotification.findMany.mockResolvedValue([{ ...MOCK_NOTIF, isRead: true, readAt: readDate }])
    db.inAppNotification.count.mockResolvedValue(0)

    const result = await getNotificationCenter(USER_ID)
    expect(result.notifications[0].readAt).toBe(readDate.toISOString())
  })
})

// ─── markNotificationsRead ───────────────────────────────────────────────────

describe('markNotificationsRead', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks given notification IDs as read for user', async () => {
    db.inAppNotification.updateMany.mockResolvedValue({ count: 2 })
    const result = await markNotificationsRead(USER_ID, { notificationIds: ['n1', 'n2'] })
    expect(result.updated).toBe(2)
    expect(db.inAppNotification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: USER_ID, isRead: false }),
      }),
    )
  })
})

// ─── markAllRead ─────────────────────────────────────────────────────────────

describe('markAllRead', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks all unread for user as read', async () => {
    db.inAppNotification.updateMany.mockResolvedValue({ count: 7 })
    const result = await markAllRead(USER_ID)
    expect(result.updated).toBe(7)
    expect(db.inAppNotification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, isRead: false },
      }),
    )
  })
})

// ─── deleteNotification ──────────────────────────────────────────────────────

describe('deleteNotification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when notification not found or not owned', async () => {
    db.inAppNotification.findFirst.mockResolvedValue(null)
    await expect(deleteNotification('notif-999', USER_ID)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('deletes notification when found', async () => {
    db.inAppNotification.findFirst.mockResolvedValue(MOCK_NOTIF)
    db.inAppNotification.delete.mockResolvedValue({})
    await deleteNotification('notif-001', USER_ID)
    expect(db.inAppNotification.delete).toHaveBeenCalledWith({ where: { id: 'notif-001' } })
  })
})

// ─── sendNotification ────────────────────────────────────────────────────────

describe('sendNotification', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates in-app notification and returns mapped dto', async () => {
    db.inAppNotification.create.mockResolvedValue(MOCK_NOTIF)

    const result = await sendNotification({
      userId: USER_ID,
      event: 'MILESTONE_APPROVED',
      title: 'Milestone approved',
      body: 'Your milestone has been approved.',
      channels: ['IN_APP'],
    })

    expect(result.id).toBe('notif-001')
    expect(result.isRead).toBe(false)
    expect(db.inAppNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER_ID, event: 'MILESTONE_APPROVED' }),
      }),
    )
  })

  it('does not throw when email channel is requested but RESEND_API_KEY is absent', async () => {
    db.inAppNotification.create.mockResolvedValue(MOCK_NOTIF)
    await expect(
      sendNotification({
        userId: USER_ID,
        event: 'CONTRACT_SIGNED',
        title: 'Contract signed',
        body: 'Your contract has been signed.',
        channels: ['IN_APP', 'EMAIL'],
      }),
    ).resolves.toBeDefined()
  })
})

// ─── getPreferences ──────────────────────────────────────────────────────────

describe('getPreferences', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped preference array', async () => {
    db.notifEventPreference.findMany.mockResolvedValue([
      { event: 'MILESTONE_APPROVED', channels: ['IN_APP', 'EMAIL'], enabled: true },
    ])
    const result = await getPreferences(USER_ID)
    expect(result).toHaveLength(1)
    expect(result[0].event).toBe('MILESTONE_APPROVED')
    expect(result[0].channels).toEqual(['IN_APP', 'EMAIL'])
  })
})

// ─── updatePreferences ───────────────────────────────────────────────────────

describe('updatePreferences', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts all preferences and returns updated list', async () => {
    db.notifEventPreference.upsert.mockResolvedValue({})
    db.notifEventPreference.findMany.mockResolvedValue([
      { event: 'MILESTONE_APPROVED', channels: ['EMAIL'], enabled: false },
    ])

    const result = await updatePreferences(USER_ID, {
      preferences: [{ event: 'MILESTONE_APPROVED', channels: ['EMAIL'], enabled: false }],
    })

    expect(db.notifEventPreference.upsert).toHaveBeenCalledTimes(1)
    expect(result[0].enabled).toBe(false)
  })
})
