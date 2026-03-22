/**
 * Zoning Lookup Interface
 * Decouples buildability-snapshot from Prisma — callers (API routes / worker) inject a lookup fn.
 * The concept-engine package has no Prisma dependency; the API/worker layer provides the resolver.
 */

import type { ZoningData } from './buildability-snapshot'

/**
 * A function that looks up zoning data from live DB or external GIS.
 * Returns null if no match found — caller falls back to Claude AI inference.
 */
export type ZoningLookupFn = (params: {
  address: string
  jurisdiction?: string
  parcelNumber?: string
}) => Promise<ZoningData | null>

/**
 * No-op lookup — always returns null (forces Claude AI inference).
 * Used when no Prisma/GIS resolver is available.
 */
export const noopZoningLookup: ZoningLookupFn = async () => null
