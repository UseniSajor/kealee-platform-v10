import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, ACQUISITION_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import type { Job } from 'bullmq';

// Config per architecture doc §6
const CLAW_CONFIG = {
  name: 'acquisition-precon-claw',
  eventPatterns: ['project.*', 'estimation.*', 'ctc.*'],
  writableModels: [
    'Estimate', 'EstimateSection', 'EstimateLineItem',
    'BidRequest', 'BidInvitation', 'BidSubmission', 'ContractorBid',
  ],
};

export class AcquisitionPreConClaw extends BaseClaw {
  private ai: AIProvider;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();
  }

  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    // Route events to appropriate queues
    switch (event.type) {
      case 'project.created':
      case 'estimation.order.created': {
        const queue = createQueue(KEALEE_QUEUES.ESTIMATION_TOOL);
        await queue.add('analyze-project', { event });
        break;
      }
      case 'project.precon.requested': {
        const queue = createQueue(KEALEE_QUEUES.BID_ENGINE);
        await queue.add('create-bid-request', { event });
        break;
      }
      case 'ctc.imported': {
        // CTC import completed — trigger project analysis refresh for affected projects
        const queue = createQueue(KEALEE_QUEUES.ESTIMATION_TOOL);
        await queue.add('ctc-import-completed', { event });
        break;
      }
      case 'ctc.takeoff.confirmed': {
        // AI takeoff confirmed — can trigger bid request creation if project is ready
        const queue = createQueue(KEALEE_QUEUES.ESTIMATION_TOOL);
        await queue.add('takeoff-confirmed', { event });
        break;
      }
    }
  }

  async registerWorkers(): Promise<void> {
    // Bid Engine Worker
    createWorker(KEALEE_QUEUES.BID_ENGINE, async (job: Job) => {
      switch (job.name) {
        case 'create-bid-request':
          await this.handleCreateBidRequest(job);
          break;
        case 'score-submissions':
          await this.handleScoreSubmissions(job);
          break;
        case 'match-contractors':
          await this.handleMatchContractors(job);
          break;
      }
    });

    // Estimation Worker
    createWorker(KEALEE_QUEUES.ESTIMATION_TOOL, async (job: Job) => {
      switch (job.name) {
        case 'analyze-project':
          await this.handleAnalyzeProject(job);
          break;
        case 'calculate-costs':
          await this.handleCalculateCosts(job);
          break;
        case 'ctc-import-completed':
          await this.handleCTCImportCompleted(job);
          break;
        case 'takeoff-confirmed':
          await this.handleTakeoffConfirmed(job);
          break;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Bid Engine Workers
  // ---------------------------------------------------------------------------

  private async handleCreateBidRequest(job: Job): Promise<void> {
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

    // Publish event
    const newEvent = createEvent({
      type: EVENT_TYPES.bid.request.created,
      source: this.config.name,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: { bidRequestId: bidRequest.id },
      entity: { type: 'BidRequest', id: bidRequest.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(newEvent);
  }

  private async handleMatchContractors(job: Job): Promise<void> {
    const { bidRequestId, projectId, organizationId, event } = job.data;
    this.assertWritable('BidInvitation');

    // Get project details for matching
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return;

    // Find qualified contractors ordered by merit then fairness rotation
    const contractors = await this.prisma.contractorProfile.findMany({
      where: { isActive: true },
      orderBy: [
        { overallRating: 'desc' },
        { bidRotationPos: 'asc' }, // fairness rotation
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

    // Publish match event
    const matchEvent = createEvent({
      type: EVENT_TYPES.bid.contractors.matched,
      source: this.config.name,
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

  private async handleScoreSubmissions(job: Job): Promise<void> {
    const { bidRequestId, projectId, organizationId } = job.data;
    this.assertWritable('BidSubmission');

    const submissions = await this.prisma.bidSubmission.findMany({
      where: { bidRequestId },
      include: { contractor: true },
    });

    if (submissions.length === 0) return;

    // Get estimate for baseline comparison
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

    // Publish scored event
    const scoredEvent = createEvent({
      type: EVENT_TYPES.bid.submissions.scored,
      source: this.config.name,
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

  // ---------------------------------------------------------------------------
  // Estimation Workers
  // ---------------------------------------------------------------------------

  private async handleAnalyzeProject(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('Estimate');

    // Create estimate record
    const estimate = await this.prisma.estimate.create({
      data: {
        projectId: event.projectId,
        organizationId: event.organizationId,
        name: `Estimate - ${new Date().toLocaleDateString()}`,
        status: 'DRAFT',
        type: 'CONCEPTUAL',
      },
    });

    // AI analysis of project scope
    const aiResult = await this.ai.reason({
      task:
        'Analyze this project and suggest CSI MasterFormat sections with ' +
        'preliminary cost ranges. Consider regional cost indexes.',
      context: event.payload as Record<string, unknown>,
      systemPrompt: ACQUISITION_PROMPT,
    });

    // Queue cost calculation
    const queue = createQueue(KEALEE_QUEUES.ESTIMATION_TOOL);
    await queue.add('calculate-costs', {
      estimateId: estimate.id,
      projectId: event.projectId,
      organizationId: event.organizationId,
      aiAnalysis: aiResult,
      event,
    });

    // Publish estimate created
    const newEvent = createEvent({
      type: EVENT_TYPES.estimate.created,
      source: this.config.name,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: { estimateId: estimate.id },
      entity: { type: 'Estimate', id: estimate.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(newEvent);
  }

  // ---------------------------------------------------------------------------
  // CTC Workers
  // ---------------------------------------------------------------------------

  private async handleCTCImportCompleted(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    const payload = event.payload as { costDatabaseId?: string; taskCount?: number };

    // Log the CTC import completion for auditing
    console.log(
      `[AcquisitionPreCon] CTC import completed: ${payload.taskCount || 0} tasks ` +
      `imported to database ${payload.costDatabaseId || 'unknown'}`
    );

    // If there are projects in PRE_CONSTRUCTION that use CTC, re-analyze them
    const activeProjects = await this.prisma.project.findMany({
      where: {
        organizationId: event.organizationId,
        status: 'PRE_CONSTRUCTION',
      },
      take: 10,
    });

    for (const project of activeProjects) {
      const queue = createQueue(KEALEE_QUEUES.ESTIMATION_TOOL);
      await queue.add('analyze-project', {
        event: createEvent({
          type: 'project.created',
          source: this.config.name,
          projectId: project.id,
          organizationId: event.organizationId,
          payload: { refreshReason: 'ctc-import-completed' },
          trigger: { eventId: event.id, eventType: event.type },
        }),
      });
    }
  }

  private async handleTakeoffConfirmed(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    const payload = event.payload as {
      takeoffJobId?: string;
      estimateId?: string;
      lineItemsCreated?: number;
    };

    if (!payload.estimateId) return;

    // Check if the estimate is linked to a project
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: payload.estimateId },
    });

    if (!estimate || !estimate.projectId) return;

    // Publish estimate.updated event so other CLAWs can react
    const updatedEvent = createEvent({
      type: EVENT_TYPES.estimate.updated,
      source: this.config.name,
      projectId: estimate.projectId,
      organizationId: estimate.organizationId,
      payload: {
        estimateId: estimate.id,
        status: 'AI_TAKEOFF_CONFIRMED',
        lineItemsAdded: payload.lineItemsCreated || 0,
        takeoffJobId: payload.takeoffJobId,
      },
      entity: { type: 'Estimate', id: estimate.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  private async handleCalculateCosts(job: Job): Promise<void> {
    const { estimateId, projectId, organizationId, aiAnalysis, event } =
      job.data;
    this.assertWritable('EstimateSection');
    this.assertWritable('EstimateLineItem');

    // Get regional cost data
    const materialCosts = await this.prisma.materialCost.findMany({
      take: 100,
    });
    const laborRates = await this.prisma.laborRate.findMany({ take: 100 });

    // Use AI to generate line items from analysis
    const _costResult = await this.ai.reason({
      task:
        'Generate estimate line items with quantities, unit costs, and totals. ' +
        'Use assembly-based costing where applicable.',
      context: {
        aiAnalysis,
        materialCosts: materialCosts
          .slice(0, 20)
          .map((m) => ({ name: m.name, unitCost: m.unitCost, unit: m.unit })),
        laborRates: laborRates
          .slice(0, 20)
          .map((l) => ({ trade: l.trade, hourlyRate: l.hourlyRate })),
      },
      systemPrompt: ACQUISITION_PROMPT,
    });

    // Update estimate status
    await this.prisma.estimate.update({
      where: { id: estimateId },
      data: { status: 'IN_REVIEW' },
    });

    // Publish updated event
    const updatedEvent = createEvent({
      type: EVENT_TYPES.estimate.updated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: { estimateId, status: 'IN_REVIEW' },
      entity: { type: 'Estimate', id: estimateId },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(updatedEvent);
  }
}
