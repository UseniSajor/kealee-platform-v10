/**
 * APP-08: COMMUNICATION HUB
 * Centralized communication management (email, SMS, notifications)
 * Automation Level: 95%
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { sendEmail, sendBulkEmails } from '../../../shared/integrations/email.js';
import { sendSMS, sendBulkSMS } from '../../../shared/integrations/sms.js';
import { formatDate, formatDateTime } from '../../../shared/utils/date.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('communication-hub');

// ============================================================================
// TYPES
// ============================================================================

type MessageChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';
type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

interface Message {
  id: string;
  projectId?: string;
  channel: MessageChannel;
  priority: MessagePriority;
  status: MessageStatus;
  recipientType: 'user' | 'contractor' | 'client' | 'group';
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

interface MessageTemplate {
  id: string;
  name: string;
  channel: MessageChannel;
  category: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  variables: string[];
  active: boolean;
}

interface NotificationPreference {
  userId: string;
  channel: MessageChannel;
  category: string;
  enabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface CommunicationLog {
  projectId: string;
  messages: Message[];
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  byChannel: Record<MessageChannel, number>;
}

interface BroadcastRequest {
  projectId?: string;
  channels: MessageChannel[];
  recipientGroups: string[];
  subject?: string;
  message: string;
  priority: MessagePriority;
  scheduledAt?: Date;
}

// ============================================================================
// COMMUNICATION SERVICE
// ============================================================================

class CommunicationService {
  /**
   * Get message templates by category
   */
  async getTemplates(category?: string): Promise<MessageTemplate[]> {
    const templates = await prisma.messageTemplate.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: { name: 'asc' },
    });

    return templates as unknown as MessageTemplate[];
  }

  /**
   * Render template with variables
   */
  renderTemplate(
    template: MessageTemplate,
    data: Record<string, any>
  ): { subject?: string; body: string; htmlBody?: string } {
    let subject = template.subject;
    let body = template.body;
    let htmlBody = template.htmlBody;

    // Replace variables
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      const stringValue = String(value);

      if (subject) {
        subject = subject.replace(new RegExp(placeholder, 'g'), stringValue);
      }
      body = body.replace(new RegExp(placeholder, 'g'), stringValue);
      if (htmlBody) {
        htmlBody = htmlBody.replace(new RegExp(placeholder, 'g'), stringValue);
      }
    }

    return { subject, body, htmlBody };
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    return preferences as unknown as NotificationPreference[];
  }

  /**
   * Check if notification is allowed based on preferences
   */
  async isNotificationAllowed(
    userId: string,
    channel: MessageChannel,
    category: string
  ): Promise<boolean> {
    const preference = await prisma.notificationPreference.findFirst({
      where: { userId, category },
    });

    if (!preference) {
      return false;
    }

    // Check if this channel is enabled
    const channelEnabled =
      (channel === 'EMAIL' && preference.emailEnabled) ||
      (channel === 'SMS' && preference.smsEnabled) ||
      (channel === 'PUSH' && preference.pushEnabled) ||
      (channel === 'IN_APP' && preference.inAppEnabled);

    if (!channelEnabled) {
      return false;
    }

    // Check quiet hours
    if ((preference as any).quietHoursStart && (preference as any).quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (
        currentTime >= (preference as any).quietHoursStart &&
        currentTime <= (preference as any).quietHoursEnd
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get recipients for a group
   */
  async getGroupRecipients(
    groupType: string,
    projectId?: string
  ): Promise<Array<{ id: string; email?: string; phone?: string; name: string }>> {
    switch (groupType) {
      case 'project-managers':
        if (!projectId) return [];
        const pms = await prisma.projectManager.findMany({
          where: { projectId },
          include: { user: true },
        });
        return pms.map((pm: any) => ({
          id: pm.userId,
          email: pm.user.email,
          phone: pm.user.phone,
          name: pm.user.name,
        }));

      case 'contractors':
        if (!projectId) return [];
        const contractors = await prisma.contractorProject.findMany({
          where: { projectId },
          include: { contractor: true },
        });
        return contractors.map((cp: any) => ({
          id: cp.contractorId,
          email: cp.contractor.email,
          phone: cp.contractor.phone,
          name: cp.contractor.companyName,
        }));

      case 'clients':
        if (!projectId) return [];
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { client: true },
        });
        if (!project?.client) return [];
        return [{
          id: (project as any).clientId,
          email: (project.client as any).email,
          phone: (project.client as any).phone,
          name: (project.client as any).name,
        }];

      case 'all-users':
        const users = await prisma.user.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, email: true, phone: true, name: true },
        });
        return users as any;

      default:
        return [];
    }
  }

  /**
   * Get communication log for project
   */
  async getCommunicationLog(projectId: string): Promise<CommunicationLog> {
    const messages = await prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const byChannel: Record<MessageChannel, number> = {
      EMAIL: 0,
      SMS: 0,
      PUSH: 0,
      IN_APP: 0,
    };

    let totalDelivered = 0;
    let totalFailed = 0;

    for (const msg of messages) {
      byChannel[(msg as any).channel as MessageChannel]++;
      if ((msg as any).status === 'delivered') totalDelivered++;
      if ((msg as any).status === 'failed') totalFailed++;
    }

    return {
      projectId,
      messages: messages as unknown as Message[],
      totalSent: messages.length,
      totalDelivered,
      totalFailed,
      byChannel,
    };
  }
}

const communicationService = new CommunicationService();

// ============================================================================
// WORKER
// ============================================================================

async function processCommunicationJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'SEND_MESSAGE':
      return await sendMessage(data);

    case 'SEND_TEMPLATED':
      return await sendTemplatedMessage(data);

    case 'BROADCAST':
      return await broadcastMessage(data);

    case 'SEND_SCHEDULED':
      return await sendScheduledMessages();

    case 'DIGEST_NOTIFICATIONS':
      return await sendDigestNotifications();

    case 'PROJECT_UPDATE':
      return await sendProjectUpdate(data);

    case 'MARK_DELIVERED':
      return await markMessageDelivered(data.messageId);

    case 'MARK_READ':
      return await markMessageRead(data.messageId);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function sendMessage(data: {
  channel: MessageChannel;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  projectId?: string;
  priority?: MessagePriority;
  metadata?: Record<string, any>;
}) {
  // Create message record
  const message = await prisma.message.create({
    data: {
      channel: data.channel,
      recipientType: 'user',
      recipientId: data.recipientId,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      subject: data.subject,
      body: data.body,
      htmlBody: data.htmlBody,
      projectId: data.projectId,
      priority: data.priority || 'normal',
      status: 'pending',
      metadata: data.metadata as any,
    } as any,
  });

  try {
    // Send based on channel
    switch (data.channel) {
      case 'EMAIL':
        if (!data.recipientEmail) throw new Error('Email required');
        await sendEmail({
          to: data.recipientEmail,
          subject: data.subject || 'Notification',
          text: data.body,
          html: data.htmlBody,
        });
        break;

      case 'SMS':
        if (!data.recipientPhone) throw new Error('Phone required');
        await sendSMS({
          to: data.recipientPhone,
          body: data.body,
        });
        break;

      case 'PUSH':
        // Push notification would integrate with FCM/APNS
        console.log(`Push notification to ${data.recipientId}: ${data.body}`);
        break;

      case 'IN_APP':
        // In-app notification is already stored
        break;
    }

    // Update status
    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      } as any,
    });

    return { messageId: message.id, status: 'sent' };
  } catch (error) {
    // Update with error
    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: 'failed',
        error: String(error),
      } as any,
    });

    throw error;
  }
}

async function sendTemplatedMessage(data: {
  templateId: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  templateData: Record<string, any>;
  projectId?: string;
  priority?: MessagePriority;
}) {
  // Get template
  const template = await prisma.messageTemplate.findUnique({
    where: { id: data.templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Render template
  const rendered = communicationService.renderTemplate(
    template as unknown as MessageTemplate,
    data.templateData
  );

  // Send message
  return await sendMessage({
    channel: (template as any).channel,
    recipientId: data.recipientId,
    recipientEmail: data.recipientEmail,
    recipientPhone: data.recipientPhone,
    subject: rendered.subject,
    body: rendered.body,
    htmlBody: rendered.htmlBody,
    projectId: data.projectId,
    priority: data.priority,
    metadata: { templateId: data.templateId, templateData: data.templateData },
  });
}

async function broadcastMessage(data: BroadcastRequest) {
  const recipients: Array<{ id: string; email?: string; phone?: string }> = [];

  // Gather all recipients
  for (const group of data.recipientGroups) {
    const groupRecipients = await communicationService.getGroupRecipients(
      group,
      data.projectId
    );
    recipients.push(...groupRecipients);
  }

  // Deduplicate by ID
  const uniqueRecipients = Array.from(
    new Map(recipients.map(r => [r.id, r])).values()
  );

  const results = {
    total: uniqueRecipients.length,
    sent: 0,
    failed: 0,
    messages: [] as string[],
  };

  // Send to each channel
  for (const channel of data.channels) {
    for (const recipient of uniqueRecipients) {
      try {
        // Check preferences if not urgent
        if (data.priority !== 'urgent') {
          const allowed = await communicationService.isNotificationAllowed(
            recipient.id,
            channel,
            'broadcast'
          );
          if (!allowed) continue;
        }

        const result = await sendMessage({
          channel,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          subject: data.subject,
          body: data.message,
          projectId: data.projectId,
          priority: data.priority,
        });

        results.sent++;
        results.messages.push(result.messageId);
      } catch (error) {
        results.failed++;
      }
    }
  }

  // Emit event
  await eventBus.publish(EVENT_TYPES.COMMUNICATION_BROADCAST, {
    projectId: data.projectId,
    channels: data.channels,
    recipientCount: results.total,
    sentCount: results.sent,
  });

  return results;
}

async function sendScheduledMessages() {
  const now = new Date();

  const scheduledMessages = await prisma.message.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lte: now },
    },
  });

  const results = [];
  for (const message of scheduledMessages) {
    try {
      // Re-send the message
      await sendMessage({
        channel: (message as any).channel,
        recipientId: (message as any).recipientId,
        recipientEmail: (message as any).recipientEmail,
        recipientPhone: (message as any).recipientPhone,
        subject: (message as any).subject,
        body: (message as any).body,
        htmlBody: (message as any).htmlBody,
        projectId: (message as any).projectId,
        priority: (message as any).priority,
      });

      results.push({ messageId: message.id, status: 'sent' });
    } catch (error) {
      results.push({ messageId: message.id, status: 'failed', error: String(error) });
    }
  }

  return { processed: results.length, results };
}

async function sendDigestNotifications() {
  // Get users who prefer digest notifications
  const digestPrefs = await prisma.notificationPreference.findMany({
    where: {
      frequency: 'DAILY_DIGEST',
      emailEnabled: true,
    },
    include: { user: true },
  });

  const results = [];

  for (const pref of digestPrefs) {
    // Get unread in-app notifications from last 24 hours
    const notifications = await prisma.message.findMany({
      where: {
        recipientId: (pref as any).userId,
        channel: 'IN_APP',
        status: { in: ['sent', 'delivered'] },
        readAt: null,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (notifications.length === 0) continue;

    // Send digest email
    const digestHtml = `
      <h2>Your Daily Notification Digest</h2>
      <p>You have ${notifications.length} unread notifications:</p>
      <ul>
        ${notifications.map(n => `
          <li>
            <strong>${(n as any).subject || 'Notification'}</strong><br>
            ${(n as any).body}<br>
            <small>${formatDateTime((n as any).createdAt)}</small>
          </li>
        `).join('')}
      </ul>
    `;

    try {
      await sendEmail({
        to: (pref as any).user.email,
        subject: `Daily Digest: ${notifications.length} notifications`,
        html: digestHtml,
      });

      results.push({ userId: (pref as any).userId, notifications: notifications.length });
    } catch (error) {
      results.push({ userId: (pref as any).userId, error: String(error) });
    }
  }

  return { digestsSent: results.length, results };
}

async function sendProjectUpdate(data: {
  projectId: string;
  updateType: string;
  title: string;
  message: string;
  importance: 'routine' | 'important' | 'critical';
}) {
  // Get all project stakeholders
  const recipientGroups = ['project-managers', 'clients'];
  if (data.importance === 'critical') {
    recipientGroups.push('contractors');
  }

  const priority: MessagePriority = data.importance === 'critical'
    ? 'urgent'
    : data.importance === 'important'
      ? 'high'
      : 'normal';

  // Broadcast update
  return await broadcastMessage({
    projectId: data.projectId,
    channels: data.importance === 'critical' ? ['EMAIL', 'SMS', 'IN_APP'] : ['EMAIL', 'IN_APP'],
    recipientGroups,
    subject: `[${data.updateType}] ${data.title}`,
    message: data.message,
    priority,
  });
}

async function markMessageDelivered(messageId: string) {
  const message = await prisma.message.update({
    where: { id: messageId },
    data: {
      status: 'delivered',
      deliveredAt: new Date(),
    } as any,
  });

  return message;
}

async function markMessageRead(messageId: string) {
  const message = await prisma.message.update({
    where: { id: messageId },
    data: {
      status: 'read',
      readAt: new Date(),
    } as any,
  });

  return message;
}

// Subscribe to events for automatic notifications
eventBus.subscribe(EVENT_TYPES.INSPECTION_SCHEDULED, async (event) => {
  const eventData = event.data as { projectId?: string; type?: string; scheduledDate?: Date };
  await queues.COMMUNICATION.add(
    'inspection-notification',
    {
      type: 'PROJECT_UPDATE',
      projectId: eventData.projectId,
      updateType: 'INSPECTION',
      title: `${eventData.type} Inspection Scheduled`,
      message: `An inspection has been scheduled for ${formatDate(eventData.scheduledDate || new Date())}`,
      importance: 'important',
    },
    JOB_OPTIONS.DEFAULT
  );
});

eventBus.subscribe(EVENT_TYPES.BUDGET_ALERT, async (event) => {
  const eventData = event.data as { severity?: string; projectId?: string; message?: string };
  if (eventData.severity === 'critical') {
    await queues.COMMUNICATION.add(
      'budget-alert-notification',
      {
        type: 'PROJECT_UPDATE',
        projectId: eventData.projectId,
        updateType: 'BUDGET ALERT',
        title: 'Critical Budget Alert',
        message: eventData.message,
        importance: 'critical',
      },
      JOB_OPTIONS.HIGH_PRIORITY
    );
  }
});

// Create worker
export const communicationWorker = createWorker(
  QUEUE_NAMES.COMMUNICATION,
  processCommunicationJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function communicationRoutes(fastify: FastifyInstance) {
  /**
   * Send a message
   */
  fastify.post('/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      channel: MessageChannel;
      recipientId: string;
      recipientEmail?: string;
      recipientPhone?: string;
      subject?: string;
      body: string;
      htmlBody?: string;
      projectId?: string;
      priority?: MessagePriority;
    };

    const job = await queues.COMMUNICATION.add(
      'send-message',
      { type: 'SEND_MESSAGE', ...data },
      data.priority === 'urgent' ? JOB_OPTIONS.HIGH_PRIORITY : JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'queued' };
  });

  /**
   * Send templated message
   */
  fastify.post('/send-templated', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      templateId: string;
      recipientId: string;
      recipientEmail?: string;
      recipientPhone?: string;
      templateData: Record<string, any>;
      projectId?: string;
      priority?: MessagePriority;
    };

    const job = await queues.COMMUNICATION.add(
      'send-templated',
      { type: 'SEND_TEMPLATED', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'queued' };
  });

  /**
   * Broadcast message
   */
  fastify.post('/broadcast', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as BroadcastRequest;

    const job = await queues.COMMUNICATION.add(
      'broadcast',
      { type: 'BROADCAST', ...data },
      data.priority === 'urgent' ? JOB_OPTIONS.HIGH_PRIORITY : JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'queued' };
  });

  /**
   * Get message templates
   */
  fastify.get('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const { category } = request.query as { category?: string };

    const templates = await communicationService.getTemplates(category);
    return { templates };
  });

  /**
   * Get template by ID
   */
  fastify.get('/templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const template = await prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    return template;
  });

  /**
   * Create message template
   */
  fastify.post('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as Omit<MessageTemplate, 'id'>;

    const template = await prisma.messageTemplate.create({
      data: {
        ...data,
        variables: data.variables || [],
      } as any,
    });

    return template;
  });

  /**
   * Get user notifications (in-app)
   */
  fastify.get('/notifications/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { unreadOnly = 'false' } = request.query as { unreadOnly?: string };

    const messages = await prisma.message.findMany({
      where: {
        recipientId: userId,
        channel: 'IN_APP',
        ...(unreadOnly === 'true' && { readAt: null }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { notifications: messages };
  });

  /**
   * Mark notification as read
   */
  fastify.post('/notifications/:messageId/read', async (request: FastifyRequest, reply: FastifyReply) => {
    const { messageId } = request.params as { messageId: string };

    const message = await markMessageRead(messageId);
    return message;
  });

  /**
   * Get user notification preferences
   */
  fastify.get('/preferences/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };

    const preferences = await communicationService.getUserPreferences(userId);
    return { preferences };
  });

  /**
   * Update notification preferences
   */
  fastify.put('/preferences/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const preferences = request.body as NotificationPreference[];

    // Upsert each preference
    for (const pref of preferences) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_channel_category: {
            userId,
            channel: pref.channel,
            category: pref.category,
          },
        } as any,
        update: {
          enabled: pref.enabled,
          quietHoursStart: pref.quietHoursStart,
          quietHoursEnd: pref.quietHoursEnd,
        } as any,
        create: {
          userId,
          channel: pref.channel,
          category: pref.category,
          enabled: pref.enabled,
          quietHoursStart: pref.quietHoursStart,
          quietHoursEnd: pref.quietHoursEnd,
        } as any,
      });
    }

    return { updated: preferences.length };
  });

  /**
   * Get project communication log
   */
  fastify.get('/projects/:projectId/log', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const log = await communicationService.getCommunicationLog(projectId);
    return log;
  });

  /**
   * Send project update
   */
  fastify.post('/projects/:projectId/update', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { updateType, title, message, importance } = request.body as {
      updateType: string;
      title: string;
      message: string;
      importance: 'routine' | 'important' | 'critical';
    };

    const job = await queues.COMMUNICATION.add(
      'project-update',
      {
        type: 'PROJECT_UPDATE',
        projectId,
        updateType,
        title,
        message,
        importance,
      },
      importance === 'critical' ? JOB_OPTIONS.HIGH_PRIORITY : JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'queued' };
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      sentToday,
      failedToday,
      unreadNotifications,
      byChannel,
    ] = await Promise.all([
      prisma.message.count({
        where: { sentAt: { gte: today }, status: 'sent' },
      }),
      prisma.message.count({
        where: { createdAt: { gte: today }, status: 'failed' },
      }),
      prisma.message.count({
        where: { channel: 'IN_APP', readAt: null },
      }),
      prisma.message.groupBy({
        by: ['channel'],
        where: { sentAt: { gte: today } },
        _count: true,
      }),
    ]);

    return {
      sentToday,
      failedToday,
      unreadNotifications,
      byChannel: byChannel.reduce((acc: any, item: any) => {
        acc[item.channel] = item._count;
        return acc;
      }, {}),
    };
  });
}
