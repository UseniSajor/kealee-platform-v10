/**
 * APP-10: DOCUMENT GENERATOR
 * Automated document generation (contracts, permits, punch lists, etc.)
 * Automation Level: 90%
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { generateText, generateJSON } from '../../../shared/ai/claude.js';
import { sendEmail } from '../../../shared/integrations/email.js';
import { formatDate, formatCurrency } from '../../../shared/utils/index.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('document-gen');

// ============================================================================
// TYPES
// ============================================================================

type DocumentType =
  | 'CONTRACT'
  | 'SUBCONTRACT'
  | 'CHANGE_ORDER'
  | 'PUNCH_LIST'
  | 'DAILY_REPORT'
  | 'WEEKLY_REPORT'
  | 'SAFETY_PLAN'
  | 'RFI'
  | 'SUBMITTAL'
  | 'TRANSMITTAL'
  | 'MEETING_MINUTES'
  | 'INSPECTION_REPORT'
  | 'CERTIFICATE'
  | 'LIEN_WAIVER'
  | 'PAY_APPLICATION';

type DocumentStatus = 'draft' | 'review' | 'approved' | 'final' | 'archived';
type DocumentFormat = 'pdf' | 'docx' | 'html';

interface Document {
  id: string;
  projectId: string;
  type: DocumentType;
  title: string;
  version: number;
  status: DocumentStatus;
  templateId?: string;
  content: string;
  htmlContent?: string;
  metadata: Record<string, any>;
  fileUrl?: string;
  format: DocumentFormat;
  generatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

interface DocumentTemplate {
  id: string;
  type: DocumentType;
  name: string;
  description?: string;
  content: string;
  variables: TemplateVariable[];
  sections: TemplateSection[];
  active: boolean;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'list' | 'rich-text';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

interface TemplateSection {
  id: string;
  name: string;
  order: number;
  required: boolean;
  content: string;
  conditional?: string;
}

interface PunchListItem {
  id: string;
  location: string;
  description: string;
  trade: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'complete' | 'verified';
  assignedTo?: string;
  dueDate?: Date;
  photos?: string[];
  notes?: string;
}

// ============================================================================
// DOCUMENT SERVICE
// ============================================================================

class DocumentService {
  /**
   * Get template by type
   */
  async getTemplate(type: DocumentType): Promise<DocumentTemplate | null> {
    const template = await prisma.documentTemplate.findFirst({
      where: { type, active: true },
      orderBy: { createdAt: 'desc' },
    });

    return template as unknown as DocumentTemplate;
  }

  /**
   * Render template with data
   */
  async renderTemplate(
    template: DocumentTemplate,
    data: Record<string, any>
  ): Promise<{ content: string; htmlContent: string }> {
    let content = template.content;

    // Replace variables
    for (const variable of template.variables) {
      const value = data[variable.name] ?? variable.defaultValue ?? '';
      const placeholder = `{{${variable.name}}}`;
      let formattedValue = value;

      // Format based on type
      switch (variable.type) {
        case 'date':
          formattedValue = value ? formatDate(new Date(value)) : '';
          break;
        case 'currency':
          formattedValue = typeof value === 'number' ? formatCurrency(value) : value;
          break;
        case 'list':
          formattedValue = Array.isArray(value) ? value.join(', ') : value;
          break;
      }

      content = content.replace(new RegExp(placeholder, 'g'), String(formattedValue));
    }

    // Process conditional sections
    for (const section of template.sections) {
      if (section.conditional) {
        const condition = this.evaluateCondition(section.conditional, data);
        const sectionPlaceholder = `{{#section:${section.id}}}`;
        if (condition) {
          content = content.replace(sectionPlaceholder, section.content);
        } else {
          content = content.replace(sectionPlaceholder, '');
        }
      }
    }

    // Generate HTML version
    const htmlContent = this.convertToHtml(content);

    return { content, htmlContent };
  }

  /**
   * Evaluate conditional expression
   */
  evaluateCondition(condition: string, data: Record<string, any>): boolean {
    // Simple condition evaluation (e.g., "hasRetainage == true")
    const [left, operator, right] = condition.split(/\s*(==|!=|>|<|>=|<=)\s*/);
    const leftValue = data[left.trim()];
    const rightValue = right?.trim() === 'true' ? true :
      right?.trim() === 'false' ? false :
        right?.trim();

    switch (operator) {
      case '==':
        return leftValue == rightValue;
      case '!=':
        return leftValue != rightValue;
      case '>':
        return leftValue > rightValue;
      case '<':
        return leftValue < rightValue;
      case '>=':
        return leftValue >= rightValue;
      case '<=':
        return leftValue <= rightValue;
      default:
        return Boolean(leftValue);
    }
  }

  /**
   * Convert markdown-like content to HTML
   */
  convertToHtml(content: string): string {
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    return `<div class="document-content"><p>${html}</p></div>`;
  }

  /**
   * Generate punch list document
   */
  async generatePunchList(
    projectId: string,
    items: PunchListItem[]
  ): Promise<{ content: string; htmlContent: string }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Group items by location
    const byLocation = items.reduce((acc: Record<string, PunchListItem[]>, item) => {
      if (!acc[item.location]) acc[item.location] = [];
      acc[item.location].push(item);
      return acc;
    }, {});

    let content = `# PUNCH LIST\n\n`;
    content += `**Project:** ${project.name}\n`;
    content += `**Date:** ${formatDate(new Date())}\n`;
    content += `**Total Items:** ${items.length}\n\n`;

    for (const [location, locationItems] of Object.entries(byLocation)) {
      content += `## ${location}\n\n`;

      for (const item of locationItems) {
        const priorityEmoji = item.priority === 'high' ? '🔴' :
          item.priority === 'medium' ? '🟡' : '🟢';
        content += `${priorityEmoji} **${item.description}**\n`;
        content += `   - Trade: ${item.trade}\n`;
        content += `   - Status: ${item.status}\n`;
        if (item.assignedTo) content += `   - Assigned: ${item.assignedTo}\n`;
        if (item.dueDate) content += `   - Due: ${formatDate(item.dueDate)}\n`;
        if (item.notes) content += `   - Notes: ${item.notes}\n`;
        content += '\n';
      }
    }

    // Summary
    const open = items.filter(i => i.status === 'open').length;
    const inProgress = items.filter(i => i.status === 'in-progress').length;
    const complete = items.filter(i => i.status === 'complete' || i.status === 'verified').length;

    content += `## Summary\n\n`;
    content += `* Open: ${open}\n`;
    content += `* In Progress: ${inProgress}\n`;
    content += `* Complete: ${complete}\n`;

    const htmlContent = this.convertToHtml(content);

    return { content, htmlContent };
  }

  /**
   * Generate daily report using AI
   */
  async generateDailyReport(
    projectId: string,
    date: Date,
    data: {
      weather?: string;
      temperature?: number;
      workforce: { trade: string; count: number }[];
      workCompleted: string[];
      issues?: string[];
      safetyIncidents?: string[];
      deliveries?: string[];
      visitors?: string[];
      photos?: string[];
    }
  ): Promise<{ content: string; htmlContent: string }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Generate AI narrative
    const narrative = await generateText({
      systemPrompt: `You are a construction daily report writer. Write professional, concise daily report narratives.`,
      userPrompt: `Generate a daily report narrative for:
Project: ${project.name}
Date: ${formatDate(date)}
Weather: ${data.weather || 'Clear'}, ${data.temperature || 'N/A'}°F
Workforce: ${data.workforce.map(w => `${w.trade}: ${w.count}`).join(', ')}
Work Completed: ${data.workCompleted.join('; ')}
${data.issues?.length ? `Issues: ${data.issues.join('; ')}` : ''}
${data.safetyIncidents?.length ? `Safety: ${data.safetyIncidents.join('; ')}` : 'No safety incidents'}`,
      maxTokens: 500,
    });

    let content = `# DAILY FIELD REPORT\n\n`;
    content += `**Project:** ${project.name}\n`;
    content += `**Date:** ${formatDate(date)}\n`;
    content += `**Weather:** ${data.weather || 'Not recorded'}, ${data.temperature || 'N/A'}°F\n\n`;

    content += `## Workforce\n\n`;
    const totalWorkers = data.workforce.reduce((sum, w) => sum + w.count, 0);
    content += `**Total:** ${totalWorkers} workers\n\n`;
    for (const w of data.workforce) {
      content += `* ${w.trade}: ${w.count}\n`;
    }
    content += '\n';

    content += `## Work Completed\n\n`;
    for (const work of data.workCompleted) {
      content += `* ${work}\n`;
    }
    content += '\n';

    if (data.issues?.length) {
      content += `## Issues / Delays\n\n`;
      for (const issue of data.issues) {
        content += `* ${issue}\n`;
      }
      content += '\n';
    }

    content += `## Safety\n\n`;
    if (data.safetyIncidents?.length) {
      content += `**Incidents:**\n`;
      for (const incident of data.safetyIncidents) {
        content += `* ${incident}\n`;
      }
    } else {
      content += `No safety incidents reported.\n`;
    }
    content += '\n';

    if (data.deliveries?.length) {
      content += `## Deliveries\n\n`;
      for (const delivery of data.deliveries) {
        content += `* ${delivery}\n`;
      }
      content += '\n';
    }

    content += `## Narrative\n\n`;
    content += narrative + '\n';

    const htmlContent = this.convertToHtml(content);

    return { content, htmlContent };
  }

  /**
   * Generate change order document
   */
  async generateChangeOrder(data: {
    projectId: string;
    changeOrderNumber: number;
    description: string;
    reason: string;
    amount: number;
    contractor: string;
    lineItems: { description: string; amount: number }[];
    schedule: { originalDays: number; newDays: number; reason?: string };
  }): Promise<{ content: string; htmlContent: string }> {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    let content = `# CHANGE ORDER #${data.changeOrderNumber}\n\n`;
    content += `**Project:** ${project.name}\n`;
    content += `**Date:** ${formatDate(new Date())}\n`;
    content += `**Contractor:** ${data.contractor}\n\n`;

    content += `## Description\n\n`;
    content += `${data.description}\n\n`;

    content += `## Reason for Change\n\n`;
    content += `${data.reason}\n\n`;

    content += `## Cost Breakdown\n\n`;
    content += `| Description | Amount |\n`;
    content += `|-------------|--------|\n`;
    for (const item of data.lineItems) {
      content += `| ${item.description} | ${formatCurrency(item.amount)} |\n`;
    }
    content += `| **TOTAL** | **${formatCurrency(data.amount)}** |\n\n`;

    content += `## Schedule Impact\n\n`;
    const scheduleDelta = data.schedule.newDays - data.schedule.originalDays;
    content += `* Original Duration: ${data.schedule.originalDays} days\n`;
    content += `* New Duration: ${data.schedule.newDays} days\n`;
    content += `* Change: ${scheduleDelta > 0 ? '+' : ''}${scheduleDelta} days\n`;
    if (data.schedule.reason) {
      content += `* Reason: ${data.schedule.reason}\n`;
    }
    content += '\n';

    content += `## Signatures\n\n`;
    content += `**Contractor:**\n\n`;
    content += `_______________________________  Date: ________\n\n`;
    content += `**Owner/Owner's Representative:**\n\n`;
    content += `_______________________________  Date: ________\n\n`;

    const htmlContent = this.convertToHtml(content);

    return { content, htmlContent };
  }

  /**
   * Generate meeting minutes
   */
  async generateMeetingMinutes(data: {
    projectId: string;
    meetingType: string;
    date: Date;
    attendees: { name: string; company: string; role?: string }[];
    agenda: string[];
    discussions: { topic: string; summary: string; decisions?: string[] }[];
    actionItems: { description: string; assignee: string; dueDate?: Date }[];
    nextMeeting?: Date;
  }): Promise<{ content: string; htmlContent: string }> {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    let content = `# MEETING MINUTES\n\n`;
    content += `**Project:** ${project.name}\n`;
    content += `**Meeting Type:** ${data.meetingType}\n`;
    content += `**Date:** ${formatDate(data.date)}\n\n`;

    content += `## Attendees\n\n`;
    for (const attendee of data.attendees) {
      content += `* ${attendee.name} - ${attendee.company}`;
      if (attendee.role) content += ` (${attendee.role})`;
      content += '\n';
    }
    content += '\n';

    content += `## Agenda\n\n`;
    data.agenda.forEach((item, i) => {
      content += `${i + 1}. ${item}\n`;
    });
    content += '\n';

    content += `## Discussion Summary\n\n`;
    for (const discussion of data.discussions) {
      content += `### ${discussion.topic}\n\n`;
      content += `${discussion.summary}\n\n`;
      if (discussion.decisions?.length) {
        content += `**Decisions:**\n`;
        for (const decision of discussion.decisions) {
          content += `* ${decision}\n`;
        }
        content += '\n';
      }
    }

    content += `## Action Items\n\n`;
    content += `| # | Description | Assignee | Due Date |\n`;
    content += `|---|-------------|----------|----------|\n`;
    data.actionItems.forEach((item, i) => {
      content += `| ${i + 1} | ${item.description} | ${item.assignee} | ${item.dueDate ? formatDate(item.dueDate) : 'TBD'} |\n`;
    });
    content += '\n';

    if (data.nextMeeting) {
      content += `## Next Meeting\n\n`;
      content += `Scheduled for: ${formatDate(data.nextMeeting)}\n`;
    }

    const htmlContent = this.convertToHtml(content);

    return { content, htmlContent };
  }
}

const documentService = new DocumentService();

// ============================================================================
// WORKER
// ============================================================================

async function processDocumentJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'GENERATE_FROM_TEMPLATE':
      return await generateFromTemplate(data);

    case 'GENERATE_PUNCH_LIST':
      return await generatePunchListDoc(data);

    case 'GENERATE_DAILY_REPORT':
      return await generateDailyReportDoc(data);

    case 'GENERATE_CHANGE_ORDER':
      return await generateChangeOrderDoc(data);

    case 'GENERATE_MEETING_MINUTES':
      return await generateMeetingMinutesDoc(data);

    case 'APPROVE_DOCUMENT':
      return await approveDocument(data.documentId, data.approvedBy);

    case 'SEND_DOCUMENT':
      return await sendDocument(data);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function generateFromTemplate(data: {
  projectId: string;
  templateId: string;
  templateData: Record<string, any>;
  title: string;
}) {
  const template = await prisma.documentTemplate.findUnique({
    where: { id: data.templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  const { content, htmlContent } = await documentService.renderTemplate(
    template as unknown as DocumentTemplate,
    data.templateData
  );

  // Save document
  const document = await prisma.document.create({
    data: {
      projectId: data.projectId,
      type: (template as any).type,
      title: data.title,
      version: 1,
      status: 'draft',
      templateId: data.templateId,
      content,
      htmlContent,
      metadata: data.templateData,
      format: 'html',
      generatedAt: new Date(),
    } as any,
  });

  // Emit event
  await eventBus.publish(EVENT_TYPES.DOCUMENT_GENERATED, {
    documentId: document.id,
    projectId: data.projectId,
    type: (template as any).type,
  });

  return document;
}

async function generatePunchListDoc(data: {
  projectId: string;
  items: PunchListItem[];
  title?: string;
}) {
  const { content, htmlContent } = await documentService.generatePunchList(
    data.projectId,
    data.items
  );

  const document = await prisma.document.create({
    data: {
      projectId: data.projectId,
      type: 'PUNCH_LIST',
      title: data.title || `Punch List - ${formatDate(new Date())}`,
      version: 1,
      status: 'draft',
      content,
      htmlContent,
      metadata: { itemCount: data.items.length },
      format: 'html',
      generatedAt: new Date(),
    } as any,
  });

  return document;
}

async function generateDailyReportDoc(data: {
  projectId: string;
  date: string;
  weather?: string;
  temperature?: number;
  workforce: { trade: string; count: number }[];
  workCompleted: string[];
  issues?: string[];
  safetyIncidents?: string[];
  deliveries?: string[];
  visitors?: string[];
}) {
  const { content, htmlContent } = await documentService.generateDailyReport(
    data.projectId,
    new Date(data.date),
    data
  );

  const document = await prisma.document.create({
    data: {
      projectId: data.projectId,
      type: 'DAILY_REPORT',
      title: `Daily Report - ${formatDate(new Date(data.date))}`,
      version: 1,
      status: 'draft',
      content,
      htmlContent,
      metadata: {
        date: data.date,
        totalWorkforce: data.workforce.reduce((s, w) => s + w.count, 0),
      },
      format: 'html',
      generatedAt: new Date(),
    } as any,
  });

  return document;
}

async function generateChangeOrderDoc(data: {
  projectId: string;
  changeOrderNumber: number;
  description: string;
  reason: string;
  amount: number;
  contractor: string;
  lineItems: { description: string; amount: number }[];
  schedule: { originalDays: number; newDays: number; reason?: string };
}) {
  const { content, htmlContent } = await documentService.generateChangeOrder(data);

  const document = await prisma.document.create({
    data: {
      projectId: data.projectId,
      type: 'CHANGE_ORDER',
      title: `Change Order #${data.changeOrderNumber}`,
      version: 1,
      status: 'draft',
      content,
      htmlContent,
      metadata: {
        changeOrderNumber: data.changeOrderNumber,
        amount: data.amount,
        contractor: data.contractor,
      },
      format: 'html',
      generatedAt: new Date(),
    } as any,
  });

  return document;
}

async function generateMeetingMinutesDoc(data: {
  projectId: string;
  meetingType: string;
  date: string;
  attendees: { name: string; company: string; role?: string }[];
  agenda: string[];
  discussions: { topic: string; summary: string; decisions?: string[] }[];
  actionItems: { description: string; assignee: string; dueDate?: string }[];
  nextMeeting?: string;
}) {
  const { content, htmlContent } = await documentService.generateMeetingMinutes({
    ...data,
    date: new Date(data.date),
    actionItems: data.actionItems.map(ai => ({
      ...ai,
      dueDate: ai.dueDate ? new Date(ai.dueDate) : undefined,
    })),
    nextMeeting: data.nextMeeting ? new Date(data.nextMeeting) : undefined,
  });

  const document = await prisma.document.create({
    data: {
      projectId: data.projectId,
      type: 'MEETING_MINUTES',
      title: `${data.meetingType} Minutes - ${formatDate(new Date(data.date))}`,
      version: 1,
      status: 'draft',
      content,
      htmlContent,
      metadata: {
        meetingType: data.meetingType,
        attendeeCount: data.attendees.length,
        actionItemCount: data.actionItems.length,
      },
      format: 'html',
      generatedAt: new Date(),
    } as any,
  });

  return document;
}

async function approveDocument(documentId: string, approvedBy: string) {
  const document = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    } as any,
  });

  // Emit event
  await eventBus.publish(EVENT_TYPES.DOCUMENT_APPROVED, {
    documentId,
    projectId: (document as any).projectId,
    type: (document as any).type,
    approvedBy,
  });

  return document;
}

async function sendDocument(data: {
  documentId: string;
  recipients: string[];
  message?: string;
}) {
  const document = await prisma.document.findUnique({
    where: { id: data.documentId },
    include: { project: true },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  // Send email with document
  await sendEmail({
    to: data.recipients,
    subject: `Document: ${(document as any).title} - ${(document as any).project.name}`,
    html: `
      <p>${data.message || 'Please find the attached document.'}</p>
      <hr>
      ${(document as any).htmlContent}
    `,
  });

  // Log distribution
  await prisma.documentDistribution.create({
    data: {
      documentId: data.documentId,
      recipients: data.recipients,
      sentAt: new Date(),
      message: data.message,
    } as any,
  });

  return { sent: true, recipientCount: data.recipients.length };
}

// Create worker
export const documentGenWorker = createWorker(
  QUEUE_NAMES.DOCUMENT_GEN,
  processDocumentJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function documentGenRoutes(fastify: FastifyInstance) {
  /**
   * Get documents for a project
   */
  fastify.get('/projects/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { type, status } = request.query as { type?: string; status?: string };

    const documents = await prisma.document.findMany({
      where: {
        projectId,
        ...(type && { type }),
        ...(status && { status }),
      },
      orderBy: { generatedAt: 'desc' },
    });

    return { documents };
  });

  /**
   * Get document by ID
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        distributions: true,
      },
    });

    if (!document) {
      return reply.status(404).send({ error: 'Document not found' });
    }

    return document;
  });

  /**
   * Generate document from template
   */
  fastify.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      projectId: string;
      templateId: string;
      templateData: Record<string, any>;
      title: string;
    };

    const job = await queues.DOCUMENT_GEN.add(
      'generate-from-template',
      { type: 'GENERATE_FROM_TEMPLATE', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Generate punch list
   */
  fastify.post('/punch-list', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      projectId: string;
      items: PunchListItem[];
      title?: string;
    };

    const job = await queues.DOCUMENT_GEN.add(
      'generate-punch-list',
      { type: 'GENERATE_PUNCH_LIST', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Generate daily report
   */
  fastify.post('/daily-report', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      projectId: string;
      date: string;
      weather?: string;
      temperature?: number;
      workforce: { trade: string; count: number }[];
      workCompleted: string[];
      issues?: string[];
      safetyIncidents?: string[];
      deliveries?: string[];
    };

    const job = await queues.DOCUMENT_GEN.add(
      'generate-daily-report',
      { type: 'GENERATE_DAILY_REPORT', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Generate change order document
   */
  fastify.post('/change-order', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      projectId: string;
      changeOrderNumber: number;
      description: string;
      reason: string;
      amount: number;
      contractor: string;
      lineItems: { description: string; amount: number }[];
      schedule: { originalDays: number; newDays: number; reason?: string };
    };

    const job = await queues.DOCUMENT_GEN.add(
      'generate-change-order',
      { type: 'GENERATE_CHANGE_ORDER', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Generate meeting minutes
   */
  fastify.post('/meeting-minutes', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      projectId: string;
      meetingType: string;
      date: string;
      attendees: { name: string; company: string; role?: string }[];
      agenda: string[];
      discussions: { topic: string; summary: string; decisions?: string[] }[];
      actionItems: { description: string; assignee: string; dueDate?: string }[];
      nextMeeting?: string;
    };

    const job = await queues.DOCUMENT_GEN.add(
      'generate-meeting-minutes',
      { type: 'GENERATE_MEETING_MINUTES', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Approve document
   */
  fastify.post('/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { approvedBy } = request.body as { approvedBy: string };

    const document = await approveDocument(id, approvedBy);
    return document;
  });

  /**
   * Send document
   */
  fastify.post('/:id/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { recipients, message } = request.body as {
      recipients: string[];
      message?: string;
    };

    const job = await queues.DOCUMENT_GEN.add(
      'send-document',
      { type: 'SEND_DOCUMENT', documentId: id, recipients, message },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'sending' };
  });

  /**
   * Get document templates
   */
  fastify.get('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.query as { type?: string };

    const templates = await prisma.documentTemplate.findMany({
      where: {
        active: true,
        ...(type && { type }),
      },
      orderBy: { name: 'asc' },
    });

    return { templates };
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      generatedToday,
      pendingApproval,
      byType,
    ] = await Promise.all([
      prisma.document.count({
        where: { generatedAt: { gte: today } },
      }),
      prisma.document.count({
        where: { status: 'draft' },
      }),
      prisma.document.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    return {
      generatedToday,
      pendingApproval,
      byType: byType.reduce((acc: any, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
    };
  });
}
