import { prisma, Prisma } from '@kealee/database'
import type { CapitalIntelligenceOutput } from '../schemas/capital-intelligence.js'

export interface CapitalTwinSnapshot {
  id: string
  orgId?: string
  projectTwinId?: string
  propertyTwinId?: string
  leadTwinId?: string
  capitalFitScore: number
  estimatedEquity?: number
  estimatedLTV?: number
  recommendedLoanProducts: string[]
  fundingGap?: number
  lenderRouting?: string
  consentFinancing: boolean
}

function toSnapshot(row: {
  id: string
  orgId: string | null
  projectTwinId: string | null
  propertyTwinId: string | null
  leadTwinId: string | null
  capitalFitScore: number
  estimatedEquity: { toNumber(): number } | null
  estimatedLTV: number | null
  recommendedLoanProducts: string[]
  fundingGap: { toNumber(): number } | null
  lenderRouting: string | null
  consentFinancing: boolean
}): CapitalTwinSnapshot {
  return {
    id: row.id,
    orgId: row.orgId ?? undefined,
    projectTwinId: row.projectTwinId ?? undefined,
    propertyTwinId: row.propertyTwinId ?? undefined,
    leadTwinId: row.leadTwinId ?? undefined,
    capitalFitScore: row.capitalFitScore,
    estimatedEquity: row.estimatedEquity ? row.estimatedEquity.toNumber() : undefined,
    estimatedLTV: row.estimatedLTV ?? undefined,
    recommendedLoanProducts: row.recommendedLoanProducts,
    fundingGap: row.fundingGap ? row.fundingGap.toNumber() : undefined,
    lenderRouting: row.lenderRouting ?? undefined,
    consentFinancing: row.consentFinancing,
  }
}

export class PrismaCapitalTwinService {
  async getById(id: string): Promise<CapitalTwinSnapshot | null> {
    const row = await prisma.capitalTwin.findUnique({ where: { id } })
    return row ? toSnapshot(row) : null
  }

  async applyAgentOutput(input: {
    id?: string
    orgId?: string
    propertyTwinId?: string
    leadTwinId?: string
    projectTwinId?: string
    consentFinancing: boolean
    output: CapitalIntelligenceOutput
  }): Promise<CapitalTwinSnapshot> {
    const data: Prisma.CapitalTwinCreateInput = {
      orgId: input.orgId,
      capitalFitScore: input.output.capitalFitScore,
      estimatedEquity: input.output.estimatedEquity,
      estimatedLTV: input.output.estimatedLTV,
      recommendedLoanProducts: input.output.recommendedLoanProducts,
      fundingGap: input.output.fundingGap,
      requiredDocuments: input.output.requiredDocuments,
      lenderRouting: input.output.lenderRoutingRecommendation,
      riskFlags: input.output.riskFlags,
      complianceFlags: input.output.complianceFlags,
      consentFinancing: input.consentFinancing,
      propertyTwin: input.propertyTwinId ? { connect: { id: input.propertyTwinId } } : undefined,
      leadTwin: input.leadTwinId ? { connect: { id: input.leadTwinId } } : undefined,
      projectTwin: input.projectTwinId ? { connect: { id: input.projectTwinId } } : undefined,
    }

    const row = input.id
      ? await prisma.capitalTwin.update({
          where: { id: input.id },
          data: {
            capitalFitScore: input.output.capitalFitScore,
            estimatedEquity: input.output.estimatedEquity,
            estimatedLTV: input.output.estimatedLTV,
            recommendedLoanProducts: input.output.recommendedLoanProducts,
            fundingGap: input.output.fundingGap,
            requiredDocuments: input.output.requiredDocuments,
            lenderRouting: input.output.lenderRoutingRecommendation,
            riskFlags: input.output.riskFlags,
            complianceFlags: input.output.complianceFlags,
            consentFinancing: input.consentFinancing,
          },
        })
      : await prisma.capitalTwin.create({ data })

    return toSnapshot(row)
  }
}

export const prismaCapitalTwinService = new PrismaCapitalTwinService()
