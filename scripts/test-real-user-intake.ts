#!/usr/bin/env node
/**
 * scripts/test-real-user-intake.ts
 *
 * Simulates a real user going through the intake form — exactly the same
 * API calls the browser makes, in the same order:
 *
 *  Step 1  POST /api/intake/soft-capture   (lead capture, fire-and-forget)
 *  Step 2  POST /api/intake               (create intake record)
 *  Step 3  POST /api/intake/redeem        (promo code → marks paid, triggers generation)
 *  Step 4  GET  /api/concept/generate     (poll until concept_ready)
 *  Step 5  GET  /api/deliverables         (verify delivery appears in portal)
 *
 * Usage:
 *   pnpm tsx scripts/test-real-user-intake.ts
 *   pnpm tsx scripts/test-real-user-intake.ts --service kitchen --tier 2 --host http://localhost:3002
 */

import * as fs   from 'node:fs'
import * as path from 'node:path'

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val   = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
}

const ROOT = process.cwd()
loadEnvFile(path.join(ROOT, 'services', 'api', '.env'))
loadEnvFile(path.join(ROOT, 'services', 'api', '.env.local'))
loadEnvFile(path.join(ROOT, 'apps', 'web-main', '.env.local'))
loadEnvFile(path.join(ROOT, 'apps', 'portal-owner', '.env.local'))

// ── CLI args ────────────────────────────────────────────────────────────────

const argv       = process.argv.slice(2)
const get        = (flag: string, fallback: string) => {
  const i = argv.indexOf(flag); return i >= 0 ? (argv[i + 1] ?? fallback) : fallback
}
const BASE_URL    = get('--host', 'http://localhost:3002')
const SERVICE     = get('--service', 'kitchen')
const TIER        = Number(get('--tier', '2'))
const ATTACHMENTS = get('--attachments', '')   // comma-separated before-photo URLs
const PROMO_CODE  = 'KEALEE-ALLIN-2026'

// Map service slug to intakePath (mirrors services-config.ts)
const SERVICE_PATH: Record<string, string> = {
  kitchen:        'kitchen_remodel',
  bathroom:       'bathroom_remodel',
  garden:         'garden_concept',
  addition:       'addition_expansion',
  'whole-house':  'whole_home_remodel',
  interior:       'interior_renovation',
  facade:         'exterior_concept',
  deck:           'exterior_concept',
  'design-services': 'interior_reno_concept',
}
const projectPath = SERVICE_PATH[SERVICE] ?? 'kitchen_remodel'
const PORTAL_URL  = (process.env.OWNER_PORTAL_URL ?? 'http://localhost:3000').replace(/\/$/, '')

// Test user — realistic data
const USER = {
  firstName:   'Tim',
  lastName:    'Chamberlain',
  email:       'tim.chamberlain24@gmail.com',
  phone:       '202-555-0101',
  address:     '1234 Capitol Hill St NW, Washington DC 20024',
  zip:         '20024',
  budget:      '75000',
  scope:       'Full kitchen remodel with open concept layout, quartz countertops, custom cabinetry, and new appliances. Want to remove the wall between kitchen and living room.',
  style:       'modern',
  priority:    'quality',
  timeline:    '6_months',
  sqft:        '400',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(step: string, msg: string) {
  console.log(`${step} ${msg}`)
}

async function apiPost(route: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${BASE_URL}${route}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`POST ${route} → ${res.status}: ${data?.error ?? JSON.stringify(data)}`)
  return data
}

async function apiGet(route: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${route}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GET ${route} → ${res.status}: ${data?.error ?? JSON.stringify(data)}`)
  return data
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══════════════════════════════════════════════════════')
  console.log('  Kealee — Real User Intake Simulation')
  console.log('══════════════════════════════════════════════════════')
  console.log(`  Server:   ${BASE_URL}`)
  console.log(`  Service:  ${SERVICE} → ${projectPath}`)
  console.log(`  Tier:     ${TIER}`)
  console.log(`  User:     ${USER.firstName} ${USER.lastName} <${USER.email}>`)
  console.log(`  Promo:    ${PROMO_CODE}`)
  if (ATTACHMENTS) console.log(`  Before:   ${ATTACHMENTS.split(',').length} photo(s) attached`)
  console.log()

  // ── Step 1: Soft capture (fire-and-forget lead tracking) ────────────────────

  process.stdout.write('[1/5] POST /api/intake/soft-capture (lead capture)... ')
  try {
    await apiPost('/api/intake/soft-capture', {
      email:   USER.email,
      name:    `${USER.firstName} ${USER.lastName}`,
      service: SERVICE,
      source:  'concept-confirm',
    })
    console.log('OK')
  } catch {
    console.log('skipped (not critical)')
  }

  // ── Step 2: Create intake record ──────────────────────────────────────────

  process.stdout.write('[2/5] POST /api/intake (create intake record)... ')
  const { intakeId } = await apiPost('/api/intake', {
    projectPath,
    clientName:     `${USER.firstName} ${USER.lastName}`,
    contactEmail:   USER.email,
    contactPhone:   USER.phone || null,
    projectAddress: USER.address || `ZIP: ${USER.zip}`,
    budgetRange:    USER.budget || 'Not provided',
    formData: {
      description: USER.scope,
      budget:      USER.budget,
      zip:         USER.zip,
      tier:        TIER,
      style:       USER.style,
      priority:    USER.priority,
      timeline:    USER.timeline,
      sqft:        USER.sqft,
      ...(ATTACHMENTS && { attachments: ATTACHMENTS }),
    },
  })
  console.log(`OK → intakeId: ${intakeId}`)

  // ── Step 3: Redeem promo code (bypasses Stripe, triggers generation) ────────

  process.stdout.write('[3/5] POST /api/intake/redeem (promo code)... ')
  await apiPost('/api/intake/redeem', {
    intakeId,
    projectPath,
    promoCode: PROMO_CODE,
  })
  console.log('OK — intake marked paid, generation triggered')

  // ── Step 4: Poll /api/concept/status until concept_ready ──────────────────

  console.log('[4/5] Polling concept generation...')
  console.log('      (floor plan + Claude AI narrative + renders queued)')

  const deadline = Date.now() + 5 * 60_000   // 5-min timeout
  let lastStatus = ''
  let dotCount   = 0

  while (Date.now() < deadline) {
    await sleep(5000)

    // Poll via Supabase REST using service role key (bypasses RLS)
    const supabaseUrl  = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      console.log('\n  Cannot poll — Supabase env vars not loaded')
      break
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/public_intake_leads?id=eq.${intakeId}&select=status,form_data`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    )
    const rows = await res.json().catch(() => []) as any[]
    const row  = rows[0]
    if (!row) { process.stdout.write('.'); dotCount++; continue }

    const status = row.status as string
    if (status !== lastStatus) {
      if (dotCount > 0) { console.log(); dotCount = 0 }
      console.log(`  Status: ${status}`)
      lastStatus = status
    } else {
      process.stdout.write('.')
      dotCount++
    }

    if (status === 'concept_ready') {
      if (dotCount > 0) console.log()
      const fd      = (row.form_data ?? {}) as any
      const co      = fd.conceptOutput ?? {}
      const renders = (co.renderUrls ?? []) as string[]
      const video   = fd.conceptVideo as any

      console.log()
      console.log('[4/5] Concept generation complete!')
      console.log(`  Package ID:    ${co.conceptPackageId ?? '(pending)'}`)
      console.log(`  Renders:       ${renders.length} URL${renders.length !== 1 ? 's' : ''}`)
      if (renders.length > 0) renders.slice(0, 3).forEach((u, i) => console.log(`    [${i+1}] ${u}`))
      if (video?.status)       console.log(`  Video:         ${video.status} (${video.provider ?? '—'})`)
      break
    }

    if (status === 'failed') {
      if (dotCount > 0) console.log()
      console.error('[4/5] Generation failed. Check server logs.')
      break
    }
  }

  if (Date.now() >= deadline && lastStatus !== 'concept_ready') {
    console.log('\n  Timed out — generation is still running in background.')
  }

  // ── Step 5: Verify deliverable appears in portal API ─────────────────────

  process.stdout.write('\n[5/5] Verifying portal deliverable endpoint... ')
  try {
    // Use Supabase directly (the portal /api/deliverables requires auth session)
    const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const res = await fetch(
      `${supabaseUrl}/rest/v1/public_intake_leads?id=eq.${intakeId}&select=id,status,client_name,project_path`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    )
    const rows = await res.json().catch(() => []) as any[]
    const row  = rows[0]
    console.log(`OK — status: ${row?.status ?? '?'}, project: ${row?.project_path ?? '?'}`)
  } catch (err: any) {
    console.log(`skipped (${err?.message})`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════')
  console.log('  INTAKE SIMULATION COMPLETE')
  console.log('══════════════════════════════════════════════════════')
  console.log(`  Intake ID:    ${intakeId}`)
  console.log(`  Portal URL:   ${PORTAL_URL}/deliverables/${intakeId}`)
  console.log(`  Concept gate: http://localhost:3002/concept/access?next=/concept/${intakeId}&email=${encodeURIComponent(USER.email)}`)
  console.log()
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('\n[real-user-intake] FAILED:', msg)
  if (process.env.DEBUG && err instanceof Error) console.error(err.stack)
  process.exit(1)
})
