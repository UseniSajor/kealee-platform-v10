import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, DOCS_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Config per architecture doc S11
// ---------------------------------------------------------------------------
const CLAW_CONFIG = {
  name: 'docs-communication-claw',
  eventPatterns: [
    'contract.*', 'changeorder.*', 'permit.*',
    'schedule.*', 'decision.*', 'budget.*',
  ],
  writableModels: [
    'Document', 'DocumentTemplate', 'GeneratedDocument',
    'CommunicationLog', 'CommunicationTemplate',
    'Conversation', 'Message', 'MessageAttachment',
    'ConversationParticipant', 'MessageRead',
  ],
};

// ---------------------------------------------------------------------------
// GUARDRAILS -- enforced at claw level
// ---------------------------------------------------------------------------
// 1. PURE REPRESENTATION LAYER -- never mutates domain data
// 2. Cannot mutate contracts, budgets, schedules, or any domain data
// 3. Cannot make decisions or recommendations
// 4. Cannot trigger financial transactions

/**
 * Claw F -- Docs & Communication
 *
 * PURE REPRESENTATION LAYER: generates documents, sends communications,
 * routes @kealee messages -- but never mutates domain data.
 *
 * Workers:
 *   doc-generator    -- PDF generation, template rendering, e-signatures, AI narratives
 *   comms-hub        -- Email (Resend), SMS (Twilio link-back only), in-app (WebSocket)
 *   kealee-messenger -- @kealee detection, context gathering, AI query + action routing
 */
export class DocsCommunicationClaw extends BaseClaw {
  private ai: AIProvider;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();
  }

  // -------------------------------------------------------------------------
  // Event router
  // -------------------------------------------------------------------------
  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    switch (event.type) {
      // Contract executed -- generate signed contract document
      case 'contract.executed': {
        const docQueue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
        await docQueue.add('generate-contract-doc', {
          event,
          projectId: event.projectId,
          organizationId: event.organizationId,
          contractId: (event.payload as any).contractId,
          documentType: 'CONTRACT',
        });

        // Notify all parties
        const commsQueue = createQueue(KEALEE_QUEUES.COMMUNICATION);
        await commsQueue.add('send-notification', {
          event,
          projectId: event.projectId,
          type: 'CONTRACT_EXECUTED',
          channel: 'EMAIL',
          metadata: { contractId: (event.payload as any).contractId },
        });
        break;
      }

      // Change order approved -- generate CO document
      case 'changeorder.approved': {
        const docQueue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
        await docQueue.add('generate-change-order-doc', {
          event,
          projectId: event.projectId,
          organizationId: event.organizationId,
          changeOrderId: (event.payload as any).changeOrderId,
          documentType: 'CHANGE_ORDER',
        });
        break;
      }

      // Permit status changed -- notify PM and generate status document
      case 'permit.status.changed': {
        const commsQueue = createQueue(KEALEE_QUEUES.COMMUNICATION);
        await commsQueue.add('send-notification', {
          event,
          projectId: event.projectId,
          type: 'PERMIT_STATUS_UPDATE',
          channel: 'EMAIL',
          metadata: {
            permitId: (event.payload as any).permitId,
            previousStatus: (event.payload as any).previousStatus,
            newStatus: (event.payload as any).newStatus,
          },
        });
        break;
      }

      // Schedule updated -- notify relevant parties
      case 'schedule.updated': {
        const commsQueue = createQueue(KEALEE_QUEUES.COMMUNICATION);
        await commsQueue.add('send-notification', {
          event,
          projectId: event.projectId,
          type: 'SCHEDULE_UPDATE',
          channel: 'IN_APP',
          metadata: event.payload as Record<string, unknown>,
        });
        break;
      }

      // Decision recommended -- notify PM for review
      case 'decision.recommended': {
        const commsQueue = createQueue(KEALEE_QUEUES.COMMUNICATION);
        await commsQueue.add('send-notification', {
          event,
          projectId: event.projectId,
          type: 'DECISION_RECOMMENDED',
          channel: 'EMAIL',
          metadata: {
            decisionId: (event.payload as any).decisionId,
            recommendation: (event.payload as any).recommendation,
          },
        });
        break;
      }

      // Budget alert -- high-priority notification
      case 'budget.alert.variance.high': {
        const commsQueue = createQueue(KEALEE_QUEUES.COMMUNICATION);
        await commsQueue.add('send-notification', {
          event,
          projectId: event.projectId,
          type: 'BUDGET_VARIANCE_ALERT',
          channel: 'EMAIL',
          priority: 'HIGH',
          metadata: event.payload as Record<string, unknown>,
        });

        // Also send SMS link-back for high-priority budget alerts
        await commsQueue.add('send-sms-linkback', {
          event,
          projectId: event.projectId,
          type: 'BUDGET_VARIANCE_ALERT',
          metadata: event.payload as Record<string, unknown>,
        });
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Worker registration
  // -------------------------------------------------------------------------
  async registerWorkers(): Promise<void> {
    // --- Document Generator Worker ---
    createWorker(KEALEE_QUEUES.DOCUMENT_GEN, async (job: Job) => {
      switch (job.name) {
        case 'generate-contract-doc':
          await this.handleGenerateContractDoc(job);
          break;
        case 'generate-change-order-doc':
          await this.handleGenerateChangeOrderDoc(job);
          break;
        case 'generate-aia-g702':
          await this.handleGenerateAiaG702(job);
          break;
        case 'generate-aia-g703':
          await this.handleGenerateAiaG703(job);
          break;
        case 'generate-lien-waiver':
          await this.handleGenerateLienWaiver(job);
          break;
        case 'generate-rfi':
          await this.handleGenerateRfi(job);
          break;
        case 'generate-ai-narrative':
          await this.handleGenerateAiNarrative(job);
          break;
        case 'request-esignature':
          await this.handleRequestESignature(job);
          break;
      }
    });

    // --- Communications Hub Worker ---
    createWorker(KEALEE_QUEUES.COMMUNICATION, async (job: Job) => {
      switch (job.name) {
        case 'send-notification':
          await this.handleSendNotification(job);
          break;
        case 'send-email':
          await this.handleSendEmail(job);
          break;
        case 'send-sms-linkback':
          await this.handleSendSmsLinkback(job);
          break;
        case 'send-in-app':
          await this.handleSendInApp(job);
          break;
        case 'broadcast':
          await this.handleBroadcast(job);
          break;
      }
    });

    // --- Kealee Messenger Worker ---
    // Uses COMMUNICATION queue with 'kealee-messenger-*' job name prefix
    // to avoid a separate queue while maintaining logical separation
    createWorker(KEALEE_QUEUES.COMMUNICATION, async (job: Job) => {
      if (job.name.startsWith('kealee-messenger-')) {
        switch (job.name) {
          case 'kealee-messenger-detect':
            await this.handleKealeeMentionDetect(job);
            break;
          case 'kealee-messenger-query':
            await this.handleKealeeQuery(job);
            break;
          case 'kealee-messenger-action':
            await this.handleKealeeAction(job);
            break;
        }
      }
    }, { concurrency: 3 });
  }

  // =========================================================================
  // DOCUMENT GENERATOR -- Worker Handlers
  // =========================================================================

  /**
   * Generate a signed contract document (PDF).
   */
  private async handleGenerateContractDoc(job: Job): Promise<void> {
    const { contractId, projectId, organizationId, event } = job.data as {
      contractId: string;
      projectId: string;
      organizationId: string;
      event: KealeeEventEnvelope;
    };

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: true },
    });
    if (!contract) return;

    // Find or create the contract template
    const template = await this.prisma.documentTemplate.findFirst({
      where: { type: 'CONTRACT', isActive: true },
    });

    this.assertWritable('Document');

    const document = await this.prisma.document.create({
      data: {
        projectId,
        templateId: template?.id ?? null,
        type: 'CONTRACT',
        category: 'CONTRACTS',
        name: `Contract - ${(contract as any).project?.name ?? contractId}`,
        content: {
          contractId,
          parties: (contract as any).parties,
          terms: (contract as any).terms,
          amount: (contract as any).amount,
          startDate: (contract as any).startDate,
          endDate: (contract as any).endDate,
        },
        format: 'PDF',
        status: 'GENERATED',
      },
    });

    this.assertWritable('GeneratedDocument');

    await this.prisma.generatedDocument.create({
      data: {
        projectId,
        type: 'CONTRACT',
        category: 'CONTRACTS',
        name: document.name,
        content: document.content,
        format: 'PDF',
        status: 'DRAFT',
      },
    });

    // Publish document.generated
    const docEvent = createEvent({
      type: EVENT_TYPES.document.generated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        documentId: document.id,
        documentType: 'CONTRACT',
        contractId,
      },
      entity: { type: 'Document', id: document.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(docEvent);
  }

  /**
   * Generate a change order document (PDF).
   */
  private async handleGenerateChangeOrderDoc(job: Job): Promise<void> {
    const { changeOrderId, projectId, organizationId, event } = job.data as {
      changeOrderId: string;
      projectId: string;
      organizationId: string;
      event: KealeeEventEnvelope;
    };

    const changeOrder = await this.prisma.changeOrder.findUnique({
      where: { id: changeOrderId },
      include: { lineItems: true },
    });
    if (!changeOrder) return;

    this.assertWritable('Document');

    const document = await this.prisma.document.create({
      data: {
        projectId,
        type: 'CHANGE_ORDER',
        category: 'CONTRACTS',
        name: `Change Order #${(changeOrder as any).number ?? changeOrderId}`,
        content: {
          changeOrderId,
          reason: (changeOrder as any).reason,
          amount: (changeOrder as any).amount,
          lineItems: changeOrder.lineItems,
        },
        format: 'PDF',
        status: 'GENERATED',
      },
    });

    const docEvent = createEvent({
      type: EVENT_TYPES.document.generated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        documentId: document.id,
        documentType: 'CHANGE_ORDER',
        changeOrderId,
      },
      entity: { type: 'Document', id: document.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(docEvent);
  }

  /**
   * Generate AIA G702 -- Application and Certificate for Payment.
   */
  private async handleGenerateAiaG702(job: Job): Promise<void> {
    const { projectId, organizationId, periodEnd, contractId } = job.data as {
      projectId: string;
      organizationId: string;
      periodEnd: string;
      contractId: string;
    };

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) return;

    // AI generates the payment application narrative
    const narrative = await this.ai.reason({
      task:
        'Generate the narrative sections for an AIA G702 Application and Certificate ' +
        'for Payment. Include work completed this period, materials stored, and ' +
        'current completion percentage per division.',
      context: {
        contractAmount: (contract as any).amount,
        periodEnd,
        projectId,
      },
      systemPrompt: DOCS_PROMPT,
    });

    this.assertWritable('GeneratedDocument');

    const doc = await this.prisma.generatedDocument.create({
      data: {
        projectId,
        type: 'AIA_G702',
        category: 'FINANCIAL',
        name: `AIA G702 - Period ending ${periodEnd}`,
        content: { narrative, contractId, periodEnd },
        format: 'PDF',
        status: 'DRAFT',
      },
    });

    const docEvent = createEvent({
      type: EVENT_TYPES.document.generated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: { documentId: doc.id, documentType: 'AIA_G702' },
      entity: { type: 'GeneratedDocument', id: doc.id },
    });
    await this.eventBus.publish(docEvent);
  }

  /**
   * Generate AIA G703 -- Continuation Sheet (schedule of values).
   */
  private async handleGenerateAiaG703(job: Job): Promise<void> {
    const { projectId, organizationId, contractId, periodEnd } = job.data as {
      projectId: string;
      organizationId: string;
      contractId: string;
      periodEnd: string;
    };

    this.assertWritable('GeneratedDocument');

    const doc = await this.prisma.generatedDocument.create({
      data: {
        projectId,
        type: 'AIA_G703',
        category: 'FINANCIAL',
        name: `AIA G703 - Continuation Sheet - ${periodEnd}`,
        content: { contractId, periodEnd },
        format: 'PDF',
        status: 'DRAFT',
      },
    });

    const docEvent = createEvent({
      type: EVENT_TYPES.document.generated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: { documentId: doc.id, documentType: 'AIA_G703' },
      entity: { type: 'GeneratedDocument', id: doc.id },
    });
    await this.eventBus.publish(docEvent);
  }

  /**
   * Generate a lien waiver document.
   */
  private async handleGenerateLienWaiver(job: Job): Promise<void> {
    const { projectId, organizationId, waiverType, contractorId, amount, throughDate } =
      job.data as {
        projectId: string;
        organizationId: string;
        waiverType: 'CONDITIONAL_PROGRESS' | 'UNCONDITIONAL_PROGRESS' | 'CONDITIONAL_FINAL' | 'UNCONDITIONAL_FINAL';
        contractorId: string;
        amount: number;
        throughDate: string;
      };

    this.assertWritable('GeneratedDocument');

    const doc = await this.prisma.generatedDocument.create({
      data: {
        projectId,
        type: 'LIEN_WAIVER',
        category: 'LEGAL',
        name: `Lien Waiver - ${waiverType} - ${throughDate}`,
        content: { waiverType, contractorId, amount, throughDate },
        format: 'PDF',
        status: 'DRAFT',
        signatureStatus: 'PENDING',
      },
    });

    const docEvent = createEvent({
      type: EVENT_TYPES.document.generated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: { documentId: doc.id, documentType: 'LIEN_WAIVER', waiverType },
      entity: { type: 'GeneratedDocument', id: doc.id },
    });
    await this.eventBus.publish(docEvent);
  }

  /**
   * Generate an RFI (Request for Information) document.
   */
  private async handleGenerateRfi(job: Job): Promise<void> {
    const { projectId, organizationId, subject, description, to, from, discipline } =
      job.data as {
        projectId: string;
        organizationId: string;
        subject: string;
        description: string;
        to: string;
        from: string;
        discipline?: string;
      };

    this.assertWritable('Document');

    const doc = await this.prisma.document.create({
      data: {
        projectId,
        type: 'RFI',
        category: 'ADMINISTRATIVE',
        name: `RFI - ${subject}`,
        content: { subject, description, to, from, discipline },
        format: 'PDF',
        status: 'GENERATED',
      },
    });

    const docEvent = createEvent({
      type: EVENT_TYPES.document.generated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: { documentId: doc.id, documentType: 'RFI' },
      entity: { type: 'Document', id: doc.id },
    });
    await this.eventBus.publish(docEvent);
  }

  /**
   * Generate an AI narrative for a document (e.g. executive summary, report).
   */
  private async handleGenerateAiNarrative(job: Job): Promise<void> {
    const { projectId, organizationId, narrativeType, context } = job.data as {
      projectId: string;
      organizationId: string;
      narrativeType: string;
      context: Record<string, unknown>;
    };

    const aiResult = await this.ai.reason({
      task: `Generate a professional ${narrativeType} narrative for this construction project.`,
      context,
      systemPrompt: DOCS_PROMPT,
    });

    this.assertWritable('GeneratedDocument');

    const doc = await this.prisma.generatedDocument.create({
      data: {
        projectId,
        type: 'NARRATIVE',
        category: 'REPORTS',
        name: `${narrativeType} Narrative - ${new Date().toLocaleDateString()}`,
        content: { narrativeType, aiNarrative: aiResult },
        format: 'PDF',
        status: 'DRAFT',
      },
    });

    const docEvent = createEvent({
      type: EVENT_TYPES.document.generated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: { documentId: doc.id, documentType: 'NARRATIVE', narrativeType },
      entity: { type: 'GeneratedDocument', id: doc.id },
    });
    await this.eventBus.publish(docEvent);
  }

  /**
   * Request e-signature for a document (DocuSign integration).
   */
  private async handleRequestESignature(job: Job): Promise<void> {
    const { documentId, projectId, organizationId, signers } = job.data as {
      documentId: string;
      projectId: string;
      organizationId: string;
      signers: Array<{ email: string; name: string; role: string }>;
    };

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document) return;

    this.assertWritable('Document');

    // Update document with signature request status
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        signatureStatus: 'PENDING',
        status: 'REVIEW',
      },
    });

    // In production, this would call the DocuSign API to create an envelope
    // and send signature requests to each signer. The webhook callback
    // would then update the document status.

    // Log the communication
    this.assertWritable('CommunicationLog');

    for (const signer of signers) {
      await this.prisma.communicationLog.create({
        data: {
          projectId,
          type: 'NOTIFICATION',
          channel: 'EMAIL',
          recipientEmail: signer.email,
          subject: `Signature requested: ${document.name}`,
          body: `Please review and sign the document "${document.name}".`,
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            documentId,
            signerRole: signer.role,
            action: 'ESIGNATURE_REQUEST',
          },
        },
      });
    }
  }

  // =========================================================================
  // COMMS HUB -- Worker Handlers
  // =========================================================================

  /**
   * Route a notification to the appropriate channel(s).
   */
  private async handleSendNotification(job: Job): Promise<void> {
    const { projectId, type, channel, metadata, priority, event } = job.data as {
      projectId: string;
      type: string;
      channel: string;
      metadata?: Record<string, unknown>;
      priority?: string;
      event?: KealeeEventEnvelope;
    };

    // Get project details for recipient resolution
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return;

    // Resolve PM email from the project
    const pmUserId = (project as any).pmUserId;
    const pm = pmUserId
      ? await this.prisma.user.findUnique({ where: { id: pmUserId } })
      : null;

    if (!pm?.email) {
      console.warn(`[${this.config.name}] No PM email for project ${projectId}`);
      return;
    }

    this.assertWritable('CommunicationLog');

    const subject = this.buildNotificationSubject(type, metadata);
    const body = this.buildNotificationBody(type, project, metadata);

    await this.prisma.communicationLog.create({
      data: {
        projectId,
        type: 'NOTIFICATION',
        channel,
        recipientEmail: pm.email,
        subject,
        body,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          notificationType: type,
          priority: priority ?? 'NORMAL',
          ...metadata,
        },
      },
    });

    // Publish communication.sent event
    const commEvent = createEvent({
      type: EVENT_TYPES.communication.sent,
      source: this.config.name,
      projectId,
      payload: {
        channel,
        type,
        recipientEmail: pm.email,
      },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(commEvent);
  }

  /**
   * Send a direct email.
   */
  private async handleSendEmail(job: Job): Promise<void> {
    const { projectId, recipientEmail, subject, body, templateId, templateData } =
      job.data as {
        projectId?: string;
        recipientEmail: string;
        subject: string;
        body: string;
        templateId?: string;
        templateData?: Record<string, unknown>;
      };

    this.assertWritable('CommunicationLog');

    // In production this would call Resend/SendGrid API
    const log = await this.prisma.communicationLog.create({
      data: {
        projectId: projectId ?? null,
        type: 'UPDATE',
        channel: 'EMAIL',
        recipientEmail,
        subject,
        body,
        status: 'SENT',
        sentAt: new Date(),
        metadata: { templateId, templateData },
      },
    });

    const commEvent = createEvent({
      type: EVENT_TYPES.communication.sent,
      source: this.config.name,
      projectId: projectId ?? undefined,
      payload: {
        communicationLogId: log.id,
        channel: 'EMAIL',
        recipientEmail,
      },
    });
    await this.eventBus.publish(commEvent);
  }

  /**
   * Send SMS with link-back only (never send content via SMS per Kealee policy).
   * SMS contains a short link to the Kealee dashboard for the relevant item.
   */
  private async handleSendSmsLinkback(job: Job): Promise<void> {
    const { projectId, type, metadata, event } = job.data as {
      projectId: string;
      type: string;
      metadata?: Record<string, unknown>;
      event?: KealeeEventEnvelope;
    };

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return;

    const pmUserId = (project as any).pmUserId;
    const pm = pmUserId
      ? await this.prisma.user.findUnique({ where: { id: pmUserId } })
      : null;

    const phone = (pm as any)?.phone;
    if (!phone) return;

    // GUARDRAIL: SMS contains ONLY a link-back, never actual content
    const dashboardUrl = `${process.env.APP_URL ?? 'https://app.kealee.com'}/projects/${projectId}`;
    const smsBody = `Kealee alert for your project. View details: ${dashboardUrl}`;

    this.assertWritable('CommunicationLog');

    await this.prisma.communicationLog.create({
      data: {
        projectId,
        type: 'ALERT',
        channel: 'SMS',
        recipientPhone: phone,
        body: smsBody,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          notificationType: type,
          linkbackOnly: true, // Enforced: no content in SMS
          ...metadata,
        },
      },
    });
  }

  /**
   * Send in-app notification via WebSocket.
   */
  private async handleSendInApp(job: Job): Promise<void> {
    const { projectId, recipientId, type, title, body, metadata } = job.data as {
      projectId: string;
      recipientId: string;
      type: string;
      title: string;
      body: string;
      metadata?: Record<string, unknown>;
    };

    this.assertWritable('Message');

    await this.prisma.message.create({
      data: {
        projectId,
        senderId: 'system',
        recipientId,
        channel: 'IN_APP',
        type: 'NOTIFICATION',
        subject: title,
        body,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        metadata: { notificationType: type, ...metadata },
      },
    });

    // In production, this would also push via WebSocket to connected clients
  }

  /**
   * Broadcast a notification to all project participants.
   */
  private async handleBroadcast(job: Job): Promise<void> {
    const { projectId, type, subject, body, channels, metadata } = job.data as {
      projectId: string;
      type: string;
      subject: string;
      body: string;
      channels: string[];
      metadata?: Record<string, unknown>;
    };

    // Get all project participants
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true },
    });
    if (!project) return;

    this.assertWritable('CommunicationLog');

    const teamMembers = (project as any).team ?? [];
    for (const member of teamMembers) {
      for (const channel of channels) {
        await this.prisma.communicationLog.create({
          data: {
            projectId,
            type,
            channel,
            recipientEmail: channel === 'EMAIL' ? member.email : undefined,
            recipientPhone: channel === 'SMS' ? member.phone : undefined,
            subject,
            body: channel === 'SMS'
              ? `Kealee: View update at ${process.env.APP_URL ?? 'https://app.kealee.com'}/projects/${projectId}`
              : body,
            status: 'SENT',
            sentAt: new Date(),
            metadata: { broadcastType: type, ...metadata },
          },
        });
      }
    }

    const commEvent = createEvent({
      type: EVENT_TYPES.communication.sent,
      source: this.config.name,
      projectId,
      payload: {
        broadcastType: type,
        recipientCount: teamMembers.length,
        channels,
      },
    });
    await this.eventBus.publish(commEvent);
  }

  // =========================================================================
  // KEALEE MESSENGER -- Worker Handlers
  // =========================================================================

  /**
   * Detect @kealee mention in a conversation message and route to AI.
   */
  private async handleKealeeMentionDetect(job: Job): Promise<void> {
    const { messageId, conversationId, projectId, content, senderId } = job.data as {
      messageId: string;
      conversationId: string;
      projectId: string;
      content: string;
      senderId: string;
    };

    // Strip the @kealee mention and extract the query
    const query = content.replace(/@kealee\b/gi, '').trim();

    if (!query) return;

    // Determine if this is a question (query) or an action request
    const isAction = /^(create|generate|send|schedule|update|submit|approve)/i.test(query);

    const commsQueue = createQueue(KEALEE_QUEUES.COMMUNICATION);

    if (isAction) {
      await commsQueue.add('kealee-messenger-action', {
        messageId,
        conversationId,
        projectId,
        query,
        senderId,
      });
    } else {
      await commsQueue.add('kealee-messenger-query', {
        messageId,
        conversationId,
        projectId,
        query,
        senderId,
      });
    }
  }

  /**
   * Handle an informational @kealee query -- gather context and respond with AI.
   */
  private async handleKealeeQuery(job: Job): Promise<void> {
    const { conversationId, projectId, query, senderId } = job.data as {
      messageId: string;
      conversationId: string;
      projectId: string;
      query: string;
      senderId: string;
    };

    // Gather project context for the AI
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        permits: { take: 10, orderBy: { createdAt: 'desc' } },
        scheduleItems: { take: 10, orderBy: { startDate: 'asc' } },
        budgetItems: { take: 10 },
      },
    });

    const aiResponse = await this.ai.reason({
      task: query,
      context: {
        projectName: project?.name,
        projectStatus: (project as any)?.status,
        permits: (project as any)?.permits?.map((p: any) => ({
          type: p.permitType,
          status: p.status,
        })),
        schedule: (project as any)?.scheduleItems?.map((s: any) => ({
          name: s.name,
          startDate: s.startDate,
          endDate: s.endDate,
          status: s.status,
        })),
        budget: (project as any)?.budgetItems?.map((b: any) => ({
          category: b.category,
          budgeted: b.budgetedAmount,
          actual: b.actualAmount,
        })),
      },
      systemPrompt: DOCS_PROMPT,
    });

    // Post the AI response as a message in the conversation
    this.assertWritable('Message');

    await this.prisma.message.create({
      data: {
        projectId,
        senderId: 'kealee-ai',
        recipientId: senderId,
        channel: 'IN_APP',
        type: 'MESSAGE',
        body: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        metadata: {
          isKealeeResponse: true,
          originalQuery: query,
          conversationId,
        },
      },
    });
  }

  /**
   * Handle an action @kealee request -- route to the appropriate claw/queue.
   * GUARDRAIL: This claw only routes actions, it does NOT execute domain mutations.
   */
  private async handleKealeeAction(job: Job): Promise<void> {
    const { conversationId, projectId, query, senderId } = job.data as {
      messageId: string;
      conversationId: string;
      projectId: string;
      query: string;
      senderId: string;
    };

    // AI determines the action type and target queue
    const actionPlan = await this.ai.reason({
      task:
        'Analyze this user request and determine the appropriate action. ' +
        'Return JSON with: action (the action type), targetQueue (which queue to route to), ' +
        'and parameters (structured params for the job). ' +
        'Valid actions: generate_document, send_notification, schedule_inspection, create_rfi. ' +
        'IMPORTANT: This system cannot modify contracts, budgets, schedules, or financial data.',
      context: { query, projectId },
      systemPrompt: DOCS_PROMPT,
    });

    const plan = actionPlan as {
      action?: string;
      targetQueue?: string;
      parameters?: Record<string, unknown>;
      cannotFulfill?: boolean;
      reason?: string;
    };

    // GUARDRAIL: If AI indicates the action would mutate domain data, refuse
    if (plan.cannotFulfill) {
      this.assertWritable('Message');

      await this.prisma.message.create({
        data: {
          projectId,
          senderId: 'kealee-ai',
          recipientId: senderId,
          channel: 'IN_APP',
          type: 'MESSAGE',
          body: plan.reason ?? 'I cannot perform that action. Please use the appropriate module directly.',
          status: 'DELIVERED',
          sentAt: new Date(),
          deliveredAt: new Date(),
          metadata: {
            isKealeeResponse: true,
            actionDenied: true,
            originalQuery: query,
            conversationId,
          },
        },
      });
      return;
    }

    // Route actions that this claw CAN handle (document generation, notifications)
    if (plan.action === 'generate_document') {
      const docQueue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
      await docQueue.add('generate-ai-narrative', {
        projectId,
        organizationId: null,
        narrativeType: (plan.parameters as any)?.documentType ?? 'GENERAL',
        context: plan.parameters,
      });
    } else if (plan.action === 'send_notification') {
      const commsQueue = createQueue(KEALEE_QUEUES.COMMUNICATION);
      await commsQueue.add('send-notification', {
        projectId,
        type: (plan.parameters as any)?.notificationType ?? 'GENERAL',
        channel: (plan.parameters as any)?.channel ?? 'IN_APP',
        metadata: plan.parameters,
      });
    } else if (plan.action === 'create_rfi') {
      const docQueue = createQueue(KEALEE_QUEUES.DOCUMENT_GEN);
      await docQueue.add('generate-rfi', {
        projectId,
        organizationId: null,
        ...plan.parameters,
      });
    }

    // Confirm action to the user
    this.assertWritable('Message');

    await this.prisma.message.create({
      data: {
        projectId,
        senderId: 'kealee-ai',
        recipientId: senderId,
        channel: 'IN_APP',
        type: 'MESSAGE',
        body: `Got it. I've queued your request: ${plan.action}. You'll be notified when it's complete.`,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        metadata: {
          isKealeeResponse: true,
          actionQueued: plan.action,
          conversationId,
        },
      },
    });
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private buildNotificationSubject(
    type: string,
    metadata?: Record<string, unknown>,
  ): string {
    const subjects: Record<string, string> = {
      CONTRACT_EXECUTED: 'Contract has been executed',
      PERMIT_STATUS_UPDATE: `Permit status updated to ${metadata?.newStatus ?? 'unknown'}`,
      SCHEDULE_UPDATE: 'Project schedule has been updated',
      DECISION_RECOMMENDED: 'New decision recommendation requires your review',
      BUDGET_VARIANCE_ALERT: 'Budget variance alert -- action required',
    };
    return subjects[type] ?? `Kealee notification: ${type}`;
  }

  private buildNotificationBody(
    type: string,
    project: any,
    metadata?: Record<string, unknown>,
  ): string {
    const projectName = project?.name ?? 'your project';

    const bodies: Record<string, string> = {
      CONTRACT_EXECUTED:
        `The contract for ${projectName} has been executed. ` +
        `A signed copy is being generated and will be available shortly.`,
      PERMIT_STATUS_UPDATE:
        `Permit status for ${projectName} has changed from ` +
        `"${metadata?.previousStatus ?? 'unknown'}" to "${metadata?.newStatus ?? 'unknown'}".`,
      SCHEDULE_UPDATE:
        `The schedule for ${projectName} has been updated. ` +
        `Please review the changes in the Kealee dashboard.`,
      DECISION_RECOMMENDED:
        `A new decision recommendation has been generated for ${projectName}. ` +
        `Please review and approve or reject in the decision queue.`,
      BUDGET_VARIANCE_ALERT:
        `A budget variance has been detected for ${projectName}. ` +
        `Please review the budget details and take appropriate action.`,
    };
    return bodies[type] ?? `Notification for ${projectName}: ${type}`;
  }
}
