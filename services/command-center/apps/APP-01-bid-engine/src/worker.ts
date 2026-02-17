/**
 * APP-01: CONTRACTOR BID ENGINE - WORKER
 * BullMQ Worker for processing bid engine jobs
 */

import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  createWorker,
  queues,
  QUEUE_NAMES,
  JOB_OPTIONS,
} from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { sendBidInvitation, sendEmail, EMAIL_TEMPLATES } from '../../../shared/integrations/email.js';
import { ContractorMatcher } from './services/contractor-matcher.js';
import { BidAnalyzer } from './services/bid-analyzer.js';
import { BidEngineJob, MatchResult } from './types.js';
import { addWorkingDays } from '../../../shared/utils/date.js';

const prisma = new PrismaClient();
const matcher = new ContractorMatcher();
const analyzer = new BidAnalyzer();

/**
 * Main job processor for bid engine
 */
async function processBidEngineJob(job: Job<BidEngineJob>): Promise<unknown> {
  console.log(`[BidEngine] Processing job: ${job.data.type} (${job.id})`);

  switch (job.data.type) {
    case 'CREATE_BID_REQUEST':
      return handleCreateBidRequest(job.data);

    case 'FIND_CONTRACTORS':
      return handleFindContractors(job.data);

    case 'SEND_INVITATIONS':
      return handleSendInvitations(job.data);

    case 'ANALYZE_BIDS':
      return handleAnalyzeBids(job.data);

    case 'SEND_REMINDERS':
      return handleSendReminders(job.data);

    case 'AWARD_BID':
      return handleAwardBid(job.data);

    case 'VERIFY_CREDENTIALS':
      return handleVerifyCredentials(job.data);

    default:
      throw new Error(`Unknown job type: ${(job.data as { type: string }).type}`);
  }
}

/**
 * Create a new bid request
 */
async function handleCreateBidRequest(data: BidEngineJob & { type: 'CREATE_BID_REQUEST' }) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: data.projectId },
    include: { client: true },
  });

  // Create bid request record
  const bidRequest = await prisma.bidRequest.create({
    data: {
      projectId: data.projectId,
      scope: data.scope as unknown as object,
      requirements: data.requirements as unknown as object,
      trades: data.trades,
      deadline: new Date(data.deadline),
      status: 'OPEN',
      estimatedBudget: data.estimatedBudget,
    },
  });

  // Emit event
  await getEventBus('bid-engine').publish(
    EVENT_TYPES.BID_REQUEST_CREATED,
    {
      bidRequestId: bidRequest.id,
      projectId: data.projectId,
      projectName: project.name,
      trades: data.trades,
      deadline: data.deadline,
    }
  );

  // Queue contractor matching
  await queues.BID_ENGINE.add(
    'find-contractors',
    {
      type: 'FIND_CONTRACTORS',
      bidRequestId: bidRequest.id,
      criteria: {
        projectId: data.projectId,
        trades: data.trades,
        location: {
          lat: project.latitude || 38.9,
          lng: project.longitude || -77.0,
        },
        budgetRange: {
          min: data.estimatedBudget ? data.estimatedBudget * 0.7 : 0,
          max: data.estimatedBudget ? data.estimatedBudget * 1.3 : Infinity,
        },
        timeline: {
          start: new Date(),
          end: new Date(data.deadline),
        },
      },
    },
    JOB_OPTIONS.DEFAULT
  );

  return { bidRequestId: bidRequest.id };
}

/**
 * Find matching contractors
 */
async function handleFindContractors(data: BidEngineJob & { type: 'FIND_CONTRACTORS' }) {
  const matches = await matcher.findMatches(data.criteria);

  if (matches.length === 0) {
    console.log('[BidEngine] No matching contractors found');
    return { matches: [], matchCount: 0 };
  }

  // Store match results
  await prisma.bidRequest.update({
    where: { id: data.bidRequestId },
    data: {
      matchResults: matches as unknown as object,
    },
  });

  // Queue invitation sending
  await queues.BID_ENGINE.add(
    'send-invitations',
    {
      type: 'SEND_INVITATIONS',
      bidRequestId: data.bidRequestId,
      contractorIds: matches.map(m => m.contractorId),
    },
    JOB_OPTIONS.DEFAULT
  );

  return { matches, matchCount: matches.length };
}

/**
 * Send bid invitations to contractors
 */
async function handleSendInvitations(data: BidEngineJob & { type: 'SEND_INVITATIONS' }) {
  const bidRequest = await prisma.bidRequest.findUniqueOrThrow({
    where: { id: data.bidRequestId },
    include: { project: true },
  });

  const contractors = await prisma.contractor.findMany({
    where: { id: { in: data.contractorIds } },
  });

  const invitationIds: string[] = [];
  const matchResults = (bidRequest.matchResults as unknown as MatchResult[]) || [];

  for (const contractor of contractors) {
    // Create invitation record
    const invitation = await prisma.bidInvitation.create({
      data: {
        bidRequestId: data.bidRequestId,
        contractorId: contractor.id,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Generate unique bid submission link
    const bidLink = `${process.env.APP_URL}/bids/submit/${invitation.id}`;

    // Find match score
    const match = matchResults.find(m => m.contractorId === contractor.id);

    // Send email
    try {
      await sendBidInvitation({
        contractorEmail: contractor.email,
        contractorName: contractor.contactName,
        projectName: bidRequest.project.name || 'Unnamed Project',
        projectAddress: bidRequest.project.address || '',
        deadline: bidRequest.deadline,
        bidLink,
        matchScore: match ? Math.round(match.score * 100) : undefined,
        matchReasons: match?.matchReasons,
      });

      invitationIds.push(invitation.id);

      // Emit event
      await getEventBus('bid-engine').publish(
        EVENT_TYPES.BID_INVITATION_SENT,
        {
          invitationId: invitation.id,
          bidRequestId: data.bidRequestId,
          contractorId: contractor.id,
          contractorEmail: contractor.email,
        }
      );
    } catch (error) {
      console.error(`[BidEngine] Failed to send invitation to ${contractor.email}:`, error);
    }
  }

  // Schedule reminders 3 days before deadline
  const reminderTime = bidRequest.deadline.getTime() - 3 * 24 * 60 * 60 * 1000;
  const delay = reminderTime - Date.now();

  if (delay > 0) {
    await queues.BID_ENGINE.add(
      'send-reminders',
      { type: 'SEND_REMINDERS', bidRequestId: data.bidRequestId },
      { ...JOB_OPTIONS.SCHEDULED, delay }
    );
  }

  return { invitationCount: invitationIds.length };
}

/**
 * Analyze submitted bids
 */
async function handleAnalyzeBids(data: BidEngineJob & { type: 'ANALYZE_BIDS' }) {
  const comparison = await analyzer.analyzeBids(data.bidRequestId);

  // Update bid request status
  await prisma.bidRequest.update({
    where: { id: data.bidRequestId },
    data: { status: 'EVALUATING' },
  });

  return comparison;
}

/**
 * Send reminder emails
 */
async function handleSendReminders(data: BidEngineJob & { type: 'SEND_REMINDERS' }) {
  const invitations = await prisma.bidInvitation.findMany({
    where: {
      bidRequestId: data.bidRequestId,
      status: { in: ['SENT', 'VIEWED'] },
    },
    include: {
      contractor: true,
      bidRequest: { include: { project: true } },
    },
  });

  let sentCount = 0;

  for (const invitation of invitations) {
    const daysUntilDeadline = Math.ceil(
      (invitation.bidRequest.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline > 0 && daysUntilDeadline <= 3) {
      try {
        await sendEmail({
          to: invitation.contractor.email,
          subject: `Reminder: Bid deadline in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''} - ${invitation.bidRequest.project.name}`,
          html: `
            <p>Hi ${invitation.contractor.contactName},</p>
            <p>This is a friendly reminder that the bid deadline for
            <strong>${invitation.bidRequest.project.name}</strong>
            is in <strong>${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}</strong>.</p>
            <p>Please submit your bid before ${invitation.bidRequest.deadline.toLocaleDateString()}.</p>
            <p><a href="${process.env.APP_URL}/bids/submit/${invitation.id}">Submit Your Bid</a></p>
            <p>Thank you,<br/>Kealee</p>
          `,
        });
        sentCount++;
      } catch (error) {
        console.error(`[BidEngine] Failed to send reminder to ${invitation.contractor.email}:`, error);
      }
    }
  }

  return { remindersSent: sentCount };
}

/**
 * Award bid to selected contractor
 */
async function handleAwardBid(data: BidEngineJob & { type: 'AWARD_BID' }) {
  const submission = await prisma.bidSubmission.findUniqueOrThrow({
    where: { id: data.submissionId },
    include: {
      contractor: true,
      bidRequest: { include: { project: true } },
    },
  });

  // Update winning submission
  await prisma.bidSubmission.update({
    where: { id: data.submissionId },
    data: { status: 'SELECTED' },
  });

  // Update bid request
  await prisma.bidRequest.update({
    where: { id: data.bidRequestId },
    data: {
      status: 'AWARDED',
      awardedContractorId: submission.contractorId,
      awardedAt: new Date(),
    },
  });

  // Send award notification to winner
  await sendEmail({
    to: submission.contractor.email,
    templateId: EMAIL_TEMPLATES.BID_AWARDED,
    dynamicTemplateData: {
      contractor_name: submission.contractor.contactName,
      project_name: submission.bidRequest.project.name,
      bid_amount: Number(submission.amount).toLocaleString(),
    },
  });

  // Emit event
  await getEventBus('bid-engine').publish(
    EVENT_TYPES.BID_AWARDED,
    {
      bidRequestId: data.bidRequestId,
      projectId: submission.bidRequest.projectId,
      contractorId: submission.contractorId,
      contractorName: submission.contractor.companyName,
      amount: Number(submission.amount),
    }
  );

  // Notify other bidders if requested
  if (data.notifyOthers) {
    const otherSubmissions = await prisma.bidSubmission.findMany({
      where: {
        bidRequestId: data.bidRequestId,
        id: { not: data.submissionId },
        status: { not: 'WITHDRAWN' },
      },
      include: { contractor: true },
    });

    for (const other of otherSubmissions) {
      await prisma.bidSubmission.update({
        where: { id: other.id },
        data: { status: 'REJECTED' },
      });

      await sendEmail({
        to: other.contractor.email,
        templateId: EMAIL_TEMPLATES.BID_NOT_SELECTED,
        dynamicTemplateData: {
          contractor_name: other.contractor.contactName,
          project_name: submission.bidRequest.project.name,
        },
      });
    }
  }

  return {
    awarded: true,
    contractorId: submission.contractorId,
    contractorName: submission.contractor.companyName,
  };
}

/**
 * Verify contractor credentials
 */
async function handleVerifyCredentials(data: BidEngineJob & { type: 'VERIFY_CREDENTIALS' }) {
  const contractor = await prisma.contractor.findUniqueOrThrow({
    where: { id: data.contractorId },
    include: { credentials: true },
  });

  const verificationResults: Array<{
    type: string;
    status: 'VALID' | 'EXPIRED' | 'EXPIRING_SOON' | 'MISSING';
    expiresAt?: Date;
  }> = [];

  const requiredTypes = ['LICENSE', 'GENERAL_LIABILITY', 'WORKERS_COMP'];
  const now = new Date();
  const thirtyDaysFromNow = addWorkingDays(now, 30);

  for (const required of requiredTypes) {
    const cred = contractor.credentials.find(c =>
      c.type.toUpperCase().includes(required)
    );

    if (!cred) {
      verificationResults.push({ type: required, status: 'MISSING' });
    } else if (cred.expiresAt && cred.expiresAt < now) {
      verificationResults.push({
        type: required,
        status: 'EXPIRED',
        expiresAt: cred.expiresAt,
      });
    } else if (cred.expiresAt && cred.expiresAt < thirtyDaysFromNow) {
      verificationResults.push({
        type: required,
        status: 'EXPIRING_SOON',
        expiresAt: cred.expiresAt,
      });
    } else {
      verificationResults.push({
        type: required,
        status: 'VALID',
        expiresAt: cred.expiresAt || undefined,
      });
    }
  }

  const isVerified = verificationResults.every(
    r => r.status === 'VALID' || r.status === 'EXPIRING_SOON'
  );

  return {
    contractorId: data.contractorId,
    isVerified,
    results: verificationResults,
    issues: verificationResults
      .filter(r => r.status !== 'VALID')
      .map(r => `${r.type}: ${r.status}`),
  };
}

// Create and export worker
export const bidEngineWorker = createWorker(
  QUEUE_NAMES.BID_ENGINE,
  processBidEngineJob,
  { concurrency: 5 }
);

// Handle worker events
bidEngineWorker.on('completed', (job) => {
  console.log(`[BidEngine] Job completed: ${job.data.type} (${job.id})`);
});

bidEngineWorker.on('failed', (job, err) => {
  console.error(`[BidEngine] Job failed: ${job?.data?.type} (${job?.id}):`, err.message);
});
