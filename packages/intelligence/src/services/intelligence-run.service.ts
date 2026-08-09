import { prisma, Prisma } from '@kealee/database'
import type { IntelligenceEngineTypeName } from '../constants/loop-types.js'
import type { IntelligenceEventType } from '../constants/events.js'

export interface RecordIntelligenceRunInput {
  engineType: IntelligenceEngineTypeName
  loopRunId?: string
  projectId?: string
  propertyTwinId?: string
  leadTwinId?: string
  capitalTwinId?: string
  projectTwinId?: string
  triggerEvent: IntelligenceEventType | string
  triggerEventId?: string
  agentId?: string
  inputSnapshot: Record<string, unknown>
  outputSnapshot: Record<string, unknown>
  confidenceScore: number
  requiresHumanReview: boolean
  reviewReasons?: string[]
}

export class IntelligenceRunService {
  async record(input: RecordIntelligenceRunInput) {
    return prisma.intelligenceRun.create({
      data: {
        engineType: input.engineType,
        loopRunId: input.loopRunId,
        projectId: input.projectId,
        propertyTwinId: input.propertyTwinId,
        leadTwinId: input.leadTwinId,
        capitalTwinId: input.capitalTwinId,
        projectTwinId: input.projectTwinId,
        triggerEvent: input.triggerEvent,
        triggerEventId: input.triggerEventId,
        agentId: input.agentId,
        inputSnapshot: input.inputSnapshot as Prisma.InputJsonValue,
        outputSnapshot: input.outputSnapshot as Prisma.InputJsonValue,
        confidenceScore: input.confidenceScore,
        requiresHumanReview: input.requiresHumanReview,
        reviewReasons: input.reviewReasons ?? [],
      },
    })
  }

  async getById(id: string) {
    return prisma.intelligenceRun.findUnique({
      where: { id },
      include: {
        loopRun: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
        propertyTwin: true,
        leadTwin: true,
        projectTwin: true,
        capitalTwin: true,
      },
    })
  }

  async listByTwin(filters: {
    propertyTwinId?: string
    leadTwinId?: string
    projectTwinId?: string
    capitalTwinId?: string
    engineType?: IntelligenceEngineTypeName
    limit?: number
  }) {
    return prisma.intelligenceRun.findMany({
      where: {
        ...(filters.propertyTwinId ? { propertyTwinId: filters.propertyTwinId } : {}),
        ...(filters.leadTwinId ? { leadTwinId: filters.leadTwinId } : {}),
        ...(filters.projectTwinId ? { projectTwinId: filters.projectTwinId } : {}),
        ...(filters.capitalTwinId ? { capitalTwinId: filters.capitalTwinId } : {}),
        ...(filters.engineType ? { engineType: filters.engineType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 20,
      include: { loopRun: true },
    })
  }
}

export const intelligenceRunService = new IntelligenceRunService()
