/**
 * APP-05: PERMIT TRACKER
 * Automated permit tracking and renewal management
 * Automation Level: 80%
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES, redisConnection } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { sendEmail } from '../../../shared/integrations/email.js';
import { addWorkingDays, formatDate, daysUntilDeadline } from '../../../shared/utils/date.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('permit-tracker');

// ============================================================================
// TYPES
// ============================================================================

interface Permit {
  id: string;
  projectId: string;
  type: PermitType;
  jurisdiction: string;
  applicationNumber?: string;
  status: PermitStatus;
  appliedAt?: Date;
  approvedAt?: Date;
  expiresAt?: Date;
  renewalDueAt?: Date;
  estimatedApprovalDays: number;
  fees: number;
  documents: string[];
  requirements: PermitRequirement[];
  inspectionsRequired: string[];
  notes?: string;
}

type PermitType =
  | 'BUILDING'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'MECHANICAL'
  | 'FIRE'
  | 'GRADING'
  | 'DEMOLITION'
  | 'SIGNAGE'
  | 'ENCROACHMENT'
  | 'ENVIRONMENTAL'
  | 'ZONING'
  | 'SPECIAL_USE';

type PermitStatus =
  | 'DRAFT'
  | 'PENDING_DOCUMENTS'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CORRECTIONS_REQUIRED'
  | 'APPROVED'
  | 'ISSUED'
  | 'EXPIRED'
  | 'RENEWED'
  | 'CLOSED';

interface PermitRequirement {
  id: string;
  name: string;
  description: string;
  documentType?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  notes?: string;
}

interface PermitTimeline {
  permitId: string;
  events: TimelineEvent[];
  estimatedApproval?: Date;
  actualApproval?: Date;
  totalDays: number;
  reviewCycles: number;
}

interface TimelineEvent {
  date: Date;
  type: string;
  description: string;
  actor?: string;
}

interface JurisdictionInfo {
  name: string;
  code: string;
  website?: string;
  phone?: string;
  email?: string;
  averageReviewDays: Record<PermitType, number>;
  fees: Record<PermitType, { base: number; perSqFt?: number }>;
  requiredDocuments: Record<PermitType, string[]>;
}

// ============================================================================
// PERMIT TRACKING SERVICE
// ============================================================================

class PermitTrackingService {
  /**
   * Check permit status with jurisdiction (simulated)
   */
  async checkPermitStatus(permit: Permit): Promise<{
    status: PermitStatus;
    comments?: string;
    nextAction?: string;
    estimatedDays?: number;
  }> {
    // In production, this would integrate with jurisdiction APIs or scrape portals
    // For now, simulate status check

    if (permit.status === 'SUBMITTED') {
      const daysSinceSubmission = permit.appliedAt
        ? Math.abs(daysUntilDeadline(permit.appliedAt))
        : 0;

      if (daysSinceSubmission > permit.estimatedApprovalDays) {
        return {
          status: 'APPROVED',
          comments: 'Permit approved',
          nextAction: 'Pick up permit or download from portal',
        };
      }

      const progress = daysSinceSubmission / permit.estimatedApprovalDays;
      if (progress > 0.5) {
        return {
          status: 'IN_REVIEW',
          comments: 'Plan review in progress',
          estimatedDays: permit.estimatedApprovalDays - daysSinceSubmission,
        };
      }
    }

    return {
      status: permit.status,
      nextAction: 'Awaiting jurisdiction response',
    };
  }

  /**
   * Get jurisdiction information
   */
  getJurisdictionInfo(jurisdiction: string): JurisdictionInfo | null {
    // In production, this would come from a database of jurisdictions
    const jurisdictions: Record<string, JurisdictionInfo> = {
      'LOS_ANGELES': {
        name: 'Los Angeles Department of Building and Safety',
        code: 'LADBS',
        website: 'https://www.ladbs.org',
        phone: '(213) 482-6800',
        averageReviewDays: {
          BUILDING: 30,
          ELECTRICAL: 14,
          PLUMBING: 14,
          MECHANICAL: 14,
          FIRE: 21,
          GRADING: 45,
          DEMOLITION: 21,
          SIGNAGE: 14,
          ENCROACHMENT: 30,
          ENVIRONMENTAL: 60,
          ZONING: 45,
          SPECIAL_USE: 60,
        },
        fees: {
          BUILDING: { base: 500, perSqFt: 0.25 },
          ELECTRICAL: { base: 150 },
          PLUMBING: { base: 150 },
          MECHANICAL: { base: 150 },
          FIRE: { base: 300 },
          GRADING: { base: 1000 },
          DEMOLITION: { base: 400 },
          SIGNAGE: { base: 200 },
          ENCROACHMENT: { base: 500 },
          ENVIRONMENTAL: { base: 2000 },
          ZONING: { base: 800 },
          SPECIAL_USE: { base: 1500 },
        },
        requiredDocuments: {
          BUILDING: ['Site Plan', 'Floor Plans', 'Structural Calculations', 'Title 24 Energy Report'],
          ELECTRICAL: ['Electrical Plans', 'Load Calculations', 'Panel Schedule'],
          PLUMBING: ['Plumbing Plans', 'Isometric Diagrams'],
          MECHANICAL: ['HVAC Plans', 'Equipment Specifications'],
          FIRE: ['Fire Protection Plans', 'Sprinkler Calculations'],
          GRADING: ['Grading Plans', 'Soils Report', 'Drainage Plan'],
          DEMOLITION: ['Demolition Plan', 'Hazmat Survey'],
          SIGNAGE: ['Sign Drawings', 'Site Photos', 'Electrical Load'],
          ENCROACHMENT: ['Site Survey', 'Traffic Control Plan'],
          ENVIRONMENTAL: ['Environmental Impact Report', 'CEQA Documentation'],
          ZONING: ['Site Plan', 'Use Description', 'Parking Study'],
          SPECIAL_USE: ['Application Form', 'Project Description', 'Community Impact'],
        },
      },
    };

    return jurisdictions[jurisdiction] || null;
  }

  /**
   * Calculate permit fees
   */
  calculateFees(
    jurisdiction: string,
    permitType: PermitType,
    projectSize?: number
  ): number {
    const info = this.getJurisdictionInfo(jurisdiction);
    if (!info) return 0;

    const feeInfo = info.fees[permitType];
    if (!feeInfo) return 0;

    let total = feeInfo.base;
    if (feeInfo.perSqFt && projectSize) {
      total += feeInfo.perSqFt * projectSize;
    }

    return total;
  }

  /**
   * Get required documents for permit type
   */
  getRequiredDocuments(jurisdiction: string, permitType: PermitType): string[] {
    const info = this.getJurisdictionInfo(jurisdiction);
    if (!info) return [];

    return info.requiredDocuments[permitType] || [];
  }

  /**
   * Estimate approval timeline
   */
  estimateApprovalDate(
    jurisdiction: string,
    permitType: PermitType,
    submissionDate: Date = new Date()
  ): Date {
    const info = this.getJurisdictionInfo(jurisdiction);
    const reviewDays = info?.averageReviewDays[permitType] || 30;

    return addWorkingDays(submissionDate, reviewDays);
  }

  /**
   * Check for permits nearing expiration
   */
  async checkExpiringPermits(daysAhead: number = 30): Promise<Permit[]> {
    const cutoffDate = addWorkingDays(new Date(), daysAhead);

    const permits = await prisma.permit.findMany({
      where: {
        status: 'ISSUED',
        expiresAt: {
          lte: cutoffDate,
          gte: new Date(),
        },
      },
      include: {
        project: true,
      },
    });

    return permits as unknown as Permit[];
  }

  /**
   * Generate permit timeline
   */
  async getPermitTimeline(permitId: string): Promise<PermitTimeline> {
    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
      include: {
        activities: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!permit) {
      throw new Error('Permit not found');
    }

    const events: TimelineEvent[] = (permit as any).activities?.map((a: any) => ({
      date: a.createdAt,
      type: a.type,
      description: a.description,
      actor: a.actor,
    })) || [];

    // Calculate review cycles (corrections required count)
    const reviewCycles = events.filter(e => e.type === 'CORRECTIONS_REQUIRED').length;

    // Calculate total days
    const startDate = (permit as any).appliedAt || (permit as any).createdAt;
    const endDate = (permit as any).approvedAt || new Date();
    const totalDays = Math.abs(daysUntilDeadline(startDate, endDate));

    return {
      permitId,
      events,
      estimatedApproval: this.estimateApprovalDate(
        (permit as any).jurisdiction,
        (permit as any).type,
        startDate
      ),
      actualApproval: (permit as any).approvedAt,
      totalDays,
      reviewCycles,
    };
  }
}

const trackingService = new PermitTrackingService();

// ============================================================================
// WORKER
// ============================================================================

async function processPermitJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'CHECK_STATUS':
      return await checkPermitStatus(data.permitId);

    case 'CHECK_ALL_ACTIVE':
      return await checkAllActivePermits();

    case 'CHECK_EXPIRING':
      return await checkExpiringPermits(data.daysAhead);

    case 'SEND_RENEWAL_REMINDER':
      return await sendRenewalReminder(data.permitId);

    case 'UPDATE_STATUS':
      return await updatePermitStatus(data.permitId, data.status, data.notes);

    case 'CALCULATE_FEES':
      return await calculatePermitFees(data);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function checkPermitStatus(permitId: string) {
  const permit = await prisma.permit.findUnique({
    where: { id: permitId },
    include: { project: true },
  });

  if (!permit) {
    throw new Error('Permit not found');
  }

  const statusCheck = await trackingService.checkPermitStatus(permit as unknown as Permit);

  // Update if status changed
  if (statusCheck.status !== permit.status) {
    await prisma.permit.update({
      where: { id: permitId },
      data: {
        status: statusCheck.status,
        ...(statusCheck.status === 'APPROVED' && { approvedAt: new Date() }),
      } as any,
    });

    // Log activity
    await prisma.permitActivity.create({
      data: {
        permit: { connect: { id: permitId } },
        type: 'STATUS_CHANGE',
        action: 'STATUS_UPDATED',
        description: `Status changed from ${permit.status} to ${statusCheck.status}`,
        metadata: statusCheck as any,
      },
    });

    // Emit event
    await eventBus.publish(EVENT_TYPES.PERMIT_STATUS_CHANGED, {
      permitId,
      projectId: permit.projectId,
      previousStatus: permit.status,
      newStatus: statusCheck.status,
      comments: statusCheck.comments,
    });

    // Notify if approved
    if (statusCheck.status === 'APPROVED' || statusCheck.status === 'ISSUED') {
      await notifyPermitApproved(permit as any);
    }
  }

  return statusCheck;
}

async function checkAllActivePermits() {
  const activePermits = await prisma.permit.findMany({
    where: {
      status: {
        in: ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTIONS_REQUESTED'],
      },
    },
  });

  const results = [];
  for (const permit of activePermits) {
    try {
      const result = await checkPermitStatus(permit.id);
      results.push({ permitId: permit.id, ...result });
    } catch (error) {
      results.push({ permitId: permit.id, error: String(error) });
    }
  }

  return { checked: results.length, results };
}

async function checkExpiringPermits(daysAhead: number = 30) {
  const expiringPermits = await trackingService.checkExpiringPermits(daysAhead);

  for (const permit of expiringPermits) {
    // Send renewal reminder
    await queues.PERMIT_TRACKER.add(
      'send-renewal-reminder',
      { type: 'SEND_RENEWAL_REMINDER', permitId: permit.id },
      JOB_OPTIONS.DEFAULT
    );
  }

  return { expiringCount: expiringPermits.length, permits: expiringPermits };
}

async function sendRenewalReminder(permitId: string) {
  const permit = await prisma.permit.findUnique({
    where: { id: permitId },
    include: {
      project: {
        include: {
          projectManagers: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!permit) {
    throw new Error('Permit not found');
  }

  const daysUntilExpiry = permit.expiresAt
    ? daysUntilDeadline(permit.expiresAt)
    : 0;

  // Get PM emails
  const pmEmails = (permit.project as any).projectManagers?.map(
    (pm: any) => pm.user.email
  ) || [];

  if (pmEmails.length === 0) {
    return { sent: false, reason: 'No project managers found' };
  }

  await sendEmail({
    to: pmEmails,
    subject: `Permit Renewal Required: ${(permit as any).type} - ${permit.project.name}`,
    html: `
      <h2>Permit Renewal Reminder</h2>
      <p>The following permit is expiring soon and requires renewal:</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Project:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${permit.project.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Permit Type:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${(permit as any).type}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Jurisdiction:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${(permit as any).jurisdiction}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Application #:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${(permit as any).applicationNumber || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Expires:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${permit.expiresAt ? formatDate(permit.expiresAt) : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Days Until Expiry:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd; color: ${daysUntilExpiry < 14 ? 'red' : 'orange'};">
            ${daysUntilExpiry} days
          </td>
        </tr>
      </table>
      <p style="margin-top: 20px;">
        Please initiate the renewal process as soon as possible to avoid work stoppages.
      </p>
    `,
  });

  // Log the reminder
  await prisma.permitActivity.create({
    data: {
      permitId,
      type: 'RENEWAL_REMINDER_SENT',
      description: `Renewal reminder sent to ${pmEmails.length} recipients`,
    } as any,
  });

  return { sent: true, recipients: pmEmails.length };
}

async function updatePermitStatus(
  permitId: string,
  status: PermitStatus,
  notes?: string
) {
  const permit = await prisma.permit.update({
    where: { id: permitId },
    data: {
      status,
      ...(status === 'APPROVED' && { approvedAt: new Date() }),
      ...(status === 'ISSUED' && { issuedAt: new Date() }),
    } as any,
  });

  // Log activity
  await prisma.permitActivity.create({
    data: {
      permit: { connect: { id: permitId } },
      type: 'STATUS_UPDATED',
      action: 'STATUS_UPDATED',
      description: `Status updated to ${status}`,
      metadata: { notes } as any,
    },
  });

  // Emit event
  await eventBus.publish(EVENT_TYPES.PERMIT_STATUS_CHANGED, {
    permitId,
    projectId: permit.projectId,
    newStatus: status,
    notes,
  });

  return permit;
}

async function calculatePermitFees(data: {
  jurisdiction: string;
  permitType: PermitType;
  projectSize?: number;
}) {
  const fees = trackingService.calculateFees(
    data.jurisdiction,
    data.permitType,
    data.projectSize
  );

  const requiredDocs = trackingService.getRequiredDocuments(
    data.jurisdiction,
    data.permitType
  );

  const estimatedApproval = trackingService.estimateApprovalDate(
    data.jurisdiction,
    data.permitType
  );

  return {
    estimatedFees: fees,
    requiredDocuments: requiredDocs,
    estimatedApprovalDate: estimatedApproval,
    estimatedDays: daysUntilDeadline(estimatedApproval),
  };
}

async function notifyPermitApproved(permit: any) {
  const project = await prisma.project.findUnique({
    where: { id: permit.projectId },
    include: {
      projectManagers: {
        include: { user: true },
      },
    },
  });

  if (!project) return;

  const pmEmails = (project as any).projectManagers?.map(
    (pm: any) => pm.user.email
  ) || [];

  if (pmEmails.length > 0) {
    await sendEmail({
      to: pmEmails,
      subject: `Permit Approved: ${permit.type} - ${project.name}`,
      html: `
        <h2>Permit Approved!</h2>
        <p>Great news! The following permit has been approved:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Project:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${project.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Permit Type:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${permit.type}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Application #:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${permit.applicationNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Approved:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(new Date())}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          <strong>Next Steps:</strong><br>
          1. Download or pick up the issued permit<br>
          2. Post permit on job site as required<br>
          3. Schedule required inspections
        </p>
      `,
    });
  }
}

// Create worker
export const permitTrackerWorker = createWorker(
  QUEUE_NAMES.PERMIT_TRACKER,
  processPermitJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function permitTrackerRoutes(fastify: FastifyInstance) {
  /**
   * Get all permits for a project
   */
  fastify.get('/projects/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { status } = request.query as { status?: string };

    const permits = await prisma.permit.findMany({
      where: {
        projectId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return permits;
  });

  /**
   * Get permit by ID
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, address: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!permit) {
      return reply.status(404).send({ error: 'Permit not found' });
    }

    return permit;
  });

  /**
   * Create new permit
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const {
      projectId,
      type,
      jurisdiction,
      estimatedApprovalDays,
      documents,
      requirements,
      notes,
    } = request.body as {
      projectId: string;
      type: PermitType;
      jurisdiction: string;
      estimatedApprovalDays?: number;
      documents?: string[];
      requirements?: PermitRequirement[];
      notes?: string;
    };

    // Calculate fees and get requirements
    const jurisdictionInfo = trackingService.getJurisdictionInfo(jurisdiction);
    const fees = trackingService.calculateFees(jurisdiction, type);
    const requiredDocs = trackingService.getRequiredDocuments(jurisdiction, type);

    const permit = await prisma.permit.create({
      data: {
        projectId,
        type,
        jurisdiction,
        status: 'DRAFT',
        estimatedApprovalDays: estimatedApprovalDays ||
          (jurisdictionInfo?.averageReviewDays[type] || 30),
        fees,
        documents: documents || [],
        requirements: requirements?.map(r => ({
          ...r,
          status: 'pending',
        })) || requiredDocs.map(doc => ({
          id: crypto.randomUUID(),
          name: doc,
          description: `Required: ${doc}`,
          status: 'pending',
        })),
        notes,
      } as any,
    });

    // Log creation
    await prisma.permitActivity.create({
      data: {
        permitId: permit.id,
        type: 'CREATED',
        description: `${type} permit created for ${jurisdiction}`,
      } as any,
    });

    return permit;
  });

  /**
   * Update permit
   */
  fastify.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const updates = request.body as Partial<Permit>;

    const permit = await prisma.permit.update({
      where: { id },
      data: updates as any,
    });

    return permit;
  });

  /**
   * Submit permit application
   */
  fastify.post('/:id/submit', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { applicationNumber } = request.body as { applicationNumber?: string };

    const permit = await prisma.permit.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        appliedAt: new Date(),
        applicationNumber,
      } as any,
    });

    // Log submission
    await prisma.permitActivity.create({
      data: {
        permitId: id,
        type: 'SUBMITTED',
        description: `Permit application submitted${applicationNumber ? ` with #${applicationNumber}` : ''}`,
      } as any,
    });

    // Emit event
    await eventBus.publish(EVENT_TYPES.PERMIT_SUBMITTED, {
      permitId: id,
      projectId: permit.projectId,
      type: (permit as any).type,
      jurisdiction: (permit as any).jurisdiction,
    });

    return permit;
  });

  /**
   * Check permit status
   */
  fastify.post('/:id/check-status', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const job = await queues.PERMIT_TRACKER.add(
      'check-status',
      { type: 'CHECK_STATUS', permitId: id },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'checking' };
  });

  /**
   * Get permit timeline
   */
  fastify.get('/:id/timeline', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const timeline = await trackingService.getPermitTimeline(id);
    return timeline;
  });

  /**
   * Calculate permit fees and requirements
   */
  fastify.post('/calculate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jurisdiction, permitType, projectSize } = request.body as {
      jurisdiction: string;
      permitType: PermitType;
      projectSize?: number;
    };

    const result = await calculatePermitFees({ jurisdiction, permitType, projectSize });
    return result;
  });

  /**
   * Get jurisdiction information
   */
  fastify.get('/jurisdictions/:code', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.params as { code: string };

    const info = trackingService.getJurisdictionInfo(code);
    if (!info) {
      return reply.status(404).send({ error: 'Jurisdiction not found' });
    }

    return info;
  });

  /**
   * Get expiring permits
   */
  fastify.get('/expiring', async (request: FastifyRequest, reply: FastifyReply) => {
    const { days = '30' } = request.query as { days?: string };

    const permits = await trackingService.checkExpiringPermits(parseInt(days));
    return { count: permits.length, permits };
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      totalActive,
      pendingApproval,
      approved,
      expiringSoon,
    ] = await Promise.all([
      prisma.permit.count({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTIONS_REQUESTED'] } },
      }),
      prisma.permit.count({ where: { status: 'SUBMITTED' } }),
      prisma.permit.count({ where: { status: { in: ['APPROVED', 'ISSUED'] } } }),
      prisma.permit.count({
        where: {
          status: 'ISSUED',
          expiresAt: {
            lte: addWorkingDays(new Date(), 30),
            gte: new Date(),
          },
        },
      }),
    ]);

    return {
      totalActive,
      pendingApproval,
      approved,
      expiringSoon,
    };
  });
}
