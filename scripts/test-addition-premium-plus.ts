#!/usr/bin/env node
/**
 * scripts/test-addition-premium-plus.ts
 *
 * Smoke test — addition_expansion at Tier 3 (Premium+).
 *
 * Deliverables exercised:
 *   • 12 Flux 1.1 Pro Ultra renders split as:
 *       6 EXTERIOR — rear elevation, side yard, aerial footprint, street view,
 *                    connection detail, twilight facade
 *       6 INTERIOR — open-plan addition, connection to existing home, structural
 *                    detail, clerestory light, bedroom/suite, wet bar / flex space
 *   • AI transformation video (Sora 2 Pro → Veo 3.1 → Kling 2.5 fallback)
 *   • Claude AI narrative: addition-specific fields —
 *       structuralConsiderations, mepForAddition, permitScope, zoningNotes,
 *       billOfMaterials, designConcept
 *   • Floor plan SVG with addition footprint
 *   • Supabase: status → concept_ready, conceptOutput, conceptVideo written
 *   • Photo zones metadata (rear_yard, side_yard, exterior_walls,
 *     neighborhood_context) included in form_data
 *
 * Usage:
 *   pnpm tsx scripts/test-addition-premium-plus.ts
 *   pnpm tsx scripts/test-addition-premium-plus.ts --no-video
 *   pnpm tsx scripts/test-addition-premium-plus.ts --skip-renders
 *
 * Flags:
 *   --no-video      Skip video step even if a provider key is present
 *   --skip-renders  Use placeholder images (skip Replicate calls entirely)
 *
 * Keys loaded from:
 *   services/api/.env             → ANTHROPIC_API_KEY, SUPABASE_*
 *   services/api/.env.local       → overrides
 *   apps/web-main/.env.local      → REPLICATE_API_TOKEN, OPENAI_API_KEY, GEMINI_API_KEY
 *   apps/portal-owner/.env.local  → OWNER_PORTAL_URL
 */

import * as fs   from 'node:fs'
import * as path from 'node:path'

// ── Env loading ──────────────────────────────────────────────────────────────

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

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL     = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PORTAL_URL       = (process.env.OWNER_PORTAL_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const PROJECT_PATH = 'addition_expansion'
const TIER         = 3

const argv        = process.argv.slice(2)
const SKIP_VIDEO   = argv.includes('--no-video')
const SKIP_RENDERS = argv.includes('--skip-renders')

const HAS_REPLICATE = !SKIP_RENDERS && Boolean(process.env.REPLICATE_API_TOKEN)
const HAS_OPENAI    = Boolean(process.env.OPENAI_API_KEY)
const HAS_GEMINI    = Boolean(process.env.GEMINI_API_KEY)
const HAS_VIDEO     = !SKIP_VIDEO && (HAS_OPENAI || HAS_GEMINI || HAS_REPLICATE)

// Tier 3: 12 renders split evenly — 6 exterior, 6 interior
const EXTERIOR_COUNT = 6
const INTERIOR_COUNT = 6
const TOTAL_RENDERS  = EXTERIOR_COUNT + INTERIOR_COUNT   // 12

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[addition-test] Missing Supabase credentials. Check services/api/.env.local')
  process.exit(1)
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[addition-test] Missing ANTHROPIC_API_KEY. Check services/api/.env')
  process.exit(1)
}

// ── Placeholder images (Unsplash) ─────────────────────────────────────────────
// Used when REPLICATE_API_TOKEN is not set or --skip-renders is passed.
// Exterior: real house additions / rear elevations
// Interior: spacious addition interior photography

const PLACEHOLDER_EXTERIOR = [
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=90', // rear elevation
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=90', // side view
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=90', // street view
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1920&q=90', // modern exterior
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=90', // twilight facade
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1920&q=90', // connection detail
]

const PLACEHOLDER_INTERIOR = [
  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=90', // open-plan addition
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=90',   // connection to existing
  'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1920&q=90', // structural detail
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=90', // clerestory light
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1920&q=90', // bedroom suite
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1920&q=90', // flex / wet bar
]

// ── Supabase helpers ──────────────────────────────────────────────────────────

const SB_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  apikey:         SERVICE_ROLE_KEY,
  Authorization:  `Bearer ${SERVICE_ROLE_KEY}`,
  Prefer:         'return=minimal',
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

async function sbInsert(table: string, row: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: SB_HEADERS, body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`Supabase INSERT ${table} ${res.status}: ${await res.text().catch(() => '')}`)
}

async function sbPatch(table: string, id: string, row: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: SB_HEADERS, body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`Supabase PATCH ${table} ${res.status}: ${await res.text().catch(() => '')}`)
}

// ── Replicate polling ─────────────────────────────────────────────────────────

async function pollReplicate(
  predictionId: string,
  label: string,
  timeoutMs = 180_000,
): Promise<string | null> {
  const start = Date.now()
  const hdrs  = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }

  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 4_000))
    const res  = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, { headers: hdrs })
    const data = await res.json() as any
    const s    = data?.status as string
    process.stdout.write('.')
    if (s === 'succeeded') {
      const out = data?.output
      const url = Array.isArray(out) ? out[0] : out
      return typeof url === 'string' ? url : null
    }
    if (s === 'failed' || s === 'canceled') {
      console.warn(`\n  ⚠ ${label} ${s}: ${data?.error ?? '(no error)'}`)
      return null
    }
  }
  console.warn(`\n  ⚠ ${label} timed out after ${timeoutMs / 1000}s`)
  return null
}

// ── Render batches ────────────────────────────────────────────────────────────

interface RenderBatch {
  label:   string
  prompts: string[]
}

function buildRenderBatches(style: string): [RenderBatch, RenderBatch] {
  const exterior: RenderBatch = {
    label: 'Exterior (6)',
    prompts: [
      `photorealistic architectural photography, 8K, rear elevation of ${style} home addition, full rear yard perspective, professional architectural visualization, clear blue sky, golden hour lighting, lush landscaping`,
      `photorealistic exterior, 8K, side yard view of new ${style} addition, showing connection to existing home, natural materials, professional real-estate photography, midday lighting`,
      `photorealistic aerial angled view, 8K, footprint of new addition on existing property, ${style} architecture, roofline connection detail, drone perspective, sharp detail`,
      `photorealistic street view, 8K, ${style} home with new rear addition visible, neighborhood context, curb appeal, professional architectural photography, soft morning light`,
      `photorealistic twilight exterior, 8K, ${style} addition facade at dusk, warm interior light glowing through new windows, blue-hour sky, long exposure look, premium real estate photography`,
      `photorealistic close-up exterior detail, 8K, where new ${style} addition meets existing home, transition materials, window placement, clean joint detail, architectural photography`,
    ],
  }
  const interior: RenderBatch = {
    label: 'Interior (6)',
    prompts: [
      `photorealistic interior design, 8K, open-plan great room in new ${style} addition, vaulted ceiling, large windows flooding space with natural light, professional architectural visualization`,
      `photorealistic interior, 8K, threshold view from existing home into new ${style} addition, seamless connection, wide angle, warm natural light, high-end finishes`,
      `photorealistic interior detail, 8K, exposed structural element in ${style} addition — steel beam or timber ridge, architectural feature, premium finishes, dramatic ceiling`,
      `photorealistic interior, 8K, clerestory windows in ${style} addition, light washing down wall, morning sun, minimalist furniture, magazine-quality interior photography`,
      `photorealistic bedroom suite in new ${style} addition, 8K, private retreat, ensuite bath connection, walk-in closet entry, soft ambient lighting, luxury residential photography`,
      `photorealistic flex space in ${style} addition, 8K, wet bar or home office alcove, built-in cabinetry, functional and elegant, wide angle, professional interior photography`,
    ],
  }
  return [exterior, interior]
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const videoProvider = HAS_OPENAI ? 'sora-2-pro' : HAS_GEMINI ? 'veo-3.1' : HAS_REPLICATE ? 'kling-2.5' : null

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  Kealee — Addition / Expansion  ·  Tier 3 Premium+  Smoke Test')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  Project:  ${PROJECT_PATH}  (Tier ${TIER} — Premium+)`)
  console.log(`  Portal:   ${PORTAL_URL}`)
  console.log()
  console.log(`  Renders:  ${HAS_REPLICATE
    ? `✓ REPLICATE_API_TOKEN — Flux 1.1 Pro Ultra (${EXTERIOR_COUNT} exterior + ${INTERIOR_COUNT} interior)`
    : `⚠ REPLICATE_API_TOKEN missing — using ${TOTAL_RENDERS} placeholder images`}`)
  console.log(`  Video:    ${videoProvider
    ? `✓ ${videoProvider === 'sora-2-pro' ? 'OPENAI_API_KEY → Sora 2 Pro' : videoProvider === 'veo-3.1' ? 'GEMINI_API_KEY → Veo 3.1' : 'REPLICATE_API_TOKEN → Kling 2.5'}`
    : SKIP_VIDEO ? '⚠ --no-video flag set — skipping'
    : '⚠ No video provider key — skipping'}`)
  console.log()

  const intakeId = uuid()
  const testTag  = `addition_premplus_${Date.now()}`

  const INTAKE_FORM = {
    clientName:       'Tim Chamberlain',
    contactEmail:     'tim.chamberlain24@gmail.com',
    contactPhone:     '202-555-0101',
    projectAddress:   '1234 Capitol Hill St NW, Washington DC 20024',
    projectType:      PROJECT_PATH,
    budgetRange:      '250k_500k',
    stylePreferences: ['Modern', 'Contemporary', 'Transitional'],
    goals: [
      'Add 600–800 sq ft rear addition',
      'Open-plan great room connecting to kitchen',
      'Primary suite with ensuite bath on new second floor',
      'Clerestory windows for natural light',
      'Seamless connection to existing home aesthetic',
    ],
    knownConstraints: ['Rear setback 15 ft', 'HOA approval required', 'Load-bearing rear wall'],
    uploadedPhotos:   [],
    propertyUse:      'primary_residence',
    timelineGoal:     '12_18_months',
    tier:             TIER,
    // Photo zones (addition_expansion required fields)
    photoZones: {
      rear_yard:            { captured: false, notes: 'Smoke test — no photos uploaded' },
      side_yard:            { captured: false, notes: 'Smoke test — no photos uploaded' },
      exterior_walls:       { captured: false, notes: 'Smoke test — no photos uploaded' },
      neighborhood_context: { captured: false, notes: 'Smoke test — no photos uploaded' },
    },
  }

  // ── Step 1: Seed intake ───────────────────────────────────────────────────

  process.stdout.write('[1/7] Seeding public_intake_leads... ')
  await sbInsert('public_intake_leads', {
    id:               intakeId,
    project_path:     PROJECT_PATH,
    client_name:      INTAKE_FORM.clientName,
    contact_email:    INTAKE_FORM.contactEmail,
    contact_phone:    INTAKE_FORM.contactPhone,
    project_address:  INTAKE_FORM.projectAddress,
    budget_range:     INTAKE_FORM.budgetRange,
    source:           'addition_premium_plus_test',
    status:           'paid',
    requires_payment: false,
    form_data: { ...INTAKE_FORM, _test: true, _testTag: testTag },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  console.log(`OK (${intakeId})`)

  // ── Step 2: Floor plan ────────────────────────────────────────────────────

  process.stdout.write('[2/7] Generating addition floor plan... ')
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

  // ── Step 3: Claude AI narrative ───────────────────────────────────────────

  console.log('[3/7] Generating addition concept package (Claude AI)...')
  console.log('      Estimated: 45–90 s')

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

  const p        = pkg.packageJson as any
  const style    = (p?.designConcept?.style as string) ?? 'contemporary'
  const [extBatch, intBatch] = buildRenderBatches(style)

  console.log(`[3/7] OK (${pkg.conceptPackageId})`)
  if (p?.designConcept?.style)          console.log(`      Style:     ${p.designConcept.style}`)
  if (p?.estimatedCost)                 console.log(`      Est cost:  $${Number(p.estimatedCost).toLocaleString()}`)
  if (p?.structuralConsiderations)      console.log(`      Structural: ${String(p.structuralConsiderations).slice(0, 80)}…`)
  if (p?.permitScope)                   console.log(`      Permits:   ${String(p.permitScope).slice(0, 80)}…`)

  // ── Step 4: Exterior renders (Flux 1.1 Pro Ultra) ─────────────────────────

  let exteriorRenderUrls: string[] = []

  if (HAS_REPLICATE) {
    console.log(`[4/7] Submitting ${EXTERIOR_COUNT} exterior renders (Flux 1.1 Pro Ultra)...`)
    const Replicate = (await import('replicate')).default
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const extPredIds: string[] = []
    for (let i = 0; i < EXTERIOR_COUNT; i++) {
      if (i > 0) {
        process.stdout.write('  Waiting 12s (rate limit)...\n')
        await new Promise(r => setTimeout(r, 12_000))
      }
      let pred: any
      let attempts = 0
      while (attempts < 5) {
        try {
          pred = await replicate.predictions.create({
            model: 'black-forest-labs/flux-1.1-pro-ultra',
            input: {
              prompt:           extBatch.prompts[i],
              aspect_ratio:     '16:9',
              output_format:    'jpg',
              output_quality:   95,
              safety_tolerance: 2,
              raw:              false,
            },
          })
          break
        } catch (err: any) {
          if (err?.message?.includes('429') || err?.message?.includes('throttled')) {
            const wait = 15_000 * (attempts + 1)
            process.stdout.write(`  Rate limited — waiting ${wait / 1000}s...\n`)
            await new Promise(r => setTimeout(r, wait))
            attempts++
          } else { throw err }
        }
      }
      if (!pred) throw new Error(`Failed to submit exterior render ${i + 1} after retries`)
      extPredIds.push(pred.id)
      process.stdout.write(`  Submitted ext-${i + 1}/${EXTERIOR_COUNT} (${pred.id})\n`)
    }

    process.stdout.write(`  Polling ${EXTERIOR_COUNT} exterior renders: `)
    const extResults: (string | null)[] = []
    for (const [i, id] of extPredIds.entries()) {
      extResults.push(await pollReplicate(id, `ext-${i + 1}`))
    }
    console.log()
    exteriorRenderUrls = extResults.filter((u): u is string => typeof u === 'string')
    console.log(`[4/7] OK — ${exteriorRenderUrls.length}/${EXTERIOR_COUNT} exterior renders`)
  } else {
    console.log(`[4/7] SKIP renders — using ${EXTERIOR_COUNT} placeholder exterior images`)
    exteriorRenderUrls = PLACEHOLDER_EXTERIOR
  }

  // ── Step 5: Interior renders (Flux 1.1 Pro Ultra) ─────────────────────────

  let interiorRenderUrls: string[] = []

  if (HAS_REPLICATE) {
    console.log(`[5/7] Submitting ${INTERIOR_COUNT} interior renders (Flux 1.1 Pro Ultra)...`)
    const Replicate = (await import('replicate')).default
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const intPredIds: string[] = []
    for (let i = 0; i < INTERIOR_COUNT; i++) {
      if (i > 0) {
        process.stdout.write('  Waiting 12s (rate limit)...\n')
        await new Promise(r => setTimeout(r, 12_000))
      }
      let pred: any
      let attempts = 0
      while (attempts < 5) {
        try {
          pred = await replicate.predictions.create({
            model: 'black-forest-labs/flux-1.1-pro-ultra',
            input: {
              prompt:           intBatch.prompts[i],
              aspect_ratio:     '16:9',
              output_format:    'jpg',
              output_quality:   95,
              safety_tolerance: 2,
              raw:              false,
            },
          })
          break
        } catch (err: any) {
          if (err?.message?.includes('429') || err?.message?.includes('throttled')) {
            const wait = 15_000 * (attempts + 1)
            process.stdout.write(`  Rate limited — waiting ${wait / 1000}s...\n`)
            await new Promise(r => setTimeout(r, wait))
            attempts++
          } else { throw err }
        }
      }
      if (!pred) throw new Error(`Failed to submit interior render ${i + 1} after retries`)
      intPredIds.push(pred.id)
      process.stdout.write(`  Submitted int-${i + 1}/${INTERIOR_COUNT} (${pred.id})\n`)
    }

    process.stdout.write(`  Polling ${INTERIOR_COUNT} interior renders: `)
    const intResults: (string | null)[] = []
    for (const [i, id] of intPredIds.entries()) {
      intResults.push(await pollReplicate(id, `int-${i + 1}`))
    }
    console.log()
    interiorRenderUrls = intResults.filter((u): u is string => typeof u === 'string')
    console.log(`[5/7] OK — ${interiorRenderUrls.length}/${INTERIOR_COUNT} interior renders`)
  } else {
    console.log(`[5/7] SKIP renders — using ${INTERIOR_COUNT} placeholder interior images`)
    interiorRenderUrls = PLACEHOLDER_INTERIOR
  }

  // Combined render list (exterior first, then interior) for backwards compat
  const renderUrls = [...exteriorRenderUrls, ...interiorRenderUrls]

  // ── Step 6: AI transformation video ──────────────────────────────────────

  let videoState: Record<string, unknown> | null = null

  if (HAS_VIDEO && videoProvider) {
    const videoPrompt = [
      `Cinematic architectural reveal of a ${style} home addition,`,
      `drone pull-back from rear yard slowly revealing the new addition roofline,`,
      `then interior push through open-plan great room with floor-to-ceiling windows,`,
      `natural daylight, photorealistic, professional real-estate videography, 24mm wide lens`,
    ].join(' ')

    console.log(`[6/7] Submitting AI transformation video via ${videoProvider}...`)

    if (videoProvider === 'kling-2.5') {
      const Replicate = (await import('replicate')).default
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

      const videoPred = await replicate.predictions.create({
        model: 'kwaivgi/kling-v2.5-turbo-pro',
        input: {
          prompt:       videoPrompt,
          duration:     5,
          aspect_ratio: '16:9',
          // seed with the first exterior render if available
          ...(exteriorRenderUrls[0] ? { image: exteriorRenderUrls[0] } : {}),
        },
      })

      console.log(`  Polling Kling video (${videoPred.id}) — up to 10 min...`)
      process.stdout.write('  Progress: ')
      const videoUrl = await pollReplicate(videoPred.id, 'video', 600_000)
      console.log()

      if (videoUrl) {
        videoState = {
          status: 'completed', provider: videoProvider, jobId: videoPred.id,
          outputUrl: videoUrl, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        }
        console.log(`[6/7] OK — video: ${videoUrl}`)
      } else {
        videoState = { status: 'processing', provider: videoProvider, jobId: videoPred.id, startedAt: new Date().toISOString() }
        console.log('[6/7] Video submitted — polling timed out. Check Replicate dashboard.')
      }
    } else {
      // Sora / Veo — must be triggered via the running Next.js server
      console.log(`  ${videoProvider === 'sora-2-pro' ? 'Sora 2 Pro' : 'Veo 3.1'}: trigger via POST /api/concept/video after seeding.`)
      console.log('  Run:')
      console.log(`    curl -s -X POST http://localhost:3000/api/concept/video \\`)
      console.log(`         -H "Content-Type: application/json" -d '{"intakeId":"${intakeId}"}'`)
      videoState = null
    }
  } else {
    const skipReason = SKIP_VIDEO ? '--no-video flag' : 'no video provider key'
    console.log(`[6/7] SKIP video — ${skipReason}.`)
    if (!SKIP_VIDEO) {
      console.log('  Add to apps/web-main/.env.local:')
      console.log('    REPLICATE_API_TOKEN=r8_...   (Kling 2.5)')
      console.log('    OPENAI_API_KEY=sk-...         (Sora 2 Pro — tier 3 default)')
      console.log('    GEMINI_API_KEY=AIza...        (Veo 3.1)')
    }
  }

  // ── Step 7: Write to Supabase ─────────────────────────────────────────────

  process.stdout.write('[7/7] Writing conceptOutput + status → concept_ready... ')

  const conceptOutput = {
    conceptPackageId:   pkg.conceptPackageId,
    floorplanId:        fp.floorplanId,
    pdfUrl:             null,
    // Combined for backwards-compat display (renderUrls drives main gallery)
    renderUrls,
    // Separated for dual-gallery display in portal deliverables page
    exteriorRenderUrls,
    interiorRenderUrls,
    packageJson:        pkg.packageJson,
    generatedAt:        new Date().toISOString(),
    floorplanSvgInline: fp.svgString,
    tier:               TIER,
    // Addition-specific metadata
    additionType:       'rear_and_vertical',
    sqftEstimate:       700,
    structuralNotes:    (p?.structuralConsiderations as string | undefined) ?? null,
  }

  const formDataUpdate: Record<string, unknown> = {
    ...INTAKE_FORM,
    _test:        true,
    _testTag:     testTag,
    conceptOutput,
  }
  if (videoState) formDataUpdate.conceptVideo = videoState

  await sbPatch('public_intake_leads', intakeId, {
    status:     'concept_ready',
    form_data:  formDataUpdate,
    updated_at: new Date().toISOString(),
  })
  console.log('OK')

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  SMOKE TEST COMPLETE')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  Intake ID:        ${intakeId}`)
  console.log(`  Package ID:       ${pkg.conceptPackageId}`)
  console.log(`  Project:          addition_expansion  ·  Tier 3 Premium+`)
  console.log(`  Exterior renders: ${exteriorRenderUrls.length}/${EXTERIOR_COUNT}${HAS_REPLICATE ? '' : ' (placeholder)'}`)
  console.log(`  Interior renders: ${interiorRenderUrls.length}/${INTERIOR_COUNT}${HAS_REPLICATE ? '' : ' (placeholder)'}`)
  if (videoState) {
    const vs = videoState as any
    console.log(`  Video:            ${vs.status} · ${vs.provider}${vs.outputUrl ? ` → ${vs.outputUrl}` : ''}`)
  } else {
    console.log(`  Video:            skipped`)
  }
  if (p?.designConcept?.style)   console.log(`  Design style:     ${p.designConcept.style}`)
  if (p?.estimatedCost)          console.log(`  Est. cost:        $${Number(p.estimatedCost).toLocaleString()}`)
  if (p?.projectTimeline)        console.log(`  Timeline:         ${p.projectTimeline}`)
  console.log()
  console.log('  Deliverable portal URL:')
  console.log(`  → ${PORTAL_URL}/deliverables/${intakeId}`)
  console.log()

  // Assertions
  const checks: [string, boolean][] = [
    ['Floor plan generated',         fp.roomCount > 0],
    ['Concept package ID present',   Boolean(pkg.conceptPackageId)],
    ['packageJson returned',         Boolean(p)],
    ['designConcept field present',  Boolean(p?.designConcept)],
    ['permitScope field present',    Boolean(p?.permitScope ?? p?.zoningNotes)],
    ['billOfMaterials present',      Array.isArray(p?.billOfMaterials) && p.billOfMaterials.length > 0],
    ['exteriorRenderUrls populated', exteriorRenderUrls.length === EXTERIOR_COUNT],
    ['interiorRenderUrls populated', interiorRenderUrls.length === INTERIOR_COUNT],
    ['renderUrls combined (12)',     renderUrls.length === TOTAL_RENDERS],
  ]

  let passed = 0
  let failed = 0
  console.log('  Assertions:')
  for (const [label, ok] of checks) {
    console.log(`    ${ok ? '✓' : '✗'} ${label}`)
    ok ? passed++ : failed++
  }
  console.log()
  if (failed === 0) {
    console.log(`  All ${passed} checks passed.`)
  } else {
    console.log(`  ${passed} passed, ${failed} FAILED.`)
    process.exit(1)
  }
  console.log()
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('\n[addition-test] FAILED:', msg)
  if (process.env.DEBUG && err instanceof Error) console.error(err.stack)
  process.exit(1)
})
