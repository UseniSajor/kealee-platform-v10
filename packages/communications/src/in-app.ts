/**
 * In-App Notification Service
 *
 * Creates, reads, and manages in-app notifications stored in the
 * Notification model. Supports real-time delivery via Supabase Realtime.
 */

import { PrismaClient } from '@kealee/database';

const prisma = new PrismaClient();

export interface CreateNotificationOptions {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  projectId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  channels: string[];
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}

/**
 * Create an in-app notification for a user.
 */
export async function createInAppNotification(
  opts: CreateNotificationOptions
): Promise<NotificationRecord> {
  const notification = await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      message: opts.body,
      channels: ['in_app'],
      status: 'SENT',
      sentAt: new Date(),
      data: {
        link: opts.link,
        projectId: opts.projectId,
        priority: opts.priority || 'normal',
      },
    },
  });

  return notification as NotificationRecord;
}

/**
 * Mark a single notification as read.
 * Verifies userId matches for security.
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });

  if (!notification) {
    throw new Error(`Notification not found: ${notificationId}`);
  }

  if (notification.userId !== userId) {
    throw new Error('Unauthorized: notification does not belong to this user');
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: 'READ',
      updatedAt: new Date(),
    },
  });
}

/**
 * Mark all unread notifications for a user as read.
 */
export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      status: { in: ['PENDING', 'SENT'] },
    },
    data: {
      status: 'READ',
      updatedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Get unread notifications for a user.
 */
export async function getUnreadNotifications(
  userId: string,
  limit: number = 20
): Promise<NotificationRecord[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      status: { in: ['PENDING', 'SENT'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return notifications as NotificationRecord[];
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      status: { in: ['PENDING', 'SENT'] },
    },
  });
}

/**
 * Get all notifications for a user with pagination.
 */
export async function getNotifications(
  userId: string,
  opts: { limit?: number; offset?: number; includeRead?: boolean } = {}
): Promise<{ notifications: NotificationRecord[]; total: number }> {
  const { limit = 20, offset = 0, includeRead = true } = opts;

  const where: any = { userId };
  if (!includeRead) {
    where.status = { in: ['PENDING', 'SENT'] };
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications: notifications as NotificationRecord[], total };
}

/**
 * Delete old read notifications (cleanup job).
 * Deletes read notifications older than the specified days.
 */
export async function cleanupOldNotifications(olderThanDays: number = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const result = await prisma.notification.deleteMany({
    where: {
      status: 'READ',
      createdAt: { lt: cutoff },
    },
  });

  return result.count;
}
