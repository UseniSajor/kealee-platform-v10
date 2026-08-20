import { NextRequest, NextResponse } from 'next/server'
import { resolveAddressParcel } from '@/lib/site-intelligence/authoritative-gis'
import { checkRateLimit, clientKey } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * POST /api/site-intelligence/resolve
 *
 * Nationwide address → jurisdiction → (where covered) parcel geometry.
 * Called from the Site Plan intake steps. Never returns a hard failure for an
 * unmatched address: an unrecognised address resolves to a `manual-review`
 * record so the customer can still complete intake.
 */
export async function POST(req: NextRequest) {
  // This endpoint is unauthenticated and calls third-party services on our
  // behalf, so cap it per client.
  const limit = checkRateLimit(clientKey(req, 'site-intel'), 30, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many lookups. Wait a moment and try again.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  let address = ''
  try {
    const body = (await req.json()) as { address?: unknown }
    address = typeof body.address === 'string' ? body.address : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!address.trim()) {
    return NextResponse.json({ error: 'A property address is required.' }, { status: 400 })
  }
  if (address.length > 300) {
    return NextResponse.json({ error: 'Address is too long.' }, { status: 400 })
  }

  try {
    const resolution = await resolveAddressParcel(address)
    return NextResponse.json(resolution)
  } catch (error) {
    console.error(
      '[site-intelligence/resolve]',
      error instanceof Error ? error.message : error,
    )
    // A lookup failure must never block intake — degrade to manual review.
    return NextResponse.json({
      status: 'not_found',
      coverage: 'manual-review',
      coverageLabel: 'Manual review required',
      confidence: 0.2,
      standardizedAddress: address,
      latitude: null,
      longitude: null,
      jurisdiction: {
        state: null, stateName: null, county: null, city: null,
        countyFips: null, stateFips: null,
      },
      parcel: null,
      parcelCandidates: [],
      source: null,
      dataSources: [],
      warnings: [
        'Automated property lookup is temporarily unavailable. A Kealee reviewer will identify the jurisdiction manually — your order is not blocked.',
      ],
      itemsRequiringConfirmation: [
        'Property location and jurisdiction',
        'Zoning district, overlays, and current setback requirements for this parcel',
        'Surveyed property boundaries and easements',
      ],
      requiresProfessionalVerification: true,
    })
  }
}
