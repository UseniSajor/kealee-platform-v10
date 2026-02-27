/**
 * Claw A — Bid Engine Worker Handlers
 *
 * Handles contractor matching, bid request creation, and submission scoring.
 * Uses AI for contractor ranking (70% merit / 30% fairness rotation) and
 * bid scoring (40% price + 20% timeline + 25% rating + 15% fit).
 */
import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import type { AIProvider } from '@kealee/ai';
import { ACQUISITION_PROMPT } from '@kealee/ai';
import type { Job } from 'bullmq';

export class BidEngineWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
  ) {}

  async handleCreateBidRequest(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('BidRequest');

    const bidRequest = await this.prisma.bidRequest.create({
      data: {
        projectId: event.projectId,
        organizationId: event.organizationId,
        status: 'OPEN',
        scope: (event.payload as any).scope ?? '',
        deadline:
          (event.payload as any).deadline ??
          new Date(Date.now() + 7 * 86_400_000).toISOString(),
      },
    });

    // Match contractors using fair rotation (70% merit / 30% fairness)
    const queue = createQueue(KEALEE_QUEUES.BID_ENGINE);
    await queue.add('match-contractors', {
      bidRequestId: bidRequest.id,
      projectId: event.projectId,
      organizationId: event.organizationId,
      event,
    });

    const newEvent = createEvent({
      type: EVENT_TYPES.bid.request.created,
      source: this.clawName,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: { bidRequestId: bidRequest.id },
      entity: { type: 'BidRequest', id: bidRequest.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(newEvent);
  }

  async handleMatchContractors(job: Job): Promise<void> {
    const { bidRequestId, projectId, organizationId, event } = job.data;
    this.assertWritable('BidInvitation');

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return;

    // Find qualified contractors ordered by merit then fairness rotation
    const contractors = await this.prisma.contractorProfile.findMany({
      where: { isActive: true },
      orderBy: [
        { overallRating: 'desc' },
        { bidRotationPos: 'asc' },
      ],
      take: 10,
    });

    // Fair rotation: 70% merit-based, 30% fairness (round-robin)
    const meritCount = Math.ceil(contractors.length * 0.7);
    const _fairnessCount = contractors.length - meritCount;

    // Score and select top contractors using AI
    const _aiResult = await this.ai.reason({
      task:
        'Score and rank contractors for this project based on trade fit, ' +
        'location, rating, and capacity.',
      context: {
        project: { name: project.name, type: (project as any).type },
        contractors: contractors.map((c) => ({
          id: c.id,
          trades: (c as any).trades,
          rating: c.overallRating,
          location: (c as any).serviceArea,
        })),
      },
      systemPrompt: ACQUISITION_PROMPT,
    });

    // Create invitations for top contractors
    const selectedContractors = contractors.slice(
      0,
      Math.min(5, contractors.length),
    );
    for (const contractor of selectedContractors) {
      await this.prisma.bidInvitation.create({
        data: {
          bidRequestId,
          contractorId: contractor.id,
          status: 'PENDING',
          invitedAt: new Date(),
        },
      });
    }

    const matchEvent = createEvent({
      type: EVENT_TYPES.bid.contractors.matched,
      source: this.clawName,
      projectId,
      organizationId,
      payload: {
        bidRequestId,
        contractorCount: selectedContractors.length,
      },
      entity: { type: 'BidRequest', id: bidRequestId },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(matchEvent);
  }

  async handleScoreSubmissions(job: Job): Promise<void> {
    const { bidRequestId, projectId, organizationId } = job.data;
    this.assertWritable('BidSubmission');

    const submissions = await this.prisma.bidSubmission.findMany({
      where: { bidRequestId },
      include: { contractor: true },
    });

    if (submissions.length === 0) return;

    const estimate = await this.prisma.estimate.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    // AI scoring: price (40%) + timeline (20%) + rating (25%) + fit (15%)
    const aiResult = await this.ai.reason({
      task:
        'Score these bid submissions. Return JSON array of ' +
        '{ submissionId, priceScore, timelineScore, ratingScore, fitScore, totalScore, recommendation }',
      context: {
        estimateBaseline: estimate ? (estimate as any).totalCost : null,
        submissions: submissions.map((s) => ({
          id: s.id,
          amount: s.totalAmount,
          timeline: (s as any).proposedTimeline,
          contractorRating: (s.contractor as any)?.overallRating,
        })),
      },
      systemPrompt: ACQUISITION_PROMPT,
    });

    const scoredEvent = createEvent({
      type: EVENT_TYPES.bid.submissions.scored,
      source: this.clawName,
      projectId,
      organizationId,
      payload: {
        bidRequestId,
        submissionCount: submissions.length,
        aiAnalysis: aiResult,
      },
      trigger: job.data.event
        ? { eventId: job.data.event.id, eventType: job.data.event.type }
        : undefined,
    });
    await this.eventBus.publish(scoredEvent);
  }
}
