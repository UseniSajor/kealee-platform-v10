#!/usr/bin/env node
/**
 * Seed parcel_outreach_targets from data/zoning/dmv_zoning_seed.csv
 * and queue outreach (direct mail for residential zones).
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

function loadRailwayVars() {
  try {
    const raw = execSync('railway variables --service web-main --json', {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function parseCsv() {
  const csvPath = path.join(repoRoot, 'data', 'zoning', 'dmv_zoning_seed.csv')
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1)
  return lines.map((line) => {
    const cols = []
    let cur = ''
    let inQ = false
    for (const c of line) {
      if (c === '"') {
        inQ = !inQ
        continue
      }
      if (c === ',' && !inQ) {
        cols.push(cur)
        cur = ''
        continue
      }
      cur += c
    }
    cols.push(cur)
    const notes = cols[9] ?? ''
    const lotMatch = notes.match(/(\d[\d,]*)\s*sq\s*ft\s*min/i)
    const zoning = cols[2]?.trim() ?? ''
    const isResidential = /^R-/i.test(zoning) || /^RF-/i.test(zoning)
    return {
      address: cols[0]?.trim(),
      jurisdiction: cols[1]?.trim(),
      zoningCode: zoning,
      lotSizeSqft: lotMatch ? parseInt(lotMatch[1].replace(/,/g, ''), 10) : undefined,
      ownerMailingAddress: cols[0]?.trim(),
      propertyType: 'single_family',
      skip: !isResidential,
    }
  }).filter((r) => r.address && !r.skip)
}

async function main() {
  const vars = loadRailwayVars()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? vars.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? vars.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase URL/key required')

  const supabase = createClient(url, key)
  const parcels = parseCsv()
  let inserted = 0
  let skipped = 0
  let queued = 0

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? vars.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

  for (const p of parcels) {
    const { data: existing } = await supabase
      .from('parcel_outreach_targets')
      .select('id')
      .eq('address', p.address)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const { data: row, error } = await supabase
      .from('parcel_outreach_targets')
      .insert({
        address: p.address,
        jurisdiction: p.jurisdiction,
        zoning_code: p.zoningCode,
        lot_size_sqft: p.lotSizeSqft ?? null,
        property_type: p.propertyType,
        owner_mailing_address: p.ownerMailingAddress,
        enrichment_status: 'mailing_only',
        enrichment_source: 'dmv_zoning_seed',
        recommended_product: p.lotSizeSqft && p.lotSizeSqft >= 6000 ? 'adu_feasibility' : 'kitchen_bath_remodel',
        campaign_day: p.lotSizeSqft && p.lotSizeSqft >= 6000 ? 1 : 2,
      })
      .select('id, outreach_token')
      .single()

    if (error || !row) {
      console.warn('insert skip', p.address, error?.message)
      skipped++
      continue
    }
    inserted++

    const qrUrl = `${SITE}/outreach/p/${row.outreach_token}`
    const { error: qErr } = await supabase.from('parcel_outreach_queue').insert({
      target_id: row.id,
      channel: 'direct_mail',
      sequence_step: 1,
      payload: {
        mailingAddress: p.ownerMailingAddress,
        ownerName: 'Property Owner',
        qrUrl,
        headline: `Kealee property review — ${p.zoningCode} zone`,
        zoningCode: p.zoningCode,
      },
      scheduled_at: new Date().toISOString(),
      status: 'pending',
    })
    if (!qErr) queued++
  }

  console.log(JSON.stringify({ inserted, skipped, queued, residentialParcels: parcels.length }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
