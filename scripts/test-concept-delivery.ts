#!/usr/bin/env node
/**
 * scripts/test-concept-delivery.ts
 *
 * End-to-end test for design concept package delivery.
 * Bypasses Stripe and BullMQ — runs the concept engine locally
 * and writes real output to Supabase so the portal delivery page works.
 *
 * Steps:
 *  1. Seeds a paid intake into Supabase public_intake_leads
 *  2. Runs generateFloorplan() (synchronous, no API calls)
 *  3. Runs generateConceptPackage() (calls Claude for AI narrative)
 *  4. Writes conceptOutput back to Supabase (simulates portal bridge)
 *  5. Prints the portal delivery URL
 *
 * Usage:
 *   tsx scripts/test-concept-delivery.ts
 *   tsx scripts/test-concept-delivery.ts --project bathroom_remodel
 *   pnpm test:concept
 *
 * Reads env from:
 *   services/api/.env           → ANTHROPIC_API_KEY
 *   services/api/.env.local     → SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   apps/portal-owner/.env.local → OWNER_PORTAL_URL
 */

import * as fs   from 'node:fs'
import * as path from 'node:path'

// ── Env loading ────────────────────────────────────────────────────────────────

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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
}

const ROOT = process.cwd()
loadEnvFile(path.join(ROOT, 'services', 'api', '.env'))
loadEnvFile(path.join(ROOT, 'services', 'api', '.env.local'))
loadEnvFile(path.join(ROOT, 'apps', 'portal-owner', '.env.local'))

// ── Config ─────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PORTAL_URL        = (process.env.OWNER_PORTAL_URL ?? 'http://localhost:3000').replace(/\/$/, '')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[test-concept] Missing Supabase credentials. Check services/api/.env.local')
  process.exit(1)
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[test-concept] Missing ANTHROPIC_API_KEY. Check services/api/.env')
  process.exit(1)
}

// ── CLI args ───────────────────────────────────────────────────────────────────

const argv        = process.argv.slice(2)
const projIdx     = argv.indexOf('--project')
const PROJECT_PATH = projIdx >= 0 ? (argv[projIdx + 1] ?? 'kitchen_remodel') : 'kitchen_remodel'

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const SB_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  apikey:         SERVICE_ROLE_KEY,
  Authorization:  `Bearer ${SERVICE_ROLE_KEY}`,
  Prefer:         'return=minimal',
}

async function sbInsert(table: string, row: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: SB_HEADERS,
    body:    JSON.stringify(row),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Supabase INSERT ${table} ${res.status}: ${body}`)
  }
}

async function sbPatch(table: string, id: string, row: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method:  'PATCH',
    headers: SB_HEADERS,
    body:    JSON.stringify(row),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Supabase PATCH ${table} ${res.status}: ${body}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n══════════════════════════════════════════════════════')
  console.log('  Kealee — Design Concept Delivery Test')
  console.log('══════════════════════════════════════════════════════')
  console.log(`  Project:  ${PROJECT_PATH}`)
  console.log(`  Portal:   ${PORTAL_URL}`)
  console.log()

  const intakeId = uuid()
  const testTag  = `test_${Date.now()}`

  const INTAKE_FORM = {
    clientName:       'Alex Johnson',
    contactEmail:     'alex.johnson@test.kealee.com',
    contactPhone:     '202-555-0101',
    projectAddress:   '1234 Capitol Hill St NW, Washington DC 20024',
    projectType:      PROJECT_PATH,
    budgetRange:      '50k_100k',
    stylePreferences: ['Modern', 'Contemporary'],
    goals:            ['Open concept layout', 'Improved natural lighting', 'High-end finishes'],
    knownConstraints: [],
    uploadedPhotos:   [],
    propertyUse:      'primary_residence',
    timelineGoal:     '3_6_months',
  }

  // ── Step 1: Seed intake in Supabase ────────────────────────────────────────

  process.stdout.write('[1/4] Seeding Supabase public_intake_leads... ')
  await sbInsert('public_intake_leads', {
    id:              intakeId,
    project_path:    PROJECT_PATH,
    client_name:     INTAKE_FORM.clientName,
    contact_email:   INTAKE_FORM.contactEmail,
    contact_phone:   INTAKE_FORM.contactPhone,
    project_address: INTAKE_FORM.projectAddress,
    budget_range:    INTAKE_FORM.budgetRange,
    source:          'test',
    status:          'paid',
    requires_payment: false,
    form_data: {
      ...INTAKE_FORM,
      _test:    true,
      _testTag: testTag,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  console.log(`OK (${intakeId})`)

  // ── Step 2: Generate floor plan (synchronous) ──────────────────────────────

  process.stdout.write('[2/4] Generating floor plan... ')

  const { generateFloorplan } = await import(
    path.join(ROOT, 'packages/concept-engine/src/api/generate-floorplan.ts')
  ) as typeof import('../packages/concept-engine/src/api/generate-floorplan')

  const fp = generateFloorplan({
    intakeId,
    projectPath:      PROJECT_PATH,
    clientName:       INTAKE_FORM.clientName,
    contactEmail:     INTAKE_FORM.contactEmail,
    contactPhone:     INTAKE_FORM.contactPhone,
    projectAddress:   INTAKE_FORM.projectAddress,
    budgetRange:      INTAKE_FORM.budgetRange,
    stylePreferences: INTAKE_FORM.stylePreferences,
    goals:            INTAKE_FORM.goals,
    knownConstraints: INTAKE_FORM.knownConstraints,
    uploadedPhotos:   INTAKE_FORM.uploadedPhotos,
    propertyUse:      INTAKE_FORM.propertyUse,
    timelineGoal:     INTAKE_FORM.timelineGoal,
  })

  console.log(`OK  (${fp.roomCount} rooms · ${fp.totalAreaFt2} sq ft · score ${fp.score.overallScore.toFixed(2)})`)

  // ── Step 3: Generate concept package via Claude ────────────────────────────

  console.log('[3/4] Generating concept package (Claude AI narrative)...')
  console.log('      Estimated: 30–90 seconds')

  const { generateConceptPackage } = await import(
    path.join(ROOT, 'packages/concept-engine/src/api/generate-concept-package.ts')
  ) as typeof import('../packages/concept-engine/src/api/generate-concept-package')

  const pkg = await generateConceptPackage({
    intakeId,
    floorplanId: fp.floorplanId,
    floorplan:   fp.floorplanJson,
    projectPath: PROJECT_PATH,
    intake: {
      intakeId,
      projectPath:      PROJECT_PATH as any,
      clientName:       INTAKE_FORM.clientName,
      contactEmail:     INTAKE_FORM.contactEmail,
      contactPhone:     INTAKE_FORM.contactPhone,
      projectAddress:   INTAKE_FORM.projectAddress,
      budgetRange:      INTAKE_FORM.budgetRange,
      stylePreferences: INTAKE_FORM.stylePreferences,
      goals:            INTAKE_FORM.goals,
      knownConstraints: INTAKE_FORM.knownConstraints,
      uploadedPhotos:   INTAKE_FORM.uploadedPhotos,
      propertyUse:      INTAKE_FORM.propertyUse,
      timelineGoal:     INTAKE_FORM.timelineGoal,
    },
  })

  console.log(`[3/4] OK (${pkg.conceptPackageId})`)

  // ── Step 4: Write conceptOutput back to Supabase ──────────────────────────

  process.stdout.write('[4/4] Writing concept output to Supabase... ')

  const conceptOutput = {
    conceptPackageId:   pkg.conceptPackageId,
    floorplanId:        fp.floorplanId,
    pdfUrl:             null,   // No PDF storage in local test
    renderUrls:         [],     // No Replicate renders in local test
    packageJson:        pkg.packageJson,
    generatedAt:        new Date().toISOString(),
    floorplanSvgInline: fp.svgString,
  }

  await sbPatch('public_intake_leads', intakeId, {
    status:     'concept_ready',
    form_data: {
      ...INTAKE_FORM,
      _test:        true,
      _testTag:     testTag,
      conceptOutput,
    },
    updated_at: new Date().toISOString(),
  })

  console.log('OK')

  // ── Result ────────────────────────────────────────────────────────────────

  const p = pkg.packageJson as any

  console.log('\n══════════════════════════════════════════════════════')
  console.log('  TEST COMPLETE')
  console.log('══════════════════════════════════════════════════════')
  console.log(`  Intake ID:   ${intakeId}`)
  console.log(`  Package ID:  ${pkg.conceptPackageId}`)
  if (p?.designConcept?.style)   console.log(`  Style:       ${p.designConcept.style}`)
  if (p?.estimatedCost)          console.log(`  Est. Cost:   $${Number(p.estimatedCost).toLocaleString()}`)
  if (p?.projectTimeline)        console.log(`  Timeline:    ${p.projectTimeline}`)
  console.log()
  console.log('  Portal delivery URL:')
  console.log(`  → ${PORTAL_URL}/deliverables/${intakeId}`)
  console.log()
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('\n[test-concept] FAILED:', msg)
  if (process.env.DEBUG && err instanceof Error) console.error(err.stack)
  process.exit(1)
})
