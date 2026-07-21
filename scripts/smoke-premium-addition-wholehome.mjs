#!/usr/bin/env node
/**
 * Smoke test: Premium (tier 2) addition_expansion + whole_home_remodel concept packages.
 * Asserts interior + exterior render URLs and video placeholder on concept output.
 *
 * Usage:
 *   BASE_URL=https://kealee.com \
 *   INTAKE_ADDITION=<uuid> INTAKE_WHOLE_HOME=<uuid> \
 *   node scripts/smoke-premium-addition-wholehome.mjs
 *
 * Optional seed (requires DATABASE_URL or SUPABASE in env):
 *   SMOKE_SEED=1 BASE_URL=http://localhost:3000 node scripts/smoke-premium-addition-wholehome.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const BASE_URL = (process.env.BASE_URL ?? 'https://kealee.com').replace(/\/$/, '')
const TIER = Number(process.env.SMOKE_TIER ?? '2')

const CASES = [
  {
    name: 'Addition / Expansion (Premium)',
    envKey: 'INTAKE_ADDITION',
    projectPath: 'addition_expansion',
    minInterior: 2,
    minExterior: 2,
  },
  {
    name: 'Whole-Home Remodel (Premium)',
    envKey: 'INTAKE_WHOLE_HOME',
    projectPath: 'whole_home_remodel',
    minInterior: 2,
    minExterior: 2,
  },
]

function assertVisuals(caseName, co, mins) {
  const errors = []
  const interior = Array.isArray(co.interiorRenderUrls) ? co.interiorRenderUrls : []
  const exterior = Array.isArray(co.exteriorRenderUrls) ? co.exteriorRenderUrls : []
  const renderUrls = Array.isArray(co.renderUrls) ? co.renderUrls : []

  if (interior.length < mins.minInterior) {
    errors.push(`interiorRenderUrls: expected >=${mins.minInterior}, got ${interior.length}`)
  }
  if (exterior.length < mins.minExterior) {
    errors.push(`exteriorRenderUrls: expected >=${mins.minExterior}, got ${exterior.length}`)
  }
  if (renderUrls.length < mins.minInterior + mins.minExterior) {
    errors.push(`renderUrls combined: expected >=${mins.minInterior + mins.minExterior}, got ${renderUrls.length}`)
  }
  if (!co.videoUrl || typeof co.videoUrl !== 'string') {
    errors.push('videoUrl missing (Premium tier 2+ should attach placeholder or completed video)')
  }

  if (errors.length) {
    console.error(`  ✗ ${caseName}`)
    errors.forEach(e => console.error(`      - ${e}`))
    return false
  }

  console.log(`  ✓ ${caseName}`)
  console.log(`      interior: ${interior.length}  exterior: ${exterior.length}  video: yes`)
  interior.slice(0, 2).forEach((u, i) => console.log(`      interior[${i}]: ${u.slice(0, 72)}…`))
  exterior.slice(0, 2).forEach((u, i) => console.log(`      exterior[${i}]: ${u.slice(0, 72)}…`))
  console.log(`      videoUrl: ${co.videoUrl.slice(0, 72)}…`)
  return true
}

async function seedIntake(supabase, projectPath) {
  const id = randomUUID()
  const email = `smoke+${projectPath}@kealee.test`
  const form_data = {
    tier: TIER,
    firstName: 'Smoke',
    lastName: 'Test',
    style: 'modern contemporary',
    description: `Smoke test ${projectPath} premium visuals`,
  }
  const { error } = await supabase.from('public_intake_leads').insert({
    id,
    project_path: projectPath,
    status: 'paid',
    contact_email: email,
    form_data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(`seed ${projectPath}: ${error.message}`)
  return id
}

async function ensurePaidTier(supabase, intakeId, projectPath) {
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('id, status, project_path, form_data')
    .eq('id', intakeId)
    .maybeSingle()
  if (error || !data) throw new Error(`intake ${intakeId} not found`)
  const form = (data.form_data ?? {})
  const { error: upErr } = await supabase
    .from('public_intake_leads')
    .update({
      status: 'paid',
      project_path: projectPath,
      form_data: { ...form, tier: TIER },
    })
    .eq('id', intakeId)
  if (upErr) throw new Error(`update ${intakeId}: ${upErr.message}`)
}

async function generateConcept(intakeId) {
  const res = await fetch(`${BASE_URL}/api/concept/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intakeId }),
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text.slice(0, 500) }
  }
  return { status: res.status, body }
}

async function main() {
  console.log(`\nPremium visuals smoke — ${BASE_URL} (tier ${TIER})\n`)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let supabase = null
  if (supabaseUrl && serviceKey) {
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  if (process.env.SMOKE_SEED === '1') {
    if (!supabase) {
      console.error('SMOKE_SEED=1 requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY')
      process.exit(1)
    }
    for (const c of CASES) {
      const id = await seedIntake(supabase, c.projectPath)
      console.log(`Seeded ${c.projectPath}: ${id}`)
      process.env[c.envKey] = id
    }
  }

  let passed = 0
  let failed = 0

  for (const c of CASES) {
    let intakeId = process.env[c.envKey]
    if (!intakeId) {
      console.error(`  ✗ ${c.name} — set ${c.envKey} or SMOKE_SEED=1 with Supabase env`)
      failed++
      continue
    }

    if (supabase) {
      try {
        await ensurePaidTier(supabase, intakeId, c.projectPath)
      } catch (err) {
        console.error(`  ✗ ${c.name} — ${err.message}`)
        failed++
        continue
      }
    }

    console.log(`\n→ ${c.name} (${intakeId})`)
    const { status, body } = await generateConcept(intakeId)
    if (status !== 200) {
      console.error(`  ✗ generate HTTP ${status}`, body?.error ?? body?.message ?? body)
      failed++
      continue
    }

    const co = body.conceptOutput
    if (!co) {
      console.error('  ✗ no conceptOutput in response')
      failed++
      continue
    }

    if (assertVisuals(c.name, co, c)) passed++
    else failed++

    if (supabase) {
      const portal = (process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? 'https://owner.kealee.com').replace(/\/$/, '')
      console.log(`      portal: ${portal}/deliverables/${intakeId}?projectPath=${c.projectPath}`)
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
