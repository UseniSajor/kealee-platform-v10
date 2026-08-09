import { prisma, Prisma } from '@kealee/database'
import type { PropertyTwinService, PropertyTwinUpsertInput } from './interfaces.js'
import type { PropertyTwinSnapshot } from '../schemas/twins.js'
import type { PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { OpportunityScoringOutput } from '../schemas/opportunity-scoring.js'

function toSnapshot(row: {
  id: string
  address: string
  parcelId: string | null
  jurisdiction: string | null
  zoning: unknown
  lotSize: number | null
  buildingSize: number | null
  yearBuilt: number | null
  propertyType: string | null
  ownershipType: string | null
  assessedValue: { toNumber(): number } | null
  lastSaleDate: Date | null
  permitHistory: unknown
  riskFlags: string[]
  opportunityFlags: string[]
  recommendedProducts: string[]
  latestScores: unknown
  dataSources: string[]
  dataQualityScore: number
}): PropertyTwinSnapshot {
  return {
    id: row.id,
    address: row.address,
    parcelId: row.parcelId ?? undefined,
    jurisdiction: row.jurisdiction ?? undefined,
    zoning: (row.zoning as Record<string, unknown>) ?? undefined,
    lotSize: row.lotSize ?? undefined,
    buildingSize: row.buildingSize ?? undefined,
    yearBuilt: row.yearBuilt ?? undefined,
    propertyType: row.propertyType ?? undefined,
    ownershipType: row.ownershipType ?? undefined,
    assessedValue: row.assessedValue ? row.assessedValue.toNumber() : undefined,
    lastSaleDate: row.lastSaleDate?.toISOString(),
    permitHistory: Array.isArray(row.permitHistory) ? (row.permitHistory as Record<string, unknown>[]) : undefined,
    riskFlags: row.riskFlags,
    opportunityFlags: row.opportunityFlags,
    recommendedProducts: row.recommendedProducts,
    latestScores: (row.latestScores as Record<string, unknown>) ?? undefined,
    dataSources: row.dataSources,
    dataQualityScore: row.dataQualityScore,
  }
}

export class PrismaPropertyTwinService implements PropertyTwinService {
  async getById(id: string): Promise<PropertyTwinSnapshot | null> {
    const row = await prisma.propertyTwin.findUnique({ where: { id } })
    return row ? toSnapshot(row) : null
  }

  async getByParcelId(parcelId: string): Promise<PropertyTwinSnapshot | null> {
    const row = await prisma.propertyTwin.findFirst({ where: { parcelId } })
    return row ? toSnapshot(row) : null
  }

  async getByAddress(address: string): Promise<PropertyTwinSnapshot | null> {
    const row = await prisma.propertyTwin.findFirst({ where: { address } })
    return row ? toSnapshot(row) : null
  }

  async upsert(input: PropertyTwinUpsertInput): Promise<PropertyTwinSnapshot> {
    const existing = input.parcelId
      ? await prisma.propertyTwin.findFirst({ where: { parcelId: input.parcelId } })
      : await prisma.propertyTwin.findFirst({ where: { address: input.address } })

    const data: Prisma.PropertyTwinCreateInput = {
      orgId: input.orgId,
      parcelId: input.parcelId,
      address: input.address,
      jurisdiction: input.jurisdiction,
      zoning: input.zoning as Prisma.InputJsonValue | undefined,
      lotSize: input.lotSize,
      buildingSize: input.buildingSize,
      yearBuilt: input.yearBuilt,
      propertyType: input.propertyType,
      ownershipType: input.ownershipType,
      assessedValue: input.assessedValue,
      lastSaleDate: input.lastSaleDate,
      permitHistory: input.permitHistory as Prisma.InputJsonValue | undefined,
      riskFlags: input.riskFlags ?? [],
      opportunityFlags: input.opportunityFlags ?? [],
      recommendedProducts: input.recommendedProducts ?? [],
      latestScores: input.latestScores as Prisma.InputJsonValue | undefined,
      dataSources: input.dataSources ?? [],
      dataQualityScore: input.dataQualityScore ?? 0,
      propertySummary: input.propertySummary,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    }

    const row = existing
      ? await prisma.propertyTwin.update({ where: { id: existing.id }, data })
      : await prisma.propertyTwin.create({ data })

    return toSnapshot(row)
  }

  async applyAgentOutput(
    propertyTwinId: string,
    output: PropertyIntelligenceOutput | OpportunityScoringOutput,
  ): Promise<PropertyTwinSnapshot> {
    const isProperty = 'recommendedKealeeProducts' in output
    const update = isProperty
      ? {
          propertySummary: output.propertySummary,
          propertyType: output.propertyType,
          ownershipType: output.ownershipType,
          recommendedProducts: output.recommendedKealeeProducts,
          dataQualityScore: output.dataQualityScore,
          riskFlags: [
            output.permitRisk === 'high' ? 'permit_risk_high' : '',
            output.zoningRisk === 'high' ? 'zoning_risk_high' : '',
          ].filter(Boolean),
        }
      : {
          latestScores: {
            totalOpportunityScore: output.totalOpportunityScore,
            recommendedPriority: output.recommendedPriority,
            productScores: output.productScores,
          } as Prisma.InputJsonValue,
          dataQualityScore: output.dataQualityScore,
        }

    const row = await prisma.propertyTwin.update({
      where: { id: propertyTwinId },
      data: update,
    })
    return toSnapshot(row)
  }
}

export const prismaPropertyTwinService = new PrismaPropertyTwinService()
