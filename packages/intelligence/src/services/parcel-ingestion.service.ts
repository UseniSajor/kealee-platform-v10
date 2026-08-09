import type { PropertyTwinUpsertInput } from './interfaces.js'
import { prismaPropertyTwinService } from './property-twin.service.js'
import { loopRunService } from './loop-run.service.js'
import { SAMPLE_PARCELS, type SampleParcel } from '../fixtures/sample-parcels.js'
import type { PropertyTwinSnapshot } from '../schemas/twins.js'

export interface ParcelIngestInput {
  address: string
  parcelId?: string
  jurisdiction?: string
  propertyType?: string
  lotSize?: number
  buildingSize?: number
  yearBuilt?: number
  assessedValue?: number
  zoning?: Record<string, unknown>
  permitHistory?: Record<string, unknown>[]
  ownershipType?: string
  orgId?: string
  triggerEventId?: string
}

export interface ParcelIngestResult {
  propertyTwin: PropertyTwinSnapshot
  loopRunId: string
  created: boolean
}

export class ParcelIngestionService {
  async ingest(input: ParcelIngestInput): Promise<ParcelIngestResult> {
    const existing = input.parcelId
      ? await prismaPropertyTwinService.getByParcelId(input.parcelId)
      : await prismaPropertyTwinService.getByAddress(input.address)

    const upsertInput: PropertyTwinUpsertInput = {
      orgId: input.orgId,
      parcelId: input.parcelId,
      address: input.address,
      jurisdiction: input.jurisdiction,
      propertyType: input.propertyType,
      lotSize: input.lotSize,
      buildingSize: input.buildingSize,
      yearBuilt: input.yearBuilt,
      assessedValue: input.assessedValue,
      zoning: input.zoning,
      permitHistory: input.permitHistory,
      ownershipType: input.ownershipType,
      dataSources: ['parcel_ingestion'],
      dataQualityScore: input.parcelId ? 0.75 : 0.6,
    }

    const propertyTwin = await prismaPropertyTwinService.upsert(upsertInput)

    const loopRun = await loopRunService.create({
      loopType: 'property_intelligence',
      triggerEventType: 'PROPERTY_IMPORTED',
      triggerEventId: input.triggerEventId,
      propertyTwinId: propertyTwin.id,
      orgId: input.orgId,
      context: { source: 'parcel_ingestion', address: input.address },
    })

    await loopRunService.recordStep({
      loopRunId: loopRun.id,
      stepOrder: 1,
      stepName: 'parcel_ingestion',
      output: { propertyTwinId: propertyTwin.id, address: input.address },
    })

    await loopRunService.complete(loopRun.id, {
      propertyTwinId: propertyTwin.id,
      action: 'property_imported',
    })

    return {
      propertyTwin,
      loopRunId: loopRun.id,
      created: !existing,
    }
  }

  async ingestSample(sample: SampleParcel = SAMPLE_PARCELS[0]): Promise<ParcelIngestResult> {
    return this.ingest({
      parcelId: sample.parcelId,
      address: sample.address,
      jurisdiction: sample.jurisdiction,
      propertyType: sample.propertyType,
      lotSize: sample.lotSize,
      buildingSize: sample.buildingSize,
      yearBuilt: sample.yearBuilt,
      assessedValue: sample.assessedValue,
      zoning: 'zoning' in sample ? (sample.zoning as Record<string, unknown>) : undefined,
      permitHistory: 'permitHistory' in sample ? [...sample.permitHistory] : undefined,
      ownershipType: 'ownershipType' in sample ? sample.ownershipType : undefined,
      triggerEventId: sample.parcelId,
    })
  }

  async ingestAllSamples(): Promise<ParcelIngestResult[]> {
    const results: ParcelIngestResult[] = []
    for (const sample of SAMPLE_PARCELS) {
      results.push(await this.ingestSample(sample))
    }
    return results
  }

  findSampleByAddress(address: string): SampleParcel | undefined {
    const normalized = address.toLowerCase().trim()
    return SAMPLE_PARCELS.find(
      (p) => p.address.toLowerCase() === normalized || normalized.includes(p.address.split(',')[0].toLowerCase()),
    )
  }
}

export const parcelIngestionService = new ParcelIngestionService()
