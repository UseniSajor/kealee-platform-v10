import { z } from 'zod'

/** ContextBuilder payload assembled before agent invocation */
export const contextBuilderPayloadSchema = z.object({
  loopType: z.string(),
  triggerEventType: z.string().optional(),
  propertyTwin: z.record(z.unknown()).optional(),
  leadTwin: z.record(z.unknown()).optional(),
  parcelData: z.record(z.unknown()).optional(),
  permitData: z.array(z.record(z.unknown())).optional(),
  gisData: z.record(z.unknown()).optional(),
  censusMarketData: z.record(z.unknown()).optional(),
  crmHistory: z.array(z.record(z.unknown())).optional(),
  campaignHistory: z.array(z.record(z.unknown())).optional(),
  serviceCatalog: z.array(z.record(z.unknown())).optional(),
  complianceFlags: z.array(z.string()).default([]),
  retrievedAt: z.string().datetime(),
})

export type ContextBuilderPayload = z.infer<typeof contextBuilderPayloadSchema>
