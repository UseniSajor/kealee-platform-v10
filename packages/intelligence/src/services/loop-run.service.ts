import { prisma, Prisma } from '@kealee/database'
import type { IntelligenceLoopType } from '../constants/loop-types.js'
import type { IntelligenceEventType } from '../constants/events.js'

export interface CreateLoopRunInput {
  loopType: IntelligenceLoopType
  triggerEventType?: IntelligenceEventType
  triggerEventId?: string
  propertyTwinId?: string
  leadTwinId?: string
  projectTwinId?: string
  capitalTwinId?: string
  orgId?: string
  context?: Record<string, unknown>
}

export interface RecordLoopStepInput {
  loopRunId: string
  stepOrder: number
  stepName: string
  agentId?: string
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  errorMessage?: string
}

export class LoopRunService {
  async create(input: CreateLoopRunInput) {
    return prisma.loopRun.create({
      data: {
        loopType: input.loopType,
        status: 'running',
        triggerEventType: input.triggerEventType,
        triggerEventId: input.triggerEventId,
        propertyTwinId: input.propertyTwinId,
        leadTwinId: input.leadTwinId,
        projectTwinId: input.projectTwinId,
        capitalTwinId: input.capitalTwinId,
        orgId: input.orgId,
        context: input.context as Prisma.InputJsonValue | undefined,
        startedAt: new Date(),
      },
    })
  }

  async complete(loopRunId: string, result: Record<string, unknown>, awaitingReview = false) {
    return prisma.loopRun.update({
      where: { id: loopRunId },
      data: {
        status: awaitingReview ? 'awaiting_review' : 'completed',
        result: result as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    })
  }

  async fail(loopRunId: string, errorMessage: string) {
    return prisma.loopRun.update({
      where: { id: loopRunId },
      data: {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      },
    })
  }

  async recordStep(input: RecordLoopStepInput) {
    return prisma.loopStep.create({
      data: {
        loopRunId: input.loopRunId,
        stepOrder: input.stepOrder,
        stepName: input.stepName,
        agentId: input.agentId,
        status: input.status ?? 'completed',
        input: input.input as Prisma.InputJsonValue | undefined,
        output: input.output as Prisma.InputJsonValue | undefined,
        errorMessage: input.errorMessage,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    })
  }

  async recordOpportunityScore(
    propertyTwinId: string,
    loopRunId: string,
    output: {
      totalOpportunityScore: number
      productScores: Record<string, number>
      urgencyScore: number
      recommendedPriority: string
      recommendedNextAction?: string
      dataQualityScore: number
      scoreExplanation: string
      confidenceScore: number
      requiresHumanReview: boolean
      reviewReasons?: string[]
      crmUpdates?: Record<string, unknown>
      estimatedProjectValue?: number
      conversionLikelihood?: number
      revenuePotential?: number
    },
  ) {
    return prisma.opportunityScore.create({
      data: {
        propertyTwinId,
        loopRunId,
        totalOpportunityScore: output.totalOpportunityScore,
        productScores: output.productScores,
        urgencyScore: output.urgencyScore,
        recommendedPriority: output.recommendedPriority,
        recommendedNextAction: output.recommendedNextAction,
        dataQualityScore: output.dataQualityScore,
        scoreExplanation: output.scoreExplanation,
        confidenceScore: output.confidenceScore,
        requiresHumanReview: output.requiresHumanReview,
        reviewReasons: output.reviewReasons ?? [],
        crmUpdates: output.crmUpdates as Prisma.InputJsonValue | undefined,
        estimatedProjectValue: output.estimatedProjectValue,
        conversionLikelihood: output.conversionLikelihood,
        revenuePotential: output.revenuePotential,
      },
    })
  }

  async recordPropertyIntelligenceRun(
    propertyTwinId: string,
    loopRunId: string,
    inputContext: Record<string, unknown>,
    output: Record<string, unknown>,
    meta: {
      propertySummary?: string
      propertyType?: string
      ownershipType?: string
      confidenceScore: number
      requiresHumanReview: boolean
      dataQualityScore?: number
    },
  ) {
    return prisma.propertyIntelligenceRun.create({
      data: {
        propertyTwinId,
        loopRunId,
        inputContext: inputContext as Prisma.InputJsonValue,
        output: output as Prisma.InputJsonValue,
        propertySummary: meta.propertySummary,
        propertyType: meta.propertyType,
        ownershipType: meta.ownershipType,
        confidenceScore: meta.confidenceScore,
        requiresHumanReview: meta.requiresHumanReview,
        dataQualityScore: meta.dataQualityScore,
      },
    })
  }
}

export const loopRunService = new LoopRunService()
