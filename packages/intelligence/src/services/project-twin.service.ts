import { prisma, Prisma } from '@kealee/database'
import type { ProjectIntelligenceOutput } from '../schemas/project-intelligence.js'

export interface ProjectTwinSnapshot {
  id: string
  orgId?: string
  projectId?: string
  propertyTwinId?: string
  leadTwinId?: string
  name?: string
  scope?: Record<string, unknown>
  budget?: number
  permitStatus?: string
  healthScore: number
  missingItems: string[]
  riskFlags: string[]
}

function toSnapshot(row: {
  id: string
  orgId: string | null
  projectId: string | null
  propertyTwinId: string | null
  leadTwinId: string | null
  name: string | null
  scope: unknown
  budget: { toNumber(): number } | null
  permitStatus: string | null
  healthScore: number
  missingItems: string[]
  riskFlags: string[]
}): ProjectTwinSnapshot {
  return {
    id: row.id,
    orgId: row.orgId ?? undefined,
    projectId: row.projectId ?? undefined,
    propertyTwinId: row.propertyTwinId ?? undefined,
    leadTwinId: row.leadTwinId ?? undefined,
    name: row.name ?? undefined,
    scope: (row.scope as Record<string, unknown>) ?? undefined,
    budget: row.budget ? row.budget.toNumber() : undefined,
    permitStatus: row.permitStatus ?? undefined,
    healthScore: row.healthScore,
    missingItems: row.missingItems,
    riskFlags: row.riskFlags,
  }
}

export class PrismaProjectTwinService {
  async getById(id: string): Promise<ProjectTwinSnapshot | null> {
    const row = await prisma.projectTwin.findUnique({ where: { id } })
    return row ? toSnapshot(row) : null
  }

  async ensure(input: {
    orgId?: string
    projectId?: string
    propertyTwinId?: string
    leadTwinId?: string
    name?: string
    scope?: Record<string, unknown>
    budget?: number
  }): Promise<ProjectTwinSnapshot> {
    const existing = input.projectId
      ? await prisma.projectTwin.findUnique({ where: { projectId: input.projectId } })
      : null

    const data: Prisma.ProjectTwinCreateInput = {
      orgId: input.orgId,
      projectId: input.projectId,
      name: input.name,
      scope: input.scope as Prisma.InputJsonValue | undefined,
      budget: input.budget,
      propertyTwin: input.propertyTwinId ? { connect: { id: input.propertyTwinId } } : undefined,
      leadTwin: input.leadTwinId ? { connect: { id: input.leadTwinId } } : undefined,
    }

    const row = existing
      ? await prisma.projectTwin.update({
          where: { id: existing.id },
          data: {
            name: input.name ?? existing.name,
            scope: input.scope ? (input.scope as Prisma.InputJsonValue) : undefined,
            budget: input.budget ?? existing.budget,
          },
        })
      : await prisma.projectTwin.create({ data })

    return toSnapshot(row)
  }

  async applyAgentOutput(projectTwinId: string, output: ProjectIntelligenceOutput): Promise<ProjectTwinSnapshot> {
    const row = await prisma.projectTwin.update({
      where: { id: projectTwinId },
      data: {
        healthScore: output.projectHealthScore,
        missingItems: output.missingItems,
        riskFlags: output.riskFlags,
        metrics: {
          budgetImpact: output.budgetImpact,
          scheduleImpact: output.scheduleImpact,
          customerSummary: output.customerSummary,
          adminSummary: output.adminSummary,
        } as Prisma.InputJsonValue,
      },
    })
    return toSnapshot(row)
  }
}

export const prismaProjectTwinService = new PrismaProjectTwinService()
