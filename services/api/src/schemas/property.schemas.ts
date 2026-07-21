import { z } from 'zod'

export const createPropertySchema = z.object({
  orgId: z.string().uuid().nullable().optional(),
  address: z.string().min(1),
  address2: z.string().nullable().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),

  // Lot / parcel details
  lotNumber: z.string().nullable().optional(),
  parcelNumber: z.string().nullable().optional(),
  lotSizeSqFt: z.number().int().positive().nullable().optional(),
  yearBuilt: z.number().int().min(1600).max(2200).nullable().optional(),
})

export const searchPropertiesQuerySchema = z.object({
  q: z.string().min(1),
  orgId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
})

export const validateAddressQuerySchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
})

