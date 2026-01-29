/**
 * Delivery Handler
 * Handle estimate delivery and notifications
 *
 * Note: This module uses the Estimate model with metadata to store delivery information
 * and order-related data since dedicated models (EstimationOrder, EstimateDelivery,
 * ScheduledReminder) do not exist in the schema.
 *
 * Notifications use the existing Notification model with the correct field structure:
 * - userId (required) instead of recipient email
 * - title/message instead of subject/body
 * - data (Json) instead of metadata
 */

import { PrismaClient, Estimate } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { EstimationOrder, OrderDeliverable } from './order-manager.js';

const prisma = new PrismaClient();

export interface DeliveryResult {
  id: string;
  orderId: string;
  deliverableId: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  recipients: DeliveryRecipient[];
  deliveredAt: Date;
  artifacts: DeliveryArtifact[];
  errors?: string[];
}

export interface DeliveryRecipient {
  email: string;
  name?: string;
  type: 'PRIMARY' | 'CC' | 'BCC';
  notified: boolean;
  notifiedAt?: Date;
}

export interface DeliveryArtifact {
  id: string;
  type: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  name: string;
  url: string;
  size: number;
  generatedAt: Date;
}

export interface DeliveryOptions {
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'ALL';
  includeBreakdown?: boolean;
  includeSummary?: boolean;
  includeNotes?: boolean;
  notifyRecipients?: boolean;
  recipients?: DeliveryRecipient[];
  message?: string;
}

export interface NotificationTemplate {
  id: string;
  type: 'ESTIMATE_READY' | 'REVISION_READY' | 'DEADLINE_REMINDER' | 'APPROVAL_REQUIRED';
  subject: string;
  body: string;
  variables: string[];
}

/**
 * Metadata structure stored in Estimate.metadata for order/delivery info
 */
interface EstimateOrderMetadata {
  orderInfo?: {
    type: string;
    priority: string;
    assignedTo?: string;
    dueDate?: string;
    estimatedHours?: number;
    notes?: string[];
    deliverables?: OrderDeliverable[];
  };
  deliveries?: DeliveryResult[];
  scheduledReminders?: ScheduledReminderData[];
}

/**
 * Structure for scheduled reminders stored in metadata
 */
interface ScheduledReminderData {
  id: string;
  scheduledFor: string;
  recipients: DeliveryRecipient[];
  message: string;
  status: 'PENDING' | 'SENT' | 'CANCELLED';
  sentAt?: string;
}

export class DeliveryHandler {
  /**
   * Deliver estimate
   */
  async deliverEstimate(
    orderId: string,
    deliverableId: string,
    options: DeliveryOptions
  ): Promise<DeliveryResult> {
    // Since EstimationOrder doesn't exist, we use Estimate directly
    const estimate = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!estimate) {
      throw new Error('Estimate/Order not found');
    }

    const result: DeliveryResult = {
      id: uuid(),
      orderId,
      deliverableId,
      status: 'SUCCESS',
      recipients: [],
      deliveredAt: new Date(),
      artifacts: [],
      errors: [],
    };

    try {
      // Generate artifacts
      const artifacts = await this.generateArtifacts(
        estimate.id,
        options
      );
      result.artifacts = artifacts;

      // Notify recipients if requested
      if (options.notifyRecipients && options.recipients) {
        result.recipients = await this.notifyRecipients(
          estimate,
          artifacts,
          options.recipients,
          options.message
        );
      }

      // Update deliverable status in metadata
      await this.updateDeliverableStatus(
        orderId,
        deliverableId,
        'COMPLETED',
        result.id
      );

      // Save delivery record in metadata
      await this.saveDeliveryRecord(orderId, result);

    } catch (error) {
      result.status = 'FAILED';
      result.errors = [String(error)];
    }

    return result;
  }

  /**
   * Generate delivery artifacts
   */
  private async generateArtifacts(
    estimateId: string,
    options: DeliveryOptions
  ): Promise<DeliveryArtifact[]> {
    const artifacts: DeliveryArtifact[] = [];
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const formats = options.format === 'ALL'
      ? ['PDF', 'EXCEL', 'CSV', 'JSON'] as const
      : [options.format];

    for (const format of formats) {
      // In production, this would generate actual files
      // For now, create artifact records
      const artifact: DeliveryArtifact = {
        id: uuid(),
        type: format,
        name: `${estimate.name.replace(/[^a-zA-Z0-9]/g, '_')}_Estimate.${format.toLowerCase()}`,
        url: `/exports/${estimateId}/${uuid()}.${format.toLowerCase()}`,
        size: this.estimateFileSize(format),
        generatedAt: new Date(),
      };

      artifacts.push(artifact);
    }

    return artifacts;
  }

  /**
   * Estimate file size
   */
  private estimateFileSize(format: string): number {
    const baseSizes: Record<string, number> = {
      PDF: 250000,
      EXCEL: 150000,
      CSV: 50000,
      JSON: 75000,
    };
    return baseSizes[format] || 100000;
  }

  /**
   * Notify recipients
   */
  private async notifyRecipients(
    estimate: Estimate,
    artifacts: DeliveryArtifact[],
    recipients: DeliveryRecipient[],
    message?: string
  ): Promise<DeliveryRecipient[]> {
    const notifiedRecipients: DeliveryRecipient[] = [];

    for (const recipient of recipients) {
      try {
        // In production, this would send actual emails
        // For now, simulate notification
        await this.sendNotification(recipient, estimate, artifacts, message);

        notifiedRecipients.push({
          ...recipient,
          notified: true,
          notifiedAt: new Date(),
        });
      } catch (error) {
        notifiedRecipients.push({
          ...recipient,
          notified: false,
        });
      }
    }

    return notifiedRecipients;
  }

  /**
   * Send notification using the actual Notification model structure
   * Notification model has: userId, type, title, message, data, channels, status, sentAt
   */
  private async sendNotification(
    recipient: DeliveryRecipient,
    estimate: Estimate,
    artifacts: DeliveryArtifact[],
    customMessage?: string
  ): Promise<void> {
    // Try to find user by email to get userId
    const user = await prisma.user.findUnique({
      where: { email: recipient.email },
    });

    if (!user) {
      // If user not found, we cannot create notification as userId is required
      // In production, you might send email directly instead
      console.warn(`Cannot create notification: User with email ${recipient.email} not found`);
      return;
    }

    // Create notification record using actual Notification model fields
    await prisma.notification.create({
      data: {
        id: uuid(),
        userId: user.id,
        type: 'ESTIMATE_DELIVERY',
        title: `Estimate Ready: ${estimate.name}`,
        message: customMessage || `The estimate "${estimate.name}" is ready for review.`,
        data: {
          estimateId: estimate.id,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          artifacts: artifacts.map((a: DeliveryArtifact) => ({
            id: a.id,
            type: a.type,
            name: a.name,
            url: a.url,
          })),
        },
        channels: ['email'],
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Update deliverable status in estimate metadata
   */
  private async updateDeliverableStatus(
    orderId: string,
    deliverableId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    resultId?: string
  ): Promise<void> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!estimate) return;

    const metadata = (estimate.metadata as EstimateOrderMetadata) || {};
    const deliverables = metadata.orderInfo?.deliverables || [];
    const index = deliverables.findIndex((d: OrderDeliverable) => d.id === deliverableId);

    if (index !== -1) {
      deliverables[index] = {
        ...deliverables[index],
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(resultId && { resultId }),
      };

      const updatedMetadata: EstimateOrderMetadata = {
        ...metadata,
        orderInfo: {
          type: metadata.orderInfo?.type || 'NEW_ESTIMATE',
          priority: metadata.orderInfo?.priority || 'MEDIUM',
          ...metadata.orderInfo,
          deliverables,
        },
      };

      await prisma.estimate.update({
        where: { id: orderId },
        data: {
          metadata: updatedMetadata as object,
        },
      });
    }
  }

  /**
   * Save delivery record in estimate metadata
   */
  private async saveDeliveryRecord(orderId: string, result: DeliveryResult): Promise<void> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!estimate) return;

    const metadata = (estimate.metadata as EstimateOrderMetadata) || {};
    const deliveries = metadata.deliveries || [];

    const updatedMetadata: EstimateOrderMetadata = {
      ...metadata,
      deliveries: [...deliveries, result],
    };

    await prisma.estimate.update({
      where: { id: orderId },
      data: {
        metadata: updatedMetadata as object,
      },
    });
  }

  /**
   * Get delivery history from estimate metadata
   */
  async getDeliveryHistory(
    orderId: string
  ): Promise<DeliveryResult[]> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!estimate) return [];

    const metadata = (estimate.metadata as EstimateOrderMetadata) || {};
    const deliveries = metadata.deliveries || [];

    return deliveries.map((d: DeliveryResult) => ({
      id: d.id,
      orderId: d.orderId,
      deliverableId: d.deliverableId,
      status: d.status,
      recipients: d.recipients || [],
      deliveredAt: new Date(d.deliveredAt),
      artifacts: d.artifacts || [],
      errors: d.errors || undefined,
    })).sort((a: DeliveryResult, b: DeliveryResult) => b.deliveredAt.getTime() - a.deliveredAt.getTime());
  }

  /**
   * Schedule reminder - stores in estimate metadata
   */
  async scheduleReminder(
    orderId: string,
    reminderDate: Date,
    recipients: DeliveryRecipient[],
    message: string
  ): Promise<{ scheduled: boolean; reminderId: string }> {
    const reminderId = uuid();

    const estimate = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!estimate) {
      throw new Error('Estimate/Order not found');
    }

    const metadata = (estimate.metadata as EstimateOrderMetadata) || {};
    const reminders = metadata.scheduledReminders || [];

    const newReminder: ScheduledReminderData = {
      id: reminderId,
      scheduledFor: reminderDate.toISOString(),
      recipients,
      message,
      status: 'PENDING',
    };

    const updatedMetadata: EstimateOrderMetadata = {
      ...metadata,
      scheduledReminders: [...reminders, newReminder],
    };

    await prisma.estimate.update({
      where: { id: orderId },
      data: {
        metadata: updatedMetadata as object,
      },
    });

    return { scheduled: true, reminderId };
  }

  /**
   * Get pending reminders from all estimates
   */
  async getPendingReminders(): Promise<
    {
      id: string;
      orderId: string;
      scheduledFor: Date;
      recipients: DeliveryRecipient[];
      message: string;
    }[]
  > {
    const now = new Date();

    // Get all estimates that might have reminders
    // Note: We fetch all estimates and filter in memory since JSON path filtering
    // with null checks varies by database provider
    const estimates = await prisma.estimate.findMany();

    const pendingReminders: {
      id: string;
      orderId: string;
      scheduledFor: Date;
      recipients: DeliveryRecipient[];
      message: string;
    }[] = [];

    for (const estimate of estimates) {
      const metadata = (estimate.metadata as EstimateOrderMetadata) || {};
      const reminders = metadata.scheduledReminders || [];

      for (const reminder of reminders) {
        const scheduledDate = new Date(reminder.scheduledFor);
        if (reminder.status === 'PENDING' && scheduledDate <= now) {
          pendingReminders.push({
            id: reminder.id,
            orderId: estimate.id,
            scheduledFor: scheduledDate,
            recipients: reminder.recipients,
            message: reminder.message,
          });
        }
      }
    }

    return pendingReminders;
  }

  /**
   * Send reminder
   */
  async sendReminder(reminderId: string): Promise<void> {
    // Find the estimate containing this reminder
    const estimates = await prisma.estimate.findMany();

    let targetEstimate: Estimate | null = null;
    let targetReminder: ScheduledReminderData | null = null;

    for (const estimate of estimates) {
      const metadata = (estimate.metadata as EstimateOrderMetadata) || {};
      const reminders = metadata.scheduledReminders || [];
      const reminder = reminders.find((r: ScheduledReminderData) => r.id === reminderId);
      if (reminder) {
        targetEstimate = estimate;
        targetReminder = reminder;
        break;
      }
    }

    if (!targetEstimate || !targetReminder) {
      throw new Error('Reminder not found');
    }

    // Send notification to each recipient
    for (const recipient of targetReminder.recipients) {
      // Try to find user by email
      const user = await prisma.user.findUnique({
        where: { email: recipient.email },
      });

      if (user) {
        await prisma.notification.create({
          data: {
            id: uuid(),
            userId: user.id,
            type: 'REMINDER',
            title: `Reminder: ${targetEstimate.name}`,
            message: targetReminder.message,
            data: {
              estimateId: targetEstimate.id,
              reminderId,
              recipientEmail: recipient.email,
            },
            channels: ['email'],
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      }
    }

    // Mark reminder as sent
    await this.updateReminderStatus(targetEstimate.id, reminderId, 'SENT');
  }

  /**
   * Update reminder status in estimate metadata
   */
  private async updateReminderStatus(
    estimateId: string,
    reminderId: string,
    status: 'PENDING' | 'SENT' | 'CANCELLED'
  ): Promise<void> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) return;

    const metadata = (estimate.metadata as EstimateOrderMetadata) || {};
    const reminders = metadata.scheduledReminders || [];
    const index = reminders.findIndex((r: ScheduledReminderData) => r.id === reminderId);

    if (index !== -1) {
      reminders[index] = {
        ...reminders[index],
        status,
        ...(status === 'SENT' && { sentAt: new Date().toISOString() }),
      };

      const updatedMetadata: EstimateOrderMetadata = {
        ...metadata,
        scheduledReminders: reminders,
      };

      await prisma.estimate.update({
        where: { id: estimateId },
        data: {
          metadata: updatedMetadata as object,
        },
      });
    }
  }

  /**
   * Cancel reminder
   */
  async cancelReminder(reminderId: string): Promise<void> {
    // Find the estimate containing this reminder
    const estimates = await prisma.estimate.findMany();

    for (const estimate of estimates) {
      const metadata = (estimate.metadata as EstimateOrderMetadata) || {};
      const reminders = metadata.scheduledReminders || [];
      const reminder = reminders.find((r: ScheduledReminderData) => r.id === reminderId);
      if (reminder) {
        await this.updateReminderStatus(estimate.id, reminderId, 'CANCELLED');
        return;
      }
    }

    throw new Error('Reminder not found');
  }

  /**
   * Get notification templates
   */
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    // Return default templates
    return [
      {
        id: 'ESTIMATE_READY',
        type: 'ESTIMATE_READY',
        subject: 'Estimate Ready: {{projectName}}',
        body: 'The estimate for "{{projectName}}" has been completed and is ready for review.\n\nTotal: {{total}}\n\nPlease review at your earliest convenience.',
        variables: ['projectName', 'total', 'estimatorName', 'dueDate'],
      },
      {
        id: 'REVISION_READY',
        type: 'REVISION_READY',
        subject: 'Estimate Revision Ready: {{projectName}}',
        body: 'A revised estimate for "{{projectName}}" is now available.\n\nChanges: {{changesSummary}}\n\nNew Total: {{total}}',
        variables: ['projectName', 'total', 'changesSummary', 'revisionNumber'],
      },
      {
        id: 'DEADLINE_REMINDER',
        type: 'DEADLINE_REMINDER',
        subject: 'Deadline Approaching: {{projectName}}',
        body: 'The deadline for "{{projectName}}" is approaching.\n\nDue Date: {{dueDate}}\n\nPlease ensure all deliverables are completed.',
        variables: ['projectName', 'dueDate', 'daysRemaining'],
      },
      {
        id: 'APPROVAL_REQUIRED',
        type: 'APPROVAL_REQUIRED',
        subject: 'Approval Required: {{projectName}}',
        body: 'The estimate for "{{projectName}}" requires your approval.\n\nTotal: {{total}}\n\nPlease review and approve or provide feedback.',
        variables: ['projectName', 'total', 'approverName'],
      },
    ];
  }
}

export const deliveryHandler = new DeliveryHandler();
