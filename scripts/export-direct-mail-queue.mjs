#!/usr/bin/env node
/**
 * Export pending direct-mail parcel outreach rows to CSV for print vendor.
 * Output: data/outreach/direct-mail-queue.csv
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

async function main() {
  const vars = loadRailwayVars()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? vars.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? vars.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase URL/key required')

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('parcel_outreach_queue')
    .select('payload, parcel_outreach_targets(address, zoning_code, outreach_token)')
    .eq('channel', 'direct_mail')
    .eq('status', 'pending')

  if (error) throw new Error(error.message)

  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? vars.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'
  const outDir = path.join(repoRoot, 'data', 'outreach')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'direct-mail-queue.csv')

  const header = 'owner_name,mailing_address,property_address,zoning_code,qr_url,headline'
  const rows = (data ?? []).map((r) => {
    const p = r.payload || {}
    const t = r.parcel_outreach_targets || {}
    const qr =
      p.qrUrl ??
      (t?.outreach_token ? `${SITE}/outreach/p/${t.outreach_token}` : '')
    const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`
    return [
      esc(p.ownerName ?? 'Property Owner'),
      esc(p.mailingAddress ?? t?.address ?? ''),
      esc(t?.address ?? ''),
      esc(t?.zoning_code ?? p.zoningCode ?? ''),
      esc(qr),
      esc(p.headline ?? 'Kealee property feasibility review'),
    ].join(',')
  })

  fs.writeFileSync(outPath, [header, ...rows].join('\n'), 'utf8')
  console.log(`[export-direct-mail] wrote ${rows.length} rows to ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
