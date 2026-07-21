/**
 * Web Push Notification Service
 *
 * Manages push subscriptions and sends notifications via the Web Push protocol.
 * Uses VAPID authentication (keys stored in environment variables).
 *
 * Environment variables:
 *   VAPID_PUBLIC_KEY  — Public VAPID key (also exposed to client as NEXT_PUBLIC_VAPID_PUBLIC_KEY)
 *   VAPID_PRIVATE_KEY — Private VAPID key (server-only)
 *   VAPID_SUBJECT     — mailto: or URL identifier (e.g., "mailto:admin@kealee.com")
 */

import { prismaAny as prisma } from '../../utils/prisma-helper';
const p = prisma as any;

// ============================================================================
// TYPES
// ============================================================================

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export interface SubscribeInput {
  userId: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  userAgent?: string;
  platform?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class PushService {
  private webpush: any = null;
  private initialized = false;

  /**
   * Lazy-load web-push and configure VAPID credentials.
   * web-push is an optional dependency — service gracefully degrades if unavailable.
   */
  private async init() {
    if (this.initialized) return;

    try {
      this.webpush = require('web-push');

      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      const subject = process.env.VAPID_SUBJECT || 'mailto:admin@kealee.com';

      if (publicKey && privateKey) {
        this.webpush.setVapidDetails(subject, publicKey, privateKey);
        this.initialized = true;
        console.log('[Push] VAPID credentials configured');
      } else {
        console.warn('[Push] VAPID keys not configured — push notifications disabled');
        this.webpush = null;
      }
    } catch {
      console.warn('[Push] web-push module not installed — push notifications disabled');
      this.webpush = null;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Subscription Management
  // ──────────────────────────────────────────────────────────────

  /**
   * Store a new push subscription for a user
   */
  async subscribe(input: SubscribeInput) {
    // Upsert by endpoint (one device = one subscription)
    const existing = await p.pushSubscription.findUnique({
      where: { endpoint: input.subscription.endpoint },
    });

    if (existing) {
      return p.pushSubscription.update({
        where: { endpoint: input.subscription.endpoint },
        data: {
          userId: input.userId,
          p256dh: input.subscription.keys.p256dh,
          auth: input.subscription.keys.auth,
          userAgent: input.userAgent,
          platform: input.platform,
          active: true,
          failCount: 0,
          lastUsed: new Date(),
        },
      });
    }

    return p.pushSubscription.create({
      data: {
        userId: input.userId,
        endpoint: input.subscription.endpoint,
        p256dh: input.subscription.keys.p256dh,
        auth: input.subscription.keys.auth,
        userAgent: input.userAgent,
        platform: input.platform,
        active: true,
        lastUsed: new Date(),
      },
    });
  }

  /**
   * Remove a push subscription
   */
  async unsubscribe(endpoint: string) {
    try {
      await p.pushSubscription.delete({
        where: { endpoint },
      });
    } catch {
      // Already deleted
    }
  }

  /**
   * Deactivate all push subscriptions for a user
   */
  async unsubscribeUser(userId: string) {
    await p.pushSubscription.updateMany({
      where: { userId },
      data: { active: false },
    });
  }

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(userId: string) {
    return p.pushSubscription.findMany({
      where: { userId, active: true },
      orderBy: { lastUsed: 'desc' },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Sending Notifications
  // ──────────────────────────────────────────────────────────────

  /**
   * Send a push notification to a specific user (all their devices)
   */
  async sendToUser(userId: string, notification: PushNotificationPayload): Promise<{
    sent: number;
    failed: number;
    expired: number;
  }> {
    await this.init();
    if (!this.webpush) return { sent: 0, failed: 0, expired: 0 };

    // Check user preferences
    const prefs = await p.notificationPreference.findFirst({
      where: {
        userId,
        pushEnabled: true,
      },
    });

    // If user explicitly disabled push for all categories, skip
    // (We check per-category when we know the notification type)

    const subscriptions = await p.pushSubscription.findMany({
      where: { userId, active: true },
    });

    let sent = 0;
    let failed = 0;
    let expired = 0;

    const payload = JSON.stringify(notification);

    for (const sub of subscriptions) {
      try {
        await this.webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
          {
            TTL: 60 * 60 * 4, // 4 hours
            urgency: notification.requireInteraction ? 'high' : 'normal',
          }
        );

        sent++;

        // Update lastUsed
        await p.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsed: new Date(), failCount: 0 },
        });
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired — remove it
          await p.pushSubscription.delete({ where: { id: sub.id } });
          expired++;
        } else {
          // Other error — increment fail count
          const newFailCount = (sub.failCount || 0) + 1;
          if (newFailCount >= 5) {
            // Too many failures — deactivate
            await p.pushSubscription.update({
              where: { id: sub.id },
              data: { active: false, failCount: newFailCount },
            });
          } else {
            await p.pushSubscription.update({
              where: { id: sub.id },
              data: { failCount: newFailCount },
            });
          }
          failed++;
        }
      }
    }

    return { sent, failed, expired };
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    notification: PushNotificationPayload
  ): Promise<{ total: number; sent: number; failed: number }> {
    let totalSent = 0;
    let totalFailed = 0;

    // Process in parallel batches of 10
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((userId) => this.sendToUser(userId, notification))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          totalSent += result.value.sent;
          totalFailed += result.value.failed;
        } else {
          totalFailed++;
        }
      }
    }

    return {
      total: userIds.length,
      sent: totalSent,
      failed: totalFailed,
    };
  }

  /**
   * Send push notification to all users in a project
   */
  async sendToProject(
    projectId: string,
    notification: PushNotificationPayload,
    excludeUserId?: string
  ) {
    // Get project team members
    const project = await p.project.findUnique({
      where: { id: projectId },
      select: {
        clientId: true,
        pmId: true,
      },
    });

    if (!project) return;

    const userIds = [project.clientId, project.pmId].filter(
      (id): id is string => !!id && id !== excludeUserId
    );

    // Also get contractors assigned to project
    const contractors = await p.contractorProject?.findMany?.({
      where: { projectId },
      select: { contractorId: true },
    }).catch(() => []);

    if (contractors) {
      for (const c of contractors) {
        if (c.contractorId && c.contractorId !== excludeUserId) {
          userIds.push(c.contractorId);
        }
      }
    }

    if (userIds.length === 0) return;

    return this.sendToUsers([...new Set(userIds)], notification);
  }

  // ──────────────────────────────────────────────────────────────
  // Pre-built Notification Templates
  // ──────────────────────────────────────────────────────────────

  /**
   * Notify user of payment received
   */
  async notifyPaymentReceived(userId: string, amount: number, projectName: string) {
    return this.sendToUser(userId, {
      title: 'Payment Received',
      body: `$${amount.toLocaleString()} received for ${projectName}`,
      icon: '/icon-192.png',
      tag: 'payment',
      url: '/payments',
      requireInteraction: false,
    });
  }

  /**
   * Notify PM of payment approval needed
   */
  async notifyPaymentApprovalNeeded(userId: string, amount: number, projectName: string) {
    return this.sendToUser(userId, {
      title: 'Payment Approval Needed',
      body: `$${amount.toLocaleString()} pending for ${projectName}`,
      icon: '/icon-192.png',
      tag: 'payment-approval',
      url: '/work-queue',
      requireInteraction: true,
    });
  }

  /**
   * Notify contractor of bid acceptance
   */
  async notifyBidAccepted(userId: string, projectName: string) {
    return this.sendToUser(userId, {
      title: 'Bid Accepted!',
      body: `Your bid for ${projectName} has been accepted`,
      icon: '/icon-192.png',
      tag: 'bid-accepted',
      url: '/projects',
      requireInteraction: true,
    });
  }

  /**
   * Notify PM of QA issue
   */
  async notifyQAIssue(userId: string, severity: string, projectName: string, description: string) {
    return this.sendToUser(userId, {
      title: `QA Issue — ${severity}`,
      body: `${projectName}: ${description}`,
      icon: '/icon-192.png',
      tag: 'qa-issue',
      url: '/work-queue',
      requireInteraction: severity === 'HIGH' || severity === 'CRITICAL',
    });
  }

  /**
   * Notify of decision card created
   */
  async notifyDecisionNeeded(userId: string, projectName: string, decisionTitle: string) {
    return this.sendToUser(userId, {
      title: 'Decision Needed',
      body: `${projectName}: ${decisionTitle}`,
      icon: '/icon-192.png',
      tag: 'decision',
      url: '/work-queue',
      requireInteraction: true,
    });
  }

  /**
   * Notify client of crew check-in
   */
  async notifyCrewCheckedIn(userId: string, crewName: string, projectName: string) {
    return this.sendToUser(userId, {
      title: 'Crew On Site',
      body: `${crewName} checked in at ${projectName}`,
      icon: '/icon-192.png',
      tag: 'crew-checkin',
      url: '/project',
      requireInteraction: false,
    });
  }

  /**
   * Notify of sensor alert
   */
  async notifySensorAlert(
    userId: string,
    sensorName: string,
    value: string,
    projectName: string
  ) {
    return this.sendToUser(userId, {
      title: 'Sensor Alert',
      body: `${sensorName}: ${value} at ${projectName}`,
      icon: '/icon-192.png',
      tag: 'sensor-alert',
      url: '/project',
      requireInteraction: true,
    });
  }

  // ──────────────────────────────────────────────────────────────
  // VAPID Key Generation Helper
  // ──────────────────────────────────────────────────────────────

  /**
   * Generate VAPID keys (run once, store in env).
   * Call from CLI: node -e "require('./push.service').pushService.generateVapidKeys()"
   */
  async generateVapidKeys() {
    await this.init();
    if (!this.webpush) {
      console.error('web-push module not available');
      return;
    }
    const keys = this.webpush.generateVAPIDKeys();
    console.log('VAPID Keys Generated:');
    console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
    return keys;
  }
}

export const pushService = new PushService();
