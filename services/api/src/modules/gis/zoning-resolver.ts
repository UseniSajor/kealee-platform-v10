/**
 * Prisma-backed zoning resolver for buildability snapshots.
 * Queries ZoningProfile and ParcelZoning tables by address / jurisdiction.
 * Returns null if no match — caller falls back to Claude AI inference.
 */

import { prismaAny } from '../../utils/prisma-helper'
import type { ZoningData } from '@kealee/concept-engine'
import type { ZoningLookupFn } from '@kealee/concept-engine'

// ── ZoningProfile lookup ──────────────────────────────────────────────────────

async function lookupFromZoningProfile(
  address: string,
  jurisdiction?: string
): Promise<ZoningData | null> {
  try {
    // Normalize address for comparison — lowercase, remove punctuation
    const normalized = address.toLowerCase().replace(/[,#.]/g, '').trim()
    const words = normalized.split(/\s+/).filter((w) => w.length > 2)
    if (!words.length) return null

    // Build a partial-match query across address, city, zipCode
    // Use ZoningProfile model fields: address, city, state, zipCode, zoningCode, etc.
    const results = await prismaAny.zoningProfile.findMany({
      where: {
        OR: [
          jurisdiction ? { city: { contains: jurisdiction, mode: 'insensitive' } } : undefined,
          { address: { contains: words[0], mode: 'insensitive' } },
        ].filter(Boolean),
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }).catch(() => null)

    if (!results?.length) return null

    // Score results by address overlap
    let bestMatch: any = null
    let bestScore = 0
    for (const profile of results) {
      const profileAddr = (profile.address ?? '').toLowerCase()
      let score = 0
      for (const word of words) {
        if (profileAddr.includes(word)) score++
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = profile
      }
    }

    if (!bestMatch || bestScore < 1) return null

    return {
      zoningCode: bestMatch.zoningCode ?? '',
      zoningDistrict: String(bestMatch.zoningDistrict ?? ''),
      setbackFront: bestMatch.frontSetback ?? null,
      setbackSide: bestMatch.sideSetback ?? null,
      setbackRear: bestMatch.rearSetback ?? null,
      maxHeight: bestMatch.maxHeight ?? null,
      maxCoverage: bestMatch.maxLotCoverage ?? null,
      lotSize: bestMatch.minLotSize ?? null,
      notes: null,
    }
  } catch {
    return null
  }
}

// ── ParcelZoning lookup ───────────────────────────────────────────────────────

async function lookupFromParcelZoning(
  address: string,
  jurisdiction?: string
): Promise<ZoningData | null> {
  try {
    const results = await prismaAny.parcelZoning.findMany({
      where: jurisdiction
        ? { jurisdiction: { contains: jurisdiction, mode: 'insensitive' } }
        : undefined,
      take: 10,
      orderBy: { verifiedAt: 'desc' },
    }).catch(() => null)

    if (!results?.length) return null

    // Return the most recently verified record in this jurisdiction
    const p = results[0]
    return {
      zoningCode: p.zoningCode ?? '',
      zoningDistrict: p.zoningDesc ?? '',
      setbackFront: p.frontSetback ?? null,
      setbackSide: p.sideSetback ?? null,
      setbackRear: p.rearSetback ?? null,
      maxHeight: p.maxHeight ?? null,
      maxCoverage: p.maxLotCoverage ? Number(p.maxLotCoverage) : null,
      lotSize: p.minLotSize ? Number(p.minLotSize) : null,
      notes: p.complianceNotes ?? null,
    }
  } catch {
    return null
  }
}

// ── Exported resolver ─────────────────────────────────────────────────────────

/**
 * Live Prisma-based zoning lookup.
 * Tries ZoningProfile first (address match), then ParcelZoning (jurisdiction match).
 * Returns null if neither has a match.
 */
export const prismaZoningLookup: ZoningLookupFn = async ({ address, jurisdiction }) => {
  // Try ZoningProfile first — it has full address fields
  const fromProfile = await lookupFromZoningProfile(address, jurisdiction)
  if (fromProfile) return fromProfile

  // Fall back to ParcelZoning — jurisdiction-level data
  const fromParcel = await lookupFromParcelZoning(address, jurisdiction)
  return fromParcel
}
