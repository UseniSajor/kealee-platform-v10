import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-08';

// External service config (keys read at call time, not import time)
function getResendKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}
function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromPhone: process.env.TWILIO_FROM_PHONE ?? '+15005550006',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
  };
}

type Channel = 'email' | 'sms' | 'in_app' | 'whatsapp';

interface SendNotificationOpts {
  userId: string;
  projectId?: string;
  type: string;
  title: string;
  body: string;
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
  // sendNotification
  // -----------------------------------------------------------------------

  async sendNotification(opts: SendNotificationOpts): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: opts.userId },
      select: { id: true, email: true, name: true, phone: true },
    });

    if (!user) {
      console.warn(`[CommHub] User ${opts.userId} not found, skipping notification`);
      return [];
    }

    const messageIds: string[] = [];

    for (const channel of opts.channels) {
      try {
        const message = await this.sendViaChannel(channel, {
          user,
          projectId: opts.projectId,
          type: opts.type,
          title: opts.title,
          body: opts.body,
          link: opts.link,
        });
        messageIds.push(message.id);
      } catch (err) {
        console.error(
          `[CommHub] Failed to send ${channel} to ${user.id}:`,
          (err as Error).message,
        );
      }
    }

    return messageIds;
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

    const messageIds: string[] = [];

    for (const userId of userIds) {
      const ids = await this.sendNotification({
        userId,
        projectId: opts.projectId,
        type: template.type,
        title: subject ?? opts.variables.title ?? template.name,
        body,
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
    return prisma.notification.count({
      where: { userId, status: 'PENDING' },
    });
  }

  // -----------------------------------------------------------------------
  // Private: sendViaChannel
  // -----------------------------------------------------------------------

  private async sendViaChannel(
    channel: Channel,
    opts: {
      user: { id: string; email: string | null; name: string | null; phone: string | null };
      projectId?: string;
      type: string;
      title: string;
      body: string;
      link?: string;
    },
  ) {
    switch (channel) {
      case 'email':
        return this.sendEmail(opts);
      case 'sms':
        return this.sendSMS(opts);
      case 'in_app':
        return this.sendInApp(opts);
      case 'whatsapp':
        return this.sendWhatsApp(opts);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  // -----------------------------------------------------------------------
  // Email via Resend
  // -----------------------------------------------------------------------

  private async sendEmail(opts: {
    user: { id: string; email: string | null; name: string | null };
    projectId?: string;
    type: string;
    title: string;
    body: string;
  }) {
    const message = await prisma.message.create({
      data: {
        senderId: 'system',
        recipientId: opts.user.id,
        recipientEmail: opts.user.email ?? undefined,
        channel: 'EMAIL',
        type: opts.type,
        subject: opts.title,
        body: opts.body,
        projectId: opts.projectId,
        status: 'PENDING',
      },
    });

    const apiKey = getResendKey();
    if (apiKey && opts.user.email) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: 'Kealee <noreply@kealee.com>',
            to: opts.user.email,
            subject: opts.title,
            html: opts.body,
          }),
        });

        if (res.ok) {
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } else {
          const errText = await res.text();
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'FAILED', failedAt: new Date(), errorMessage: errText },
          });
        }
      } catch (err) {
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: (err as Error).message,
          },
        });
      }
    } else {
      // No API key or no email — mark as sent for dev/testing
      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      console.log(`[CommHub] Email (dev): to=${opts.user.email} subject="${opts.title}"`);
    }

    return message;
  }

  // -----------------------------------------------------------------------
  // SMS via Twilio
  // -----------------------------------------------------------------------

  private async sendSMS(opts: {
    user: { id: string; phone: string | null };
    projectId?: string;
    type: string;
    title: string;
    body: string;
  }) {
    const message = await prisma.message.create({
      data: {
        senderId: 'system',
        recipientId: opts.user.id,
        recipientPhone: opts.user.phone ?? undefined,
        channel: 'SMS',
        type: opts.type,
        body: opts.body.substring(0, 1600), // SMS length limit
        projectId: opts.projectId,
        status: 'PENDING',
      },
    });

    const twilio = getTwilioConfig();
    if (twilio.accountSid && twilio.authToken && opts.user.phone) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`;
        const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString('base64');

        const params = new URLSearchParams();
        params.append('To', opts.user.phone);
        params.append('From', twilio.fromPhone);
        params.append('Body', opts.body.substring(0, 1600));

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (res.ok) {
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } else {
          const errText = await res.text();
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'FAILED', failedAt: new Date(), errorMessage: errText },
          });
        }
      } catch (err) {
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: (err as Error).message,
          },
        });
      }
    } else {
      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      console.log(`[CommHub] SMS (dev): to=${opts.user.phone} "${opts.body.substring(0, 80)}"`);
    }

    return message;
  }

  // -----------------------------------------------------------------------
  // In-App Notification
  // -----------------------------------------------------------------------

  private async sendInApp(opts: {
    user: { id: string };
    projectId?: string;
    type: string;
    title: string;
    body: string;
    link?: string;
  }) {
    // Create Notification record (the in-app model)
    await prisma.notification.create({
      data: {
        userId: opts.user.id,
        type: opts.type,
        title: opts.title,
        message: opts.body,
        channels: ['in_app'],
        status: 'SENT',
        sentAt: new Date(),
        data: opts.link ? { link: opts.link } : undefined,
      },
    });

    // Also create Message record for unified tracking
    const message = await prisma.message.create({
      data: {
        senderId: 'system',
        recipientId: opts.user.id,
        channel: 'IN_APP',
        type: opts.type,
        subject: opts.title,
        body: opts.body,
        projectId: opts.projectId,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return message;
  }

  // -----------------------------------------------------------------------
  // WhatsApp via Twilio
  // -----------------------------------------------------------------------

  private async sendWhatsApp(opts: {
    user: { id: string; phone: string | null };
    projectId?: string;
    type: string;
    title: string;
    body: string;
  }) {
    const message = await prisma.message.create({
      data: {
        senderId: 'system',
        recipientId: opts.user.id,
        recipientPhone: opts.user.phone ?? undefined,
        channel: 'IN_APP', // Tracked as in-app in the channel field
        type: opts.type,
        body: `*${opts.title}*\n\n${opts.body}`,
        projectId: opts.projectId,
        status: 'PENDING',
        metadata: { channel: 'whatsapp' },
      },
    });

    const twilio = getTwilioConfig();
    if (twilio.accountSid && twilio.authToken && opts.user.phone) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`;
        const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString('base64');

        const params = new URLSearchParams();
        params.append('To', `whatsapp:${opts.user.phone}`);
        params.append('From', twilio.whatsappFrom);
        params.append('Body', `*${opts.title}*\n\n${opts.body}`);

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (res.ok) {
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
        } else {
          const errText = await res.text();
          await prisma.message.update({
            where: { id: message.id },
            data: { status: 'FAILED', failedAt: new Date(), errorMessage: errText },
          });
        }
      } catch (err) {
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: (err as Error).message,
          },
        });
      }
    } else {
      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      console.log(`[CommHub] WhatsApp (dev): to=${opts.user.phone} "${opts.title}"`);
    }

    return message;
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
        // Client's assigned user (clientId maps to Client.id, not User.id)
        if (project.client?.id) {
          // For client notifications, we use the PM as proxy or look up the client's user
          // Since Client model doesn't have a userId, we notify via project owner
          if (project.pmId) userIds.push(project.pmId);
        }
        break;

      case 'contractor':
        // Get contractors assigned to this project
        const contractorProjects = await prisma.contractorProject.findMany({
          where: { projectId },
          include: { contractor: true },
        });
        // Contractors don't have a direct userId, so we log the notification
        // In a real system, this would look up the contractor's user account
        for (const cp of contractorProjects) {
          console.log(`[CommHub] Contractor notification for: ${cp.contractor.email}`);
        }
        break;

      case 'pm':
        if (project.pmId) userIds.push(project.pmId);
        for (const pm of project.projectManagers) {
          if (!userIds.includes(pm.userId)) userIds.push(pm.userId);
        }
        break;

      case 'all':
        if (project.pmId) userIds.push(project.pmId);
        for (const pm of project.projectManagers) {
          if (!userIds.includes(pm.userId)) userIds.push(pm.userId);
        }
        break;
    }

    return userIds;
  }
}
