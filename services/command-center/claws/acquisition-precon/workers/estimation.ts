/**
 * Claw A — Estimation Worker Handlers
 *
 * Handles project analysis, cost calculation, CTC import integration,
 * and takeoff confirmation.  Uses AI for scope analysis and cost estimation
 * with CSI MasterFormat section suggestions and assembly-based costing.
 */
import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import type { AIProvider } from '@kealee/ai';
import { ACQUISITION_PROMPT } from '@kealee/ai';
import type { Job } from 'bullmq';

export class EstimationWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
  ) {}

  async handleAnalyzeProject(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('Estimate');

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

    const newEvent = createEvent({
      type: EVENT_TYPES.estimate.created,
      source: this.clawName,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: { estimateId: estimate.id },
      entity: { type: 'Estimate', id: estimate.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(newEvent);
  }

  async handleCalculateCosts(job: Job): Promise<void> {
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

    const updatedEvent = createEvent({
      type: EVENT_TYPES.estimate.updated,
      source: this.clawName,
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

  async handleCTCImportCompleted(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    const payload = event.payload as { costDatabaseId?: string; taskCount?: number };

    console.log(
      `[AcquisitionPreCon] CTC import completed: ${payload.taskCount || 0} tasks ` +
      `imported to database ${payload.costDatabaseId || 'unknown'}`
    );

    // Re-analyze PRE_CONSTRUCTION projects affected by cost database updates
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
          source: this.clawName,
          projectId: project.id,
          organizationId: event.organizationId,
          payload: { refreshReason: 'ctc-import-completed' },
          trigger: { eventId: event.id, eventType: event.type },
        }),
      });
    }
  }

  async handleTakeoffConfirmed(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    const payload = event.payload as {
      takeoffJobId?: string;
      estimateId?: string;
      lineItemsCreated?: number;
    };

    if (!payload.estimateId) return;

    const estimate = await this.prisma.estimate.findUnique({
      where: { id: payload.estimateId },
    });

    if (!estimate || !estimate.projectId) return;

    const updatedEvent = createEvent({
      type: EVENT_TYPES.estimate.updated,
      source: this.clawName,
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
}
