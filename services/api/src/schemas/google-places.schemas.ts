/**
 * Google Places API Validation Schemas
 */

import { z } from 'zod';

export const autocompleteAddressSchema = z.object({
  input: z.string().min(1).max(200),
  sessionToken: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  radius: z.number().int().positive().max(50000).optional(),
});

export const placeDetailsSchema = z.object({
  placeId: z.string().min(1),
  sessionToken: z.string().optional(),
  fields: z.array(z.string()).optional(),
});

export const geocodeAddressSchema = z.object({
  address: z.string().min(1).max(500),
});

export const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const detectJurisdictionSchema = z.object({
  address: z.string().min(1).max(500),
});

