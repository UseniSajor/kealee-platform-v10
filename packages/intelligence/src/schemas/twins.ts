import { z } from 'zod'

export const propertyTwinSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  address: z.string(),
  parcelId: z.string().optional(),
  jurisdiction: z.string().optional(),
  zoning: z.record(z.unknown()).optional(),
  lotSize: z.number().optional(),
  buildingSize: z.number().optional(),
  yearBuilt: z.number().int().optional(),
  propertyType: z.string().optional(),
  ownershipType: z.string().optional(),
  assessedValue: z.number().optional(),
  lastSaleDate: z.string().datetime().optional(),
  permitHistory: z.array(z.record(z.unknown())).optional(),
  riskFlags: z.array(z.string()).default([]),
  opportunityFlags: z.array(z.string()).default([]),
  recommendedProducts: z.array(z.string()).default([]),
  latestScores: z.record(z.unknown()).optional(),
  dataSources: z.array(z.string()).default([]),
  dataQualityScore: z.number().min(0).max(1),
})

export const leadTwinSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  propertyTwinId: z.string().uuid().optional(),
  crmContactId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
  leadType: z.string().optional(),
  segment: z.string().optional(),
  crmStatus: z.string().optional(),
  sourceChannel: z.string().optional(),
  complianceFlags: z.array(z.string()).default([]),
})

export type PropertyTwinSnapshot = z.infer<typeof propertyTwinSnapshotSchema>
export type LeadTwinSnapshot = z.infer<typeof leadTwinSnapshotSchema>
