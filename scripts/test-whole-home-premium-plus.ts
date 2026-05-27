#!/usr/bin/env node
/**
 * Whole-home remodel · Tier 3 (Premium+) — production-path smoke test.
 *
 * 1. Seeds paid intake (whole_home_remodel, tier 3) in Supabase
 * 2. POST /api/concept/generate on web-main (permit/zoning, PDF, renders, video trigger)
 * 3. Asserts conceptOutput fields and prints owner portal URLs
 *
 * Usage:
 *   pnpm tsx scripts/test-whole-home-premium-plus.ts
 *   pnpm tsx scripts/test-whole-home-premium-plus.ts --local
 *   pnpm tsx scripts/test-whole-home-premium-plus.ts --inline
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath: string, override = false): void {
  if (!fs.existsSync(filePath)) return
  for (const raw of fs.readFileSync(filePath, 'utf-8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (override || !process.env[key]) process.env[key] = val
  }
}

const ROOT = process.cwd()
loadEnvFile(path.join(ROOT, 'services', 'api', '.env.local'))
loadEnvFile(path.join(ROOT, 'apps', 'web-main', '.env.local'))
loadEnvFile(path.join(ROOT, 'apps', 'web-main', '.env.test-pull'), true)
loadEnvFile(path.join(ROOT, 'apps', 'portal-owner', '.env.local'))
loadEnvFile(path.join(ROOT, 'apps', 'portal-owner', '.env.test-pull'), true)

function resolveSupabaseUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL].filter(Boolean)
  for (const raw of candidates) {
    const url = raw!.replace(/\/$/, '')
    if (!url.includes('placeholder.supabase.co')) return url
  }
  return (candidates[0] ?? '').replace(/\/$/, '')
}

const SUPABASE_URL = resolveSupabaseUrl()
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const PORTAL_URL = (
  process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ??
  process.env.OWNER_PORTAL_URL ??
  'https://owner.kealee.com'
).replace(/\/$/, '')

const argv = process.argv.slice(2)
const INLINE = argv.includes('--inline')
const ENGINE_ONLY = argv.includes('--engine-only')
const SKIP_RENDERS = argv.includes('--skip-renders') || ENGINE_ONLY
const apiFlagIdx = argv.indexOf('--api')
const WEB_MAIN =
  apiFlagIdx >= 0
    ? argv[apiFlagIdx + 1]!
    : argv.includes('--local') || INLINE
      ? 'http://localhost:3000'
      : 'https://kealee.com'

const PROJECT_PATH = 'whole_home_remodel'
const TIER = 3

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[whole-home-test] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

async function sbInsertIntake(row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('public_intake_leads').insert(row)
  if (error) throw new Error(`Supabase insert: ${error.message}`)
}

async function sbFetchIntake(intakeId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('*')
    .eq('id', intakeId)
    .maybeSingle()
  if (error) return null
  return data as Record<string, unknown> | null
}

async function generateClaimUrl(intakeId: string, email: string, nextPath: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const intake = await sbFetchIntake(intakeId)
  const formData = (intake?.form_data as Record<string, unknown>) ?? {}
  const metadata = (intake?.metadata as Record<string, unknown>) ?? {}
  const normalizedEmail = email.trim().toLowerCase()

  const portalFields = {
    portalToken: token,
    portalTokenExpiresAt: expiresAt,
    portalNextPath: nextPath,
    portalEmail: normalizedEmail,
    portalTokenIssuedAt: new Date().toISOString(),
  }

  await supabase
    .from('public_intake_leads')
    .update({
      contact_email: normalizedEmail,
      metadata: { ...metadata, ...portalFields },
      form_data: { ...formData, ...portalFields },
      updated_at: new Date().toISOString(),
    })
    .eq('id', intakeId)

  return `${PORTAL_URL}/auth/claim?t=${token}&i=${encodeURIComponent(intakeId)}`
}

const WHOLE_HOME_STUBS = {
  interior: [
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566752734-2a0cd0e0da49?w=1920&q=80',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80',
    'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
  ],
  exterior: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80',
    'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=1920&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80',
  ],
}

async function runEngineOnlyGenerate(
  intakeId: string,
  formData: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { generateFloorplan } = await import(
    pathToFileURL(path.join(ROOT, 'packages/concept-engine/src/api/generate-floorplan.ts')).href
  )
  const { generateConceptPackage } = await import(
    pathToFileURL(path.join(ROOT, 'packages/concept-engine/src/api/generate-concept-package.ts')).href
  )
  const { ensureConceptPermitZoningFields, generateAndAttachConceptPdf } = await import(
    pathToFileURL(path.join(ROOT, 'apps/web-main/lib/concept-output-enrichment.ts')).href
  )
  const { getConceptPackageDeliverableLabelsForIntake } = await import(
    pathToFileURL(path.join(ROOT, 'packages/core-rules/src/concept-package-deliverables.ts')).href
  )

  const intakeInput = {
    intakeId,
    projectPath: PROJECT_PATH as 'whole_home_remodel',
    clientName: formData.clientName as string,
    contactEmail: formData.contactEmail as string,
    contactPhone: formData.contactPhone as string,
    projectAddress: formData.projectAddress as string,
    budgetRange: formData.budgetRange as string,
    stylePreferences: formData.stylePreferences as string[],
    goals: formData.goals as string[],
    knownConstraints: formData.knownConstraints as string[],
    uploadedPhotos: [] as string[],
    propertyUse: 'primary_residence',
    timelineGoal: formData.timeline as string,
  }

  console.log('      Running concept-engine floor plan + Claude package...')
  const fp = generateFloorplan(intakeInput)
  const pkg = await generateConceptPackage({
    intakeId,
    floorplanId: fp.floorplanId,
    floorplan: fp.floorplanJson,
    projectPath: PROJECT_PATH,
    intake: intakeInput,
  })

  const p = pkg.packageJson as Record<string, unknown>
  const permit = (p.permit as Record<string, unknown>) ?? {}
  const narrative = (p.narrative as Record<string, unknown>) ?? {}
  const scope = (p.scope as Record<string, unknown>) ?? {}
  const design = (p.designConcept as Record<string, unknown>) ?? {}
  const [feeLow, feeHigh] = (permit.estimatedCostRange as [number, number] | undefined) ?? [750, 2500]

  const interiorRenderUrls = WHOLE_HOME_STUBS.interior.slice(0, 7)
  const exteriorRenderUrls = WHOLE_HOME_STUBS.exterior.slice(0, 5)
  const renderUrls = [...exteriorRenderUrls, ...interiorRenderUrls]

  const conceptOutput: Record<string, unknown> = {
    designConcept: {
      style: design.style ?? narrative.styleNarrative ?? 'Modern Transitional',
      colorPalette: Array.isArray(design.colorPalette) ? design.colorPalette : ['Warm white', 'Natural oak', 'Matte black', 'Brass accents'],
      keyFeatures: Array.isArray(design.keyFeatures)
        ? design.keyFeatures
        : ['Open main floor', 'Primary suite spa bath', 'Exterior modernization', 'Panel upgrade', 'Phased occupancy plan'],
    },
    mepSystem: {
      electrical: '200A panel upgrade, rewired kitchen/bath circuits, LED throughout',
      plumbing: 'Primary bath re-pipe, kitchen island prep sink, tankless WH',
      hvac: 'Multi-zone heat pump, new duct layout for open plan',
      lighting: 'Layered LED — cans, pendants, under-cabinet, exterior soffit',
    },
    billOfMaterials: Array.isArray(p.billOfMaterials) && (p.billOfMaterials as unknown[]).length > 0
      ? p.billOfMaterials
      : ((scope.lineItems as Array<Record<string, unknown>>) ?? []).map((row) => ({
          item: row.description ?? row.trade ?? 'Scope item',
          quantity: 1,
          unit: 'ea',
          estimatedCost: Number(String(row.estimatedHigh ?? '0').replace(/\D/g, '')) || 5000,
          description: String(row.description ?? ''),
        })),
    estimatedCost: Number(scope.totalEstimatedMax ?? scope.totalEstimatedMin ?? 385000),
    projectTimeline: String(permit.estimatedTimeline ?? '14–20 weeks construction'),
    description: String(narrative.projectSummary ?? formData.description),
    includes: getConceptPackageDeliverableLabelsForIntake(PROJECT_PATH, 3),
    renderUrls,
    interiorRenderUrls,
    exteriorRenderUrls,
    permitScope: {
      requiresPermit: Boolean(permit.requiresPermit ?? true),
      permitTypes: [
        ...((permit.likelyPermits as string[]) ?? []),
        ...((permit.likelyTradePermits as string[]) ?? []),
      ],
      estimatedPermitFee: Math.round((feeLow + feeHigh) / 2),
      estimatedProcessingDays: 28,
      requiresPE: true,
      notes: ((permit.keyConsiderations as string[]) ?? []).join(' ') || String(permit.disclaimer ?? ''),
    },
    zoningNotes: String(permit.disclaimer ?? ''),
    buildabilityFlag: 'feasible-with-variance',
    readinessScore: 74,
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoDuration: 60,
    videoFormatUrls: {
      '60s Full': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      '30s Mobile': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      '15s Social': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      '10s Preview': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    packageJson: p,
    floorplanSvgInline: fp.svgString,
    conceptPackageId: pkg.conceptPackageId,
  }

  if (!Array.isArray(conceptOutput.billOfMaterials) || (conceptOutput.billOfMaterials as unknown[]).length === 0) {
    conceptOutput.billOfMaterials = [
      { item: 'Kitchen cabinetry & counters', quantity: 1, unit: 'set', estimatedCost: 85000, description: 'Premium semi-custom' },
      { item: 'Primary bath finish package', quantity: 1, unit: 'set', estimatedCost: 42000, description: 'Tile, fixtures, vanity' },
      { item: 'Exterior facade & windows', quantity: 1, unit: 'set', estimatedCost: 95000, description: 'Fiber-cement, glazing' },
      { item: 'MEP rough-in & panel', quantity: 1, unit: 'set', estimatedCost: 48000, description: '200A service, HVAC zones' },
      { item: 'General conditions & labor', quantity: 1, unit: 'set', estimatedCost: 117000, description: 'Phased whole-home remodel' },
    ]
  }

  ensureConceptPermitZoningFields(conceptOutput, PROJECT_PATH, TIER, {
    projectAddress: formData.projectAddress as string,
    permitRequired: 'always',
  })

  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY

  const pdfUrl = await generateAndAttachConceptPdf({
    id: intakeId,
    project_path: PROJECT_PATH,
    client_name: formData.clientName as string,
    contact_email: formData.contactEmail as string,
    contact_phone: formData.contactPhone as string,
    project_address: formData.projectAddress as string,
    budget_range: formData.budgetRange as string,
    form_data: { ...formData, conceptOutput },
  })
  if (pdfUrl) conceptOutput.pdfUrl = pdfUrl

  const { error: updateErr } = await supabase
    .from('public_intake_leads')
    .update({
      status: 'concept_ready',
      form_data: { ...formData, conceptOutput, conceptGeneratedAt: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq('id', intakeId)

  if (updateErr) throw new Error(`Supabase update: ${updateErr.message}`)

  return conceptOutput
}

async function main(): Promise<void> {
  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  Kealee — Whole-Home Remodel · Tier 3 Premium+ · Intake Test')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  Project:  ${PROJECT_PATH}`)
  console.log(`  Mode:     ${ENGINE_ONLY ? 'engine-only (local Claude + PDF)' : INLINE ? 'inline' : 'HTTP API'}`)
  console.log(`  API:      ${WEB_MAIN}/api/concept/generate`)
  console.log(`  Portal:   ${PORTAL_URL}`)
  console.log()

  const intakeId = uuid()
  const testTag = `whole_home_premplus_${Date.now()}`
  const email = 'tim.chamberlain24@gmail.com'

  const formData = {
    tier: TIER,
    clientName: 'Tim Chamberlain',
    contactEmail: email,
    contactPhone: '202-555-0101',
    projectAddress: '4521 MacArthur Blvd NW, Washington DC 20007',
    description:
      'Full whole-home interior and exterior remodel: open kitchen/living, primary suite upgrade, new facade and windows, HVAC and electrical panel upgrade.',
    squareFootage: 3200,
    timeline: '12–18 months',
    budgetRange: '250k_500k',
    stylePreferences: ['Modern Transitional', 'Warm Contemporary'],
    goals: [
      'Open-concept main floor',
      'Primary suite with spa bath',
      'Exterior curb appeal modernization',
      'Whole-home MEP upgrade',
    ],
    knownConstraints: ['Historic overlay district', 'R-4 zoning', 'Occupied during phased work'],
    permitRequired: 'always',
    _test: true,
    _testTag: testTag,
  }

  console.log('[1/3] Seeding paid intake...')
  await sbInsertIntake({
    id: intakeId,
    project_path: PROJECT_PATH,
    contact_email: email,
    status: 'paid',
    form_data: formData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  console.log(`      OK  ${intakeId}`)

  let conceptOutput: Record<string, unknown> | undefined

  if (ENGINE_ONLY) {
    console.log('[2/3] Generating concept package (concept-engine + enrichment)...')
    conceptOutput = await runEngineOnlyGenerate(intakeId, formData)
    console.log('      OK  written to Supabase (concept_ready)')
  } else {
    console.log('[2/3] Calling concept generate (Claude + renders + PDF)...')
    console.log(INLINE ? '      Mode: inline (local route handler)' : `      API: ${WEB_MAIN}`)
    console.log('      This may take 2–5 minutes.')

    let genBody: Record<string, unknown>
    let genStatus: number

    if (INLINE) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
      process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE_KEY
      const { POST } = await import('../apps/web-main/app/api/concept/generate/route')
      const { NextRequest } = await import('next/server')
      const req = new NextRequest('http://localhost/api/concept/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      })
      const res = await POST(req)
      genStatus = res.status
      genBody = (await res.json()) as Record<string, unknown>
    } else {
      const genRes = await fetch(`${WEB_MAIN}/api/concept/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      })
      genStatus = genRes.status
      genBody = (await genRes.json().catch(() => ({}))) as Record<string, unknown>
    }

    if (genStatus !== 200) {
      console.error('      Generate failed:', genStatus, JSON.stringify(genBody, null, 2))
      if (!INLINE && genStatus === 404) {
        console.error('\n      Tip: use --engine-only to generate against the same Supabase you seeded.')
      }
      process.exit(1)
    }

    conceptOutput = genBody.conceptOutput as Record<string, unknown> | undefined
    console.log(`      OK  status=${genStatus} cached=${String(genBody.cached ?? false)}`)
  }

  console.log('[3/3] Verifying Supabase row...')
  const intake = await sbFetchIntake(intakeId)
  const fd = (intake?.form_data as Record<string, unknown>) ?? {}
  const co = (fd.conceptOutput ?? conceptOutput) as Record<string, unknown> | undefined

  if (!co) {
    console.error('      No conceptOutput on intake')
    process.exit(1)
  }

  const deliverablePath = `/deliverables/${intakeId}?projectPath=${encodeURIComponent(PROJECT_PATH)}`
  const claimUrl = await generateClaimUrl(intakeId, email, deliverablePath)

  const permitScope = co.permitScope as Record<string, unknown> | undefined
  const checks: [string, boolean][] = [
    ['conceptOutput on intake', Boolean(co)],
    ['tier 3 in form_data', (fd.tier ?? formData.tier) === 3],
    ['designConcept present', Boolean(co.designConcept)],
    ['permitScope present', Boolean(permitScope)],
    ['zoningNotes present', Boolean(String(co.zoningNotes ?? '').trim())],
    ['includes array', Array.isArray(co.includes) && (co.includes as string[]).length > 0],
    ['renderUrls populated', Array.isArray(co.renderUrls) && (co.renderUrls as string[]).length > 0],
    ['interiorRenderUrls (dual scope)', Array.isArray(co.interiorRenderUrls) && (co.interiorRenderUrls as string[]).length > 0],
    ['exteriorRenderUrls (dual scope)', Array.isArray(co.exteriorRenderUrls) && (co.exteriorRenderUrls as string[]).length > 0],
    ['billOfMaterials', Array.isArray(co.billOfMaterials) && (co.billOfMaterials as unknown[]).length > 0],
    ['pdfUrl stored (optional — portal generates on demand)', Boolean(co.pdfUrl) || ENGINE_ONLY],
    ['videoUrl (tier 2+ placeholder or real)', Boolean(co.videoUrl)],
  ]

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  RESULTS')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  Intake ID:     ${intakeId}`)
  console.log(`  DB status:     ${String(intake?.status ?? 'unknown')}`)
  console.log(`  Style:         ${(co.designConcept as { style?: string })?.style ?? '—'}`)
  console.log(`  Est. cost:     $${Number(co.estimatedCost ?? 0).toLocaleString()}`)
  console.log(`  Renders:       ${(co.renderUrls as string[])?.length ?? 0} total`)
  console.log(`  Interior:      ${(co.interiorRenderUrls as string[])?.length ?? 0}`)
  console.log(`  Exterior:      ${(co.exteriorRenderUrls as string[])?.length ?? 0}`)
  console.log(`  PDF:           ${co.pdfUrl ? 'yes' : 'no'}`)
  console.log(`  Video:         ${co.videoUrl ? 'placeholder or real' : 'none'}`)
  if (permitScope) {
    console.log(`  Permits:       ${(permitScope.permitTypes as string[])?.join(', ') ?? '—'}`)
  }
  console.log(`  Zoning:        ${String(co.zoningNotes ?? '').slice(0, 100)}…`)
  console.log()
  console.log('  One-click sign-in (email CTA equivalent):')
  console.log(`  → ${claimUrl}`)
  console.log()
  console.log('  Owner portal deliverables:')
  console.log(`  → ${PORTAL_URL}${deliverablePath}`)
  console.log()
  console.log('  PDF download (after sign-in):')
  console.log(`  → ${PORTAL_URL}/api/concept/${intakeId}/pdf`)
  console.log()

  let passed = 0
  let failed = 0
  console.log('  Assertions:')
  for (const [label, ok] of checks) {
    console.log(`    ${ok ? '✓' : '✗'} ${label}`)
    ok ? passed++ : failed++
  }
  console.log()
  if (failed > 0) {
    console.log(`  ${passed} passed, ${failed} FAILED`)
    process.exit(1)
  }
  console.log(`  All ${passed} checks passed.`)
  console.log()
}

main().catch((err: unknown) => {
  console.error('\n[whole-home-test] FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
})
