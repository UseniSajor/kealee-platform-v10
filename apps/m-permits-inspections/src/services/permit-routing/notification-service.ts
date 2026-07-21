/**
 * Notification Service
 * Handles status notifications for applicants
 */

import {createClient} from '@/lib/supabase/client';

export type NotificationType =
  | 'APPLICATION_SUBMITTED'
  | 'REVIEW_STARTED'
  | 'REVIEW_COMPLETED'
  | 'CORRECTIONS_REQUIRED'
  | 'APPROVED'
  | 'ISSUED'
  | 'ESCALATION'
  | 'STATUS_CHANGE';

export interface Notification {
  id: string;
  permitId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sentAt: Date;
  read: boolean;
  readAt?: Date;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
}

export class NotificationService {
  private templates: Map<NotificationType, NotificationTemplate> = new Map([
    [
      'APPLICATION_SUBMITTED',
      {
        type: 'APPLICATION_SUBMITTED',
        title: 'Permit Application Submitted',
        message: 'Your permit application #{permitNumber} has been submitted and is under review.',
        channels: ['email', 'in_app'],
      },
    ],
    [
      'REVIEW_STARTED',
      {
        type: 'REVIEW_STARTED',
        title: 'Review Started',
        message: 'Review has started for permit #{permitNumber}. Expected completion: {dueDate}.',
        channels: ['email', 'in_app'],
      },
    ],
    [
      'REVIEW_COMPLETED',
      {
        type: 'REVIEW_COMPLETED',
        title: 'Review Completed',
        message: 'Review completed for permit #{permitNumber}. Status: {status}.',
        channels: ['email', 'in_app'],
      },
    ],
    [
      'CORRECTIONS_REQUIRED',
      {
        type: 'CORRECTIONS_REQUIRED',
        title: 'Corrections Required',
        message: 'Corrections are required for permit #{permitNumber}. Please review comments and resubmit.',
        channels: ['email', 'sms', 'in_app'],
      },
    ],
    [
      'APPROVED',
      {
        type: 'APPROVED',
        title: 'Permit Approved',
        message: 'Congratulations! Your permit #{permitNumber} has been approved. Payment required to issue.',
        channels: ['email', 'sms', 'in_app'],
      },
    ],
    [
      'ISSUED',
      {
        type: 'ISSUED',
        title: 'Permit Issued',
        message: 'Your permit #{permitNumber} has been issued. You may now begin work.',
        channels: ['email', 'sms', 'in_app'],
      },
    ],
    [
      'ESCALATION',
      {
        type: 'ESCALATION',
        title: 'Review Delayed',
        message: 'The review for permit #{permitNumber} is taking longer than expected. We are working to resolve this.',
        channels: ['email', 'in_app'],
      },
    ],
    [
      'STATUS_CHANGE',
      {
        type: 'STATUS_CHANGE',
        title: 'Status Updated',
        message: 'The status of permit #{permitNumber} has changed to {status}.',
        channels: ['email', 'in_app'],
      },
    ],
  ]);

  /**
   * Send notification
   */
  async sendNotification(
    permitId: string,
    type: NotificationType,
    options?: {
      customMessage?: string;
      channels?: Array<'email' | 'sms' | 'push' | 'in_app'>;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification[]> {
    const supabase = createClient();

    // Fetch permit and applicant
    const {data: permit} = await supabase
      .from('Permit')
      .select('permitNumber, applicantId, status')
      .eq('id', permitId)
      .single();

    if (!permit) {
      throw new Error('Permit not found');
    }

    // Get template
    const template = this.templates.get(type);
    if (!template) {
      throw new Error(`No template for notification type: ${type}`);
    }

    // Build message with placeholders
    const message = this.buildMessage(
      options?.customMessage || template.message,
      {
        permitNumber: permit.permitNumber,
        status: permit.status,
        dueDate: this.formatDate(this.calculateDueDate()),
      }
    );

    // Determine channels
    const channels = options?.channels || template.channels;

    // Send notifications
    const notifications: Notification[] = [];

    for (const channel of channels) {
      const notification = await this.sendChannelNotification(
        permitId,
        permit.applicantId,
        type,
        template.title,
        message,
        channel,
        options?.metadata
      );

      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  /**
   * Send notification via specific channel
   */
  private async sendChannelNotification(
    permitId: string,
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    channel: 'email' | 'sms' | 'push' | 'in_app',
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    const supabase = createClient();

    // Create notification record
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      permitId,
      userId,
      type,
      title,
      message,
      sentAt: new Date(),
      read: false,
      channel,
      metadata,
    };

    // Store in database
    await supabase.from('Notification').insert({
      id: notification.id,
      permitId: notification.permitId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      sentAt: notification.sentAt.toISOString(),
      read: notification.read,
      channel: notification.channel,
      metadata: notification.metadata || {},
    });

    // Send via channel
    switch (channel) {
      case 'email':
        await this.sendEmail(userId, title, message);
        break;
      case 'sms':
        await this.sendSMS(userId, message);
        break;
      case 'push':
        await this.sendPushNotification(userId, title, message);
        break;
      case 'in_app':
        // Already stored in database
        break;
    }

    return notification;
  }

  /**
   * Send email notification
   */
  private async sendEmail(userId: string, subject: string, body: string): Promise<void> {
    // This would integrate with email service (SendGrid, AWS SES, etc.)
    // For now, log it
    console.log(`[EMAIL] To: ${userId}, Subject: ${subject}`);
    
    // In production, you would:
    // 1. Fetch user email from database
    // 2. Call email service API
    // 3. Handle errors and retries
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(userId: string, message: string): Promise<void> {
    // This would integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`[SMS] To: ${userId}, Message: ${message}`);
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(userId: string, title: string, body: string): Promise<void> {
    // This would integrate with push notification service (FCM, APNS, etc.)
    console.log(`[PUSH] To: ${userId}, Title: ${title}, Body: ${body}`);
  }

  /**
   * Build message with placeholders
   */
  private buildMessage(template: string, variables: Record<string, string>): string {
    let message = template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return message;
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Calculate due date (simplified)
   */
  private calculateDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 10); // 10 days from now
    return date;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const supabase = createClient();
    await supabase
      .from('Notification')
      .update({
        read: true,
        readAt: new Date().toISOString(),
      })
      .eq('id', notificationId);
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
    }
  ): Promise<Notification[]> {
    const supabase = createClient();

    let query = supabase
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .order('sentAt', {ascending: false});

    if (options?.unreadOnly) {
      query = query.eq('read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const {data} = await query;
    return (data || []).map(this.mapNotification);
  }

  /**
   * Map database record to Notification
   */
  private mapNotification(record: any): Notification {
    return {
      id: record.id,
      permitId: record.permitId,
      userId: record.userId,
      type: record.type,
      title: record.title,
      message: record.message,
      sentAt: new Date(record.sentAt),
      read: record.read,
      readAt: record.readAt ? new Date(record.readAt) : undefined,
      channel: record.channel,
      metadata: record.metadata,
    };
  }

  /**
   * Add custom notification template
   */
  addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.type, template);
  }
}

// Singleton instance
export const notificationService = new NotificationService();
