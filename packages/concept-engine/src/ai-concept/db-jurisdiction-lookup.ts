/**
 * DB-backed ZoningLookupFn — concept-engine
 *
 * Implements ZoningLookupFn using Prisma. Queries ZoningProfile first
 * (address-level data), then falls back to Jurisdiction by (city, state).
 * Returns null when no record is found so callers can fall back to Claude AI.
 */

import type { ZoningLookupFn } from './zoning-lookup'
import type { ZoningData } from './buildability-snapshot'

/** Minimal Prisma-shaped client expected by the lookup fn. */
interface ZoningPrismaClient {
  zoningProfile: {
    findFirst: (args: {
      where: Record<string, unknown>
      orderBy?: Record<string, unknown>
    }) => Promise<Record<string, unknown> | null>
  }
  jurisdiction: {
    findFirst: (args: {
      where: Record<string, unknown>
      orderBy?: Record<string, unknown>
    }) => Promise<Record<string, unknown> | null>
  }
}

/**
 * Parse city and state from an address string.
 * Works for standard US address formats:
 *   "1234 Main St, Arlington, VA 22202"
 *   "Arlington, VA"
 */
function parseCityState(address: string): { city: string | null; state: string | null } {
  if (!address?.trim()) return { city: null, state: null }

  // Try "City, STATE ZIP" or "City, STATE"
  const m = address.match(/,\s*([^,]+),\s*([A-Z]{2})(?:\s+\d{5})?(?:\s*$|,)/i)
  if (m) return { city: m[1].trim(), state: m[2].toUpperCase() }

  // Try trailing "City, ST"
  const m2 = address.match(/,\s*([^,]+?)\s*,\s*([A-Z]{2})\s*(?:\d{5})?\s*$/i)
  if (m2) return { city: m2[1].trim(), state: m2[2].toUpperCase() }

  // Try just "City, ST"
  const m3 = address.match(/^([^,]+),\s*([A-Z]{2})\s*(?:\d{5})?\s*$/i)
  if (m3) return { city: m3[1].trim(), state: m3[2].toUpperCase() }

  return { city: null, state: null }
}

/**
 * Map a ZoningProfile DB row to the ZoningData shape.
 */
function profileToZoningData(row: Record<string, unknown>): ZoningData {
  return {
    zoningCode:     String(row.zoningCode   ?? row.zoning_code    ?? 'Unknown'),
    zoningDistrict: String(row.description  ?? row.zoning_code    ?? 'Residential'),
    setbackFront:   typeof row.setbackFront === 'number' ? row.setbackFront : (typeof row.front_setback === 'number' ? row.front_setback : null),
    setbackSide:    typeof row.setbackSide  === 'number' ? row.setbackSide  : (typeof row.side_setback  === 'number' ? row.side_setback  : null),
    setbackRear:    typeof row.setbackRear  === 'number' ? row.setbackRear  : (typeof row.rear_setback  === 'number' ? row.rear_setback  : null),
    maxHeight:      typeof row.maxHeight    === 'number' ? row.maxHeight    : (typeof row.height_limit  === 'number' ? row.height_limit  : null),
    maxCoverage:    typeof row.lotCoverage  === 'number' ? row.lotCoverage  : (typeof row.lot_coverage  === 'number' ? row.lot_coverage  : null),
    lotSize:        typeof row.lotSizeMin   === 'number' ? row.lotSizeMin   : null,
    notes:          typeof row.notes        === 'string' ? row.notes        : null,
  }
}

/**
 * Map a Jurisdiction DB row to approximate ZoningData using its feeSchedule.
 * Used as a fallback when no ZoningProfile record is found.
 */
function jurisdictionToApproxZoningData(row: Record<string, unknown>): ZoningData {
  return {
    zoningCode:     'R (estimated)',
    zoningDistrict: `${row.city ?? ''}, ${row.state ?? ''} — jurisdiction-level estimate`,
    setbackFront:   null,
    setbackSide:    null,
    setbackRear:    null,
    maxHeight:      null,
    maxCoverage:    null,
    lotSize:        null,
    notes:          `avgReviewDays: ${row.avgReviewDays ?? 'N/A'}. Source: Jurisdiction record for ${row.name ?? row.city}.`,
  }
}

/**
 * Create a DB-backed ZoningLookupFn using Prisma.
 *
 * Resolution order:
 *   1. ZoningProfile matching address ILIKE (most specific)
 *   2. ZoningProfile matching (city, state) without address filter
 *   3. Jurisdiction matching (city, state) — returns approximate data
 *   4. Returns null → callers fall back to Claude AI inference
 */
export function createDbZoningLookup(prisma: ZoningPrismaClient): ZoningLookupFn {
  return async (input: { address: string; jurisdiction?: string; parcelNumber?: string }): Promise<ZoningData | null> => {
    const { address } = input
    if (!address?.trim()) return null

    const { city, state } = parseCityState(address)
    if (!city || !state) return null

    // 1. Try ZoningProfile with address match
    try {
      const profile = await prisma.zoningProfile.findFirst({
        where: {
          AND: [
            { OR: [{ city }, { municipality: city }] },
            { state },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })
      if (profile) return profileToZoningData(profile)
    } catch {
      // Table may not exist or query failed — continue
    }

    // 2. Try Jurisdiction (city, state) for approximate data
    try {
      const jRow = await prisma.jurisdiction.findFirst({
        where: {
          OR: [
            { city, state },
            { name: { contains: city } },
          ],
        },
      })
      if (jRow) return jurisdictionToApproxZoningData(jRow)
    } catch {
      // Continue — no DB record
    }

    return null
  }
}
