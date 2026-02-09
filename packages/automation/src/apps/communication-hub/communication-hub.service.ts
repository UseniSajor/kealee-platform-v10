import { PrismaClient } from '@prisma/client';
import {
  sendEmail,
  sendSMS,
  sendWhatsApp,
  createInAppNotification,
  wrapInEmailLayout,
  getUnreadCount as getUnreadNotificationCount,
} from '@kealee/communications';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-08';

type Channel = 'email' | 'sms' | 'in_app' | 'whatsapp';

interface SendNotificationOpts {
  userId: string;
  projectId?: string;
  type: string;
  title: string;
  body: string;
  htmlBody?: string;
  link?: string;
  channels: Channel[];
}

interface SendTemplateMessageOpts {
  templateName: string;
  projectId: string;
  audience: 'client' | 'contractor' | 'pm' | 'all';
  variables: Record<string, string>;
}

interface SendBulkNotificationOpts {
  userIds: string[];
  type: string;
  title: string;
  body: string;
  channels: Channel[];
  projectId?: string;
}

interface ChannelResult {
  channel: Channel;
  status: 'sent' | 'failed';
  id?: string;
  error?: string;
}

/**
 * Replace {{variable}} placeholders in a string.
 */
function interpolate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

/**
 * Simple delay helper for rate limiting.
 */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class CommunicationHubService {
  // -----------------------------------------------------------------------
  // sendNotification — uses real Resend, Twilio, and in-app implementations
  // -----------------------------------------------------------------------

  async sendNotification(opts: SendNotificationOpts): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: opts.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      console.warn(`[CommHub] User ${opts.userId} not found, skipping notification`);
      return [];
    }

    // Respect user notification preferences
    const prefs = (user.notificationPreferences as Record<string, boolean>) || {};

    // Also check per-category preferences from NotificationPreference table
    const categoryPrefs = await this.getUserCategoryPrefs(opts.userId, opts.type);

    const results: ChannelResult[] = [];

    for (const channel of opts.channels) {
      try {
        // Check global + category opt-outs
        if (!this.isChannelAllowed(channel, prefs, categoryPrefs)) {
          continue;
        }

        switch (channel) {
          case 'email': {
            if (!user.email) break;
            const emailResult = await sendEmail({
              to: user.email,
              subject: opts.title,
              html: opts.htmlBody || wrapInEmailLayout(opts.body),
              tags: [
                { name: 'type', value: opts.type },
                ...(opts.projectId ? [{ name: 'projectId', value: opts.projectId }] : []),
              ],
            });
            // Also create Message record for unified tracking
            const emailMsg = await prisma.message.create({
              data: {
                senderId: 'system',
                recipientId: user.id,
                recipientEmail: user.email,
                channel: 'EMAIL',
                type: opts.type,
                subject: opts.title,
                body: opts.htmlBody || opts.body,
                projectId: opts.projectId,
                status: 'SENT',
                sentAt: new Date(),
                metadata: { messageId: emailResult.messageId },
              },
            });
            results.push({ channel: 'email', status: 'sent', id: emailMsg.id });
            break;
          }

          case 'sms': {
            if (!user.phone) break;
            const smsResult = await sendSMS({
              to: user.phone,
              body: opts.body.substring(0, 1600),
              userId: user.id,
              projectId: opts.projectId,
            });
            const smsMsg = await prisma.message.create({
              data: {
                senderId: 'system',
                recipientId: user.id,
                recipientPhone: user.phone,
                channel: 'SMS',
                type: opts.type,
                body: opts.body.substring(0, 1600),
                projectId: opts.projectId,
                status: 'SENT',
                sentAt: new Date(),
                metadata: { messageSid: smsResult.messageSid },
              },
            });
            results.push({ channel: 'sms', status: 'sent', id: smsMsg.id });
            break;
          }

          case 'in_app': {
            const notification = await createInAppNotification({
              userId: user.id,
              type: opts.type,
              title: opts.title,
              body: opts.body,
              link: opts.link,
              projectId: opts.projectId,
            });
            const inAppMsg = await prisma.message.create({
              data: {
                senderId: 'system',
                recipientId: user.id,
                channel: 'IN_APP',
                type: opts.type,
                subject: opts.title,
                body: opts.body,
                projectId: opts.projectId,
                status: 'SENT',
                sentAt: new Date(),
                metadata: { notificationId: notification.id },
              },
            });
            results.push({ channel: 'in_app', status: 'sent', id: inAppMsg.id });
            break;
          }

          case 'whatsapp': {
            if (!user.phone) break;
            const waResult = await sendWhatsApp({
              to: user.phone,
              body: opts.body.substring(0, 1600),
              userId: user.id,
              projectId: opts.projectId,
            });
            const waMsg = await prisma.message.create({
              data: {
                senderId: 'system',
                recipientId: user.id,
                recipientPhone: user.phone,
                channel: 'SMS',
                type: opts.type,
                body: opts.body.substring(0, 1600),
                projectId: opts.projectId,
                status: 'SENT',
                sentAt: new Date(),
                metadata: { messageSid: waResult.messageSid, channel: 'whatsapp' },
              },
            });
            results.push({ channel: 'whatsapp', status: 'sent', id: waMsg.id });
            break;
          }
        }
      } catch (err) {
        const errorMsg = (err as Error).message;
        console.error(`[CommHub] Failed to send ${channel} to ${user.id}:`, errorMsg);
        results.push({ channel, status: 'failed', error: errorMsg });
        // Don't throw — continue sending on other channels
      }
    }

    return results.filter((r) => r.status === 'sent').map((r) => r.id!);
  }

  // -----------------------------------------------------------------------
  // sendTemplateMessage
  // -----------------------------------------------------------------------

  async sendTemplateMessage(opts: SendTemplateMessageOpts): Promise<string[]> {
    // Find the template
    const template = await prisma.messageTemplate.findFirst({
      where: { name: opts.templateName, isActive: true },
    });

    if (!template) {
      console.warn(`[CommHub] Template "${opts.templateName}" not found or inactive`);
      return [];
    }

    // Resolve target users
    const userIds = await this.resolveAudience(opts.projectId, opts.audience);
    if (userIds.length === 0) return [];

    // Determine channel from template
    const channelStr = template.channel.toLowerCase();
    const channels: Channel[] = channelStr === 'all'
      ? ['email', 'in_app']
      : [channelStr as Channel];

    const subject = template.subject
      ? interpolate(template.subject, opts.variables)
      : undefined;
    const body = interpolate(template.body, opts.variables);
    const htmlBody = wrapInEmailLayout(body, opts.variables.project_name);

    const messageIds: string[] = [];

    for (const userId of userIds) {
      const ids = await this.sendNotification({
        userId,
        projectId: opts.projectId,
        type: template.type,
        title: subject ?? opts.variables.title ?? template.name,
        body,
        htmlBody: channels.includes('email') ? htmlBody : undefined,
        channels,
      });
      messageIds.push(...ids);
    }

    return messageIds;
  }

  // -----------------------------------------------------------------------
  // sendBulkNotification
  // -----------------------------------------------------------------------

  async sendBulkNotification(opts: SendBulkNotificationOpts): Promise<string[]> {
    const messageIds: string[] = [];

    for (let i = 0; i < opts.userIds.length; i++) {
      const ids = await this.sendNotification({
        userId: opts.userIds[i],
        projectId: opts.projectId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        channels: opts.channels as Channel[],
      });
      messageIds.push(...ids);

      // Rate limiting: pause between sends
      if (opts.channels.includes('email') && (i + 1) % 10 === 0) {
        await delay(1000); // 10 emails per second
      }
      if (opts.channels.includes('sms')) {
        await delay(1000); // 1 SMS per second
      }
    }

    return messageIds;
  }

  // -----------------------------------------------------------------------
  // getUnreadCount
  // -----------------------------------------------------------------------

  async getUnreadCount(userId: string): Promise<number> {
    return getUnreadNotificationCount(userId);
  }

  // -----------------------------------------------------------------------
  // Private: Notification preference helpers
  // -----------------------------------------------------------------------

  /**
   * Check per-category notification preferences for a user.
   * Maps notification types to categories for preference lookups.
   */
  private async getUserCategoryPrefs(
    userId: string,
    notificationType: string,
  ): Promise<{
    emailEnabled: boolean;
    smsEnabled: boolean;
    inAppEnabled: boolean;
    pushEnabled: boolean;
  } | null> {
    // Map notification type to category
    const category = this.typeToCategory(notificationType);
    if (!category) return null;

    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_category: { userId, category } },
    });

    return pref;
  }

  /**
   * Map notification types to preference categories.
   */
  private typeToCategory(type: string): string | null {
    const mapping: Record<string, string> = {
      welcome: 'ALERTS',
      bid_submitted: 'PROJECT_UPDATES',
      bid_accepted: 'PROJECT_UPDATES',
      contract_signed: 'PROJECT_UPDATES',
      escrow_funded: 'PAYMENTS',
      milestone_completed: 'PROJECT_UPDATES',
      inspection_passed: 'INSPECTIONS',
      inspection_failed: 'INSPECTIONS',
      payment_released: 'PAYMENTS',
      budget_overrun: 'ALERTS',
      qa_issue_pm: 'INSPECTIONS',
      qa_issue_contractor: 'INSPECTIONS',
      schedule_disruption: 'ALERTS',
      change_order_requested: 'PROJECT_UPDATES',
      decision_needed: 'ALERTS',
      subscription_confirmation: 'PAYMENTS',
      document_generated: 'PROJECT_UPDATES',
      project_completed: 'PROJECT_UPDATES',
      NOTIFICATION: 'ALERTS',
      REMINDER: 'ALERTS',
      UPDATE: 'PROJECT_UPDATES',
      ALERT: 'ALERTS',
    };

    return mapping[type] || null;
  }

  /**
   * Check if a channel is allowed based on user preferences.
   */
  private isChannelAllowed(
    channel: Channel,
    globalPrefs: Record<string, boolean>,
    categoryPrefs: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      inAppEnabled: boolean;
      pushEnabled: boolean;
    } | null,
  ): boolean {
    // Global opt-out check
    if (channel === 'email' && globalPrefs.email === false) return false;
    if (channel === 'sms' && globalPrefs.sms === false) return false;
    if (channel === 'in_app' && globalPrefs.in_app === false) return false;
    if (channel === 'whatsapp' && globalPrefs.whatsapp === false) return false;

    // Category-level check (if preferences exist)
    if (categoryPrefs) {
      if (channel === 'email' && !categoryPrefs.emailEnabled) return false;
      if (channel === 'sms' && !categoryPrefs.smsEnabled) return false;
      if (channel === 'in_app' && !categoryPrefs.inAppEnabled) return false;
    }

    return true;
  }

  // -----------------------------------------------------------------------
  // resolveAudience — get user IDs for a project + audience type
  // -----------------------------------------------------------------------

  private async resolveAudience(
    projectId: string,
    audience: 'client' | 'contractor' | 'pm' | 'all',
  ): Promise<string[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        projectManagers: { where: { removedAt: null } },
      },
    });

    if (!project) return [];

    const userIds: string[] = [];

    switch (audience) {
      case 'client':
        // Client model doesn't have userId — look up user by client email
        if (project.client?.email) {
          const clientUser = await prisma.user.findFirst({
            where: { email: project.client.email },
            select: { id: true },
          });
          if (clientUser) userIds.push(clientUser.id);
        }
        // Fallback to PM if no user found for client
        if (userIds.length === 0 && project.pmId) {
          userIds.push(project.pmId);
        }
        break;

      case 'contractor':
        // Get contractors assigned to this project via ContractorProject
        const contractorProjects = await prisma.contractorProject.findMany({
          where: { projectId },
          include: { contractor: true },
        });
        for (const cp of contractorProjects) {
          // Look up user by contractor email
          if (cp.contractor.email) {
            const contractorUser = await prisma.user.findFirst({
              where: { email: cp.contractor.email },
              select: { id: true },
            });
            if (contractorUser && !userIds.includes(contractorUser.id)) {
              userIds.push(contractorUser.id);
            }
          }
        }
        break;

      case 'pm':
        if (project.pmId) userIds.push(project.pmId);
        for (const pm of project.projectManagers) {
          if (!userIds.includes(pm.userId)) userIds.push(pm.userId);
        }
        break;

      case 'all':
        // PMs
        if (project.pmId) userIds.push(project.pmId);
        for (const pm of project.projectManagers) {
          if (!userIds.includes(pm.userId)) userIds.push(pm.userId);
        }
        // Client
        if (project.client?.email) {
          const clientUser = await prisma.user.findFirst({
            where: { email: project.client.email },
            select: { id: true },
          });
          if (clientUser && !userIds.includes(clientUser.id)) {
            userIds.push(clientUser.id);
          }
        }
        // Contractors
        const allContractors = await prisma.contractorProject.findMany({
          where: { projectId },
          include: { contractor: true },
        });
        for (const cp of allContractors) {
          if (cp.contractor.email) {
            const cUser = await prisma.user.findFirst({
              where: { email: cp.contractor.email },
              select: { id: true },
            });
            if (cUser && !userIds.includes(cUser.id)) {
              userIds.push(cUser.id);
            }
          }
        }
        break;
    }

    return userIds;
  }
}
