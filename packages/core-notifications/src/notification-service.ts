/**
 * Unified Notification Service — email, SMS, push, in-app
 */

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPayload {
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  template: string;
  subject?: string;
  body: string;
  data?: Record<string, unknown>;
  projectId?: string;
  orgId?: string;
  actionUrl?: string;
  expiresAt?: Date;
}

export interface NotificationResult {
  notificationId: string;
  channelResults: {
    channel: NotificationChannel;
    success: boolean;
    error?: string;
    externalId?: string;
  }[];
}

export type ChannelSender = (payload: NotificationPayload) => Promise<{ success: boolean; externalId?: string; error?: string }>;

export class NotificationService {
  private senders = new Map<NotificationChannel, ChannelSender>();

  /**
   * Register a channel sender (email, SMS, push, etc.)
   */
  registerSender(channel: NotificationChannel, sender: ChannelSender): void {
    this.senders.set(channel, sender);
  }

  /**
   * Send a notification across all specified channels
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const channelResults: NotificationResult['channelResults'] = [];

    for (const channel of payload.channels) {
      const sender = this.senders.get(channel);
      if (!sender) {
        channelResults.push({
          channel,
          success: false,
          error: `No sender registered for channel: ${channel}`,
        });
        continue;
      }

      try {
        const result = await sender(payload);
        channelResults.push({ channel, ...result });
      } catch (err) {
        channelResults.push({
          channel,
          success: false,
          error: String(err),
        });
      }
    }

    return { notificationId, channelResults };
  }

  /**
   * Send to multiple recipients
   */
  async sendBulk(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map(p => this.send(p)));
  }
}
