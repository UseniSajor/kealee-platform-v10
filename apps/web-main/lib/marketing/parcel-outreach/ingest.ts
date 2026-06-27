/**
 * Ingest parcel targets from CSV rows or JSON (GIS / assessor export).
 */

import { getSupabaseAdmin } from '@/lib/supabase-server'
import { launchDayForProperty } from '@/lib/marketing/five-day-launch-sequence'
import type { PropertyRoutingContext } from '@kealee/intelligence'

export interface ParcelIngestInput {
  parcelId?: string
  address: string
  city?: string
  county?: string
  state?: string
  zipCode?: string
  jurisdiction?: string
  zoningCode?: string
  lotSizeSqft?: number
  yearBuilt?: number
  propertyType?: string
  ownershipType?: string
  ownerName?: string
  ownerMailingAddress?: string
  ownerEmail?: string
  ownerPhone?: string
}

export async function ingestParcelTargets(
  rows: ParcelIngestInput[],
): Promise<{ inserted: number; skipped: number }> {
  const supabase = getSupabaseAdmin()
  let inserted = 0
  let skipped = 0

  for (const row of rows) {
    const ctx: PropertyRoutingContext = {
      lotSize: row.lotSizeSqft,
      yearBuilt: row.yearBuilt,
      propertyType: row.propertyType,
      zoning: row.zoningCode ? { code: row.zoningCode } : undefined,
      ownershipType: row.ownershipType,
    }
    const launchStep = launchDayForProperty(ctx)

    const { data: existing } = await supabase
      .from('parcel_outreach_targets')
      .select('id')
      .eq('address', row.address)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const enrichmentStatus = row.ownerEmail
      ? 'email_found'
      : row.ownerPhone
        ? 'phone_found'
        : row.ownerMailingAddress
          ? 'mailing_only'
          : 'pending'

    const { error } = await supabase.from('parcel_outreach_targets').insert({
      parcel_id: row.parcelId ?? null,
      address: row.address,
      city: row.city ?? null,
      county: row.county ?? null,
      state: row.state ?? 'VA',
      zip_code: row.zipCode ?? null,
      jurisdiction: row.jurisdiction ?? null,
      zoning_code: row.zoningCode ?? null,
      lot_size_sqft: row.lotSizeSqft ?? null,
      year_built: row.yearBuilt ?? null,
      property_type: row.propertyType ?? null,
      ownership_type: row.ownershipType ?? null,
      owner_name: row.ownerName ?? null,
      owner_mailing_address: row.ownerMailingAddress ?? null,
      owner_email: row.ownerEmail ?? null,
      owner_phone: row.ownerPhone ?? null,
      enrichment_status: enrichmentStatus,
      enrichment_source: row.ownerEmail ? 'ingest' : null,
      intelligence_rule_id: launchStep?.propertyProfile.ruleId ?? null,
      recommended_product: launchStep?.recommendedProduct ?? null,
      campaign_day: launchStep?.day ?? null,
    })

    if (error) {
      skipped++
    } else {
      inserted++
    }
  }

  return { inserted, skipped }
}

/** Seed from DMV zoning CSV format (data/zoning/dmv_zoning_seed.csv) */
export function parseZoningCsvRow(cols: string[]): ParcelIngestInput | null {
  const [address, jurisdiction, zoningCode] = cols
  if (!address?.trim()) return null
  return {
    address: address.trim(),
    jurisdiction: jurisdiction?.trim(),
    zoningCode: zoningCode?.trim(),
    state: address.includes('DC') ? 'DC' : address.includes(' MD ') ? 'MD' : 'VA',
  }
}
