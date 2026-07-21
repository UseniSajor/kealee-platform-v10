#!/usr/bin/env node
/**
 * Backfill metadata.marketingChannel on public_intake_leads from UTM/source.
 *
 * Usage:
 *   node scripts/backfill-marketing-channel.mjs
 *   node scripts/backfill-marketing-channel.mjs --dry-run
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const PAID_UTM_MEDIUMS = new Set([
  'cpc', 'paid', 'paid_social', 'ppc', 'display', 'video', 'paid_search',
])
const SAAS_MARKERS = ['ghl', 'gohighlevel', 'klaviyo', 'hubspot', 'mailchimp']
const PAID_MARKERS = ['google_ads', 'meta_ads', 'facebook_ads', 'paid_meta', 'paid_google']
const ORGANIC_MARKERS = [
  'organic', 'marketing_bot', 'marketing', 'reddit', 'linkedin', 'instagram',
  'facebook', 'nextdoor', 'email', 'referral', 'seo', 'direct',
]

function norm(s) {
  return (s ?? '').trim().toLowerCase()
}

function classify(lead) {
  const meta = lead.metadata ?? {}
  const fd = lead.form_data ?? {}
  if (meta.marketingChannel) return meta.marketingChannel

  const source = norm(lead.source ?? fd.source ?? meta.marketingSource)
  const medium = norm(meta.utm_medium ?? fd.utm_medium ?? fd.utmMedium)
  const utmSource = norm(meta.utm_source ?? fd.utm_source ?? fd.utmSource)
  const tags = [...(meta.tags ?? []), ...(fd.tags ?? [])].map(norm)

  if (tags.some(t => t.includes('ghl') || t.includes('klaviyo'))) return 'marketing_saas'
  if (SAAS_MARKERS.some(m => source.includes(m) || utmSource.includes(m))) return 'marketing_saas'
  if (PAID_UTM_MEDIUMS.has(medium) || PAID_MARKERS.some(m => source.includes(m) || utmSource.includes(m))) {
    return 'paid_ads'
  }
  if (
    medium === 'organic' || medium === 'email' || medium === 'referral' ||
    ORGANIC_MARKERS.some(m => source.includes(m) || utmSource.includes(m))
  ) {
    return 'organic'
  }
  if (medium || utmSource) return 'organic'
  return 'unknown'
}

const dryRun = process.argv.includes('--dry-run')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

let offset = 0
const pageSize = 200
let updated = 0
let scanned = 0

while (true) {
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('id, source, metadata, form_data')
    .order('created_at', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error(error.message)
    process.exit(1)
  }
  if (!data?.length) break

  for (const lead of data) {
    scanned++
    const channel = classify(lead)
    const meta = lead.metadata ?? {}
    if (meta.marketingChannel === channel) continue

    const nextMeta = { ...meta, marketingChannel: channel }
    if (!dryRun) {
      const { error: upErr } = await supabase
        .from('public_intake_leads')
        .update({ metadata: nextMeta })
        .eq('id', lead.id)
      if (upErr) {
        console.warn(`Failed ${lead.id}:`, upErr.message)
        continue
      }
    }
    updated++
  }

  offset += pageSize
  if (data.length < pageSize) break
}

console.log(
  dryRun ? `[dry-run] Would update ${updated} of ${scanned} leads` : `Updated ${updated} of ${scanned} leads`,
)
