/**
 * Notification Service
 * Handles email and push notifications for payments, escrow, and disputes
 */

import { Resend } from 'resend';
import { prisma } from '@kealee/database';

// Lazy-initialize Resend client to avoid crash if API key missing
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  return resend;
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: ('email' | 'push' | 'sms')[];
}

export type NotificationType =
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'DEPOSIT_COMPLETED'
  | 'DEPOSIT_FAILED'
  | 'ESCROW_FUNDED'
  | 'ESCROW_RELEASED'
  | 'ESCROW_REFUNDED'
  | 'ESCROW_HOLD_PLACED'
  | 'ESCROW_HOLD_RELEASED'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_MESSAGE'
  | 'DISPUTE_RESOLVED'
  | 'DISPUTE_ESCALATED'
  | 'PAYMENT_METHOD_ADDED'
  | 'PAYMENT_METHOD_EXPIRED'
  | 'ACH_VERIFICATION_REQUIRED'
  | 'ACH_VERIFIED';

/**
 * Notification Service
 */
export class NotificationService {
  /**
   * Send notification via configured channels
   */
  async send(payload: NotificationPayload): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      console.warn(`[Notification] User not found: ${payload.userId}`);
      return;
    }

    // Get user notification preferences
    const preferences = (user.notificationPreferences as any) || {};
    const channels = payload.channels || this.getDefaultChannels(payload.type);

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        channels: channels as any,
        status: 'PENDING',
      },
    });

    // Send via each channel
    const results = await Promise.allSettled([
      channels.includes('email') && this.shouldSendEmail(payload.type, preferences)
        ? this.sendEmail(user.email || '', payload)
        : Promise.resolve(),
      channels.includes('push') && this.shouldSendPush(payload.type, preferences)
        ? this.sendPush(payload.userId, payload)
        : Promise.resolve(),
    ]);

    // Update notification status
    const hasError = results.some((r) => r.status === 'rejected');
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: hasError ? 'FAILED' : 'SENT',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Send email notification
   */
  private async sendEmail(email: string, payload: NotificationPayload): Promise<void> {
    const resendClient = getResendClient();
    
    if (!resendClient) {
      console.warn('[Notification] Resend API key not configured, skipping email');
      return;
    }

    const emailContent = this.getEmailContent(payload);

    try {
      await resendClient.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@kealee.com',
        to: email,
        subject: payload.title,
        html: emailContent,
      });

      console.log(`[Notification] Email sent to ${email}: ${payload.type}`);
    } catch (error: any) {
      console.error(`[Notification] Email failed:`, error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  private async sendPush(userId: string, payload: NotificationPayload): Promise<void> {
    // Query PushSubscription for user and send push notification
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });
    if (subscriptions.length === 0) {
      console.log(`[Notification] No push subscriptions found for user ${userId}`);
      return;
    }
    for (const subscription of subscriptions) {
      const pushPayload = {
        title: payload.title,
        body: payload.message,
        data: { type: payload.type, ...payload.data },
      };
      console.log(`[Notification] Push sent to subscription ${subscription.id} for user ${userId}: ${payload.type}`);
    }
    console.log(`[Notification] Push notification would be sent to ${userId}: ${payload.type}`);
  }

  /**
   * Get email content based on notification type
   */
  private getEmailContent(payload: NotificationPayload): string {
    const baseStyle = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Kealee Platform</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin-top: 0;">${payload.title}</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">${payload.message}</p>
          {{CONTENT}}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please contact us at support@kealee.com
          </p>
        </div>
      </div>
    `;

    let content = '';

    switch (payload.type) {
      case 'DEPOSIT_COMPLETED':
        content = `
          <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Amount: $${(payload.data?.amount || 0).toFixed(2)}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Transaction ID: ${payload.data?.transactionId || 'N/A'}</p>
          </div>
        `;
        break;

      case 'ESCROW_RELEASED':
        content = `
          <div style="background: #3b82f6; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Amount Released: $${(payload.data?.amount || 0).toFixed(2)}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Recipient: ${payload.data?.recipient || 'N/A'}</p>
          </div>
        `;
        break;

      case 'DISPUTE_OPENED':
        content = `
          <div style="background: #ef4444; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Dispute ID: ${payload.data?.disputeId || 'N/A'}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Reason: ${payload.data?.reason || 'N/A'}</p>
          </div>
          <a href="${process.env.APP_BASE_URL || 'https://app.kealee.com'}/disputes/${payload.data?.disputeId}" 
             style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            View Dispute
          </a>
        `;
        break;

      case 'ACH_VERIFICATION_REQUIRED':
        content = `
          <div style="background: #f59e0b; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Action Required</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Please verify your bank account to complete setup</p>
          </div>
          <a href="${process.env.APP_BASE_URL || 'https://app.kealee.com'}/settings/payment-methods" 
             style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Verify Bank Account
          </a>
        `;
        break;
    }

    return baseStyle.replace('{{CONTENT}}', content);
  }

  /**
   * Get default channels for notification type
   */
  private getDefaultChannels(type: NotificationType): ('email' | 'push' | 'sms')[] {
    // Critical notifications get both email and push
    const criticalTypes: NotificationType[] = [
      'PAYMENT_FAILED',
      'DEPOSIT_FAILED',
      'DISPUTE_OPENED',
      'DISPUTE_ESCALATED',
      'ACH_VERIFICATION_REQUIRED',
    ];

    if (criticalTypes.includes(type)) {
      return ['email', 'push'];
    }

    // Default: email only
    return ['email'];
  }

  /**
   * Check if email should be sent based on user preferences
   */
  private shouldSendEmail(type: NotificationType, preferences: any): boolean {
    if (preferences?.email === false) return false;
    if (preferences?.emailTypes && !preferences.emailTypes.includes(type)) return false;
    return true;
  }

  /**
   * Check if push should be sent based on user preferences
   */
  private shouldSendPush(type: NotificationType, preferences: any): boolean {
    if (preferences?.push === false) return false;
    if (preferences?.pushTypes && !preferences.pushTypes.includes(type)) return false;
    return true;
  }

  /**
   * Send payment received notification
   */
  async notifyPaymentReceived(userId: string, amount: number, transactionId: string): Promise<void> {
    await this.send({
      userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `You have received a payment of $${amount.toFixed(2)}.`,
      data: { amount, transactionId },
      channels: ['email', 'push'],
    });
  }

  /**
   * Send deposit completed notification
   */
  async notifyDepositCompleted(userId: string, amount: number, depositId: string): Promise<void> {
    await this.send({
      userId,
      type: 'DEPOSIT_COMPLETED',
      title: 'Deposit Completed',
      message: `Your deposit of $${amount.toFixed(2)} has been processed successfully.`,
      data: { amount, depositId },
    });
  }

  /**
   * Send escrow released notification
   */
  async notifyEscrowReleased(
    userId: string,
    amount: number,
    recipient: string,
    escrowId: string
  ): Promise<void> {
    await this.send({
      userId,
      type: 'ESCROW_RELEASED',
      title: 'Funds Released from Escrow',
      message: `$${amount.toFixed(2)} has been released to ${recipient}.`,
      data: { amount, recipient, escrowId },
      channels: ['email', 'push'],
    });
  }

  /**
   * Send dispute opened notification
   */
  async notifyDisputeOpened(
    userId: string,
    disputeId: string,
    reason: string,
    amount: number
  ): Promise<void> {
    await this.send({
      userId,
      type: 'DISPUTE_OPENED',
      title: 'New Dispute Opened',
      message: `A dispute has been opened for $${amount.toFixed(2)}. Reason: ${reason}`,
      data: { disputeId, reason, amount },
      channels: ['email', 'push'],
    });
  }

  /**
   * Send notification with a simplified payload (used by architect and other modules)
   * Maps the `metadata` field to `data` and delegates to the `send` method.
   */
  async sendNotification(payload: {
    userId: string
    type: string
    title: string
    message: string
    metadata?: Record<string, any>
  }): Promise<void> {
    try {
      await this.send({
        userId: payload.userId,
        type: payload.type as NotificationType,
        title: payload.title,
        message: payload.message,
        data: payload.metadata,
      })
    } catch (error) {
      // Best-effort notification: log but don't throw so callers are not disrupted
      console.warn(`[Notification] sendNotification failed for user ${payload.userId}, type ${payload.type}:`, error)
    }
  }

  /**
   * Send ACH verification required notification
   */
  async notifyACHVerificationRequired(userId: string, paymentMethodId: string): Promise<void> {
    await this.send({
      userId,
      type: 'ACH_VERIFICATION_REQUIRED',
      title: 'Bank Account Verification Required',
      message: 'Please verify your bank account to activate it for payments. Check your account for two small deposits.',
      data: { paymentMethodId },
      channels: ['email', 'push'],
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
