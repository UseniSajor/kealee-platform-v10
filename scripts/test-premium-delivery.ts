#!/usr/bin/env node
/**
 * scripts/test-premium-delivery.ts
 *
 * End-to-end test for a Tier 2 (Premium) or Tier 3 (Premium+) concept
 * package — includes photorealistic Flux renders and an AI transformation
 * video (Kling 2.5 via Replicate, or Sora/Veo if those keys are set).
 *
 * Steps:
 *  1. Seed a paid intake (tier 2 by default)
 *  2. Generate floor plan + Claude AI narrative
 *  3. Submit Flux 1.1 Pro Ultra render jobs (REPLICATE_API_TOKEN required)
 *  4. Poll renders to completion
 *  5. Submit AI transformation video job (any video provider key required)
 *  6. Poll video to completion
 *  7. Write full conceptOutput + conceptVideo back to Supabase
 *  8. Print portal delivery URL
 *
 * Usage:
 *   pnpm tsx scripts/test-premium-delivery.ts
 *   pnpm tsx scripts/test-premium-delivery.ts --project kitchen_remodel --tier 3
 *   pnpm tsx scripts/test-premium-delivery.ts --project garden_concept --tier 2
 *
 * Keys loaded from:
 *   services/api/.env             → ANTHROPIC_API_KEY, SUPABASE_*
 *   services/api/.env.local       → overrides
 *   apps/web-main/.env.local      → REPLICATE_API_TOKEN, OPENAI_API_KEY, GEMINI_API_KEY
 *   apps/portal-owner/.env.local  → OWNER_PORTAL_URL
 */

import * as fs   from 'node:fs'
import * as path from 'node:path'

// ── Env loading ─────────────────────────────────────────────────────────────

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

// ── Config / CLI args ───────────────────────────────────────────────────────

const SUPABASE_URL     = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '')
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PORTAL_URL       = (process.env.OWNER_PORTAL_URL ?? 'http://localhost:3000').replace(/\/$/, '')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[premium-test] Missing Supabase credentials.')
  process.exit(1)
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[premium-test] Missing ANTHROPIC_API_KEY.')
  process.exit(1)
}

const argv     = process.argv.slice(2)
const projIdx  = argv.indexOf('--project')
const tierIdx  = argv.indexOf('--tier')

const PROJECT_PATH = projIdx >= 0 ? (argv[projIdx + 1] ?? 'kitchen_remodel') : 'kitchen_remodel'
const TIER         = tierIdx >= 0  ? Number(argv[tierIdx + 1] ?? 2) : 2
const IMAGE_COUNT  = TIER === 3 ? 12 : TIER === 2 ? 6 : 3

const HAS_REPLICATE = Boolean(process.env.REPLICATE_API_TOKEN)
const HAS_OPENAI    = Boolean(process.env.OPENAI_API_KEY)
const HAS_GEMINI    = Boolean(process.env.GEMINI_API_KEY)
const HAS_VIDEO     = HAS_REPLICATE || HAS_OPENAI || HAS_GEMINI

// Placeholder render URLs used when REPLICATE_API_TOKEN is not configured.
// These are Unsplash architectural photos so the portal delivery UI is testable.
const PLACEHOLDER_RENDERS = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=90', // kitchen
  'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=1920&q=90', // living room
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1920&q=90', // interior
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1920&q=90', // kitchen 2
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=90', // exterior
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1920&q=90', // bedroom
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1920&q=90', // bathroom
  'https://images.unsplash.com/photo-1510596664823-5b40b3cc4da6?w=1920&q=90', // dining
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1920&q=90', // exterior 2
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=90', // house
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=1920&q=90', // living 2
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=90', // kitchen 3
].slice(0, IMAGE_COUNT)

// ── Supabase helpers ────────────────────────────────────────────────────────

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

// ── Replicate polling helper ─────────────────────────────────────────────────

async function pollReplicate(
  predictionId: string,
  label: string,
  timeoutMs = 180_000,
): Promise<string | null> {
  const start = Date.now()
  const base  = 'https://api.replicate.com/v1/predictions/'
  const hdrs  = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }

  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 4000))
    const res  = await fetch(`${base}${predictionId}`, { headers: hdrs })
    const data = await res.json() as any
    const s    = data?.status as string

    process.stdout.write('.')

    if (s === 'succeeded') {
      const out = data?.output
      // Flux returns array of URLs; Kling returns single URL
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

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const tierLabel = TIER === 3 ? 'Premium+' : TIER === 2 ? 'Premium' : 'Essential'

  console.log('\n══════════════════════════════════════════════════════')
  console.log('  Kealee — Premium Concept Delivery Test')
  console.log('══════════════════════════════════════════════════════')
  console.log(`  Project:  ${PROJECT_PATH}`)
  console.log(`  Tier:     ${TIER} (${tierLabel})  ·  ${IMAGE_COUNT} renders`)
  console.log(`  Portal:   ${PORTAL_URL}`)
  console.log()
  console.log(`  Renders:  ${HAS_REPLICATE ? '✓ REPLICATE_API_TOKEN set — Flux 1.1 Pro Ultra' : '⚠ REPLICATE_API_TOKEN missing — placeholder images'}`)
  console.log(`  Video:    ${HAS_OPENAI ? '✓ OPENAI_API_KEY → Sora 2 Pro' : HAS_GEMINI ? '✓ GEMINI_API_KEY → Veo 3.1' : HAS_REPLICATE ? '✓ REPLICATE_API_TOKEN → Kling 2.5' : '⚠ No video provider key — video skipped'}`)
  if (TIER === 1) console.log('  ⚠ Tier 1 (Essential) has no video deliverable — use --tier 2 or --tier 3')
  console.log()

  const intakeId = uuid()
  const testTag  = `premium_test_${Date.now()}`

  const INTAKE_FORM = {
    clientName:       'Tim Chamberlain',
    contactEmail:     'tim.chamberlain24@gmail.com',
    contactPhone:     '202-555-0101',
    projectAddress:   '1234 Capitol Hill St NW, Washington DC 20024',
    projectType:      PROJECT_PATH,
    budgetRange:      '100k_250k',
    stylePreferences: ['Modern', 'Contemporary'],
    goals:            ['Open concept layout', 'Improved natural lighting', 'High-end finishes', 'Smart home integration'],
    knownConstraints: [],
    uploadedPhotos:   [],
    propertyUse:      'primary_residence',
    timelineGoal:     '6_12_months',
    tier:             TIER,
  }

  // ── 1: Seed intake ─────────────────────────────────────────────────────────

  process.stdout.write('[1/6] Seeding intake in Supabase... ')
  await sbInsert('public_intake_leads', {
    id:              intakeId,
    project_path:    PROJECT_PATH,
    client_name:     INTAKE_FORM.clientName,
    contact_email:   INTAKE_FORM.contactEmail,
    contact_phone:   INTAKE_FORM.contactPhone,
    project_address: INTAKE_FORM.projectAddress,
    budget_range:    INTAKE_FORM.budgetRange,
    source:          'premium_test',
    status:          'paid',
    requires_payment: false,
    form_data: { ...INTAKE_FORM, _test: true, _testTag: testTag },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  console.log(`OK (${intakeId})`)

  // ── 2: Floor plan ──────────────────────────────────────────────────────────

  process.stdout.write('[2/6] Generating floor plan... ')
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

  // ── 3: AI narrative (Claude) ────────────────────────────────────────────────

  console.log('[3/6] Generating concept package (Claude AI narrative)...')
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
  console.log(`[3/6] OK (${pkg.conceptPackageId})`)

  const p          = pkg.packageJson as any
  const style      = (p?.designConcept?.style as string) ?? 'modern'
  const roomType   = PROJECT_PATH.includes('kitchen')  ? 'kitchen'
                   : PROJECT_PATH.includes('bath')     ? 'bathroom'
                   : PROJECT_PATH.includes('garden')   ? 'garden'
                   : PROJECT_PATH.includes('exterior') ? 'exterior'
                   : 'interior'

  // ── 4: Photorealistic renders (Flux 1.1 Pro Ultra via Replicate) ───────────

  let renderUrls: string[] = []

  if (HAS_REPLICATE) {
    console.log(`[4/6] Submitting ${IMAGE_COUNT} Flux 1.1 Pro Ultra renders...`)
    const Replicate = (await import('replicate')).default
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    // Varied angle/composition so each render is distinct
    const VIEW_ANGLES = [
      'wide-angle overview shot from the entrance, full room perspective',
      'close-up detail of countertops and cabinetry, shallow depth of field',
      'opposite corner perspective showing windows and natural light flooding in',
      'overhead angled view highlighting the layout and spatial flow',
      'side elevation showing appliances and storage wall in context',
      'hero shot centered on focal feature, warm late-afternoon lighting',
      'hallway threshold perspective looking into the space',
      'detail shot of materials, textures, and premium finishes',
      'panoramic wide view capturing full width of the room',
      'low-angle dramatic perspective emphasizing ceiling height and volume',
      'intimate corner with ambient lighting and styled accessories',
      'exterior-facing window view with garden or street backdrop',
    ]

    // Submit renders sequentially with a 12s gap to respect the 1-burst/min
    // rate limit imposed when the Replicate account has < $5 credit.
    const predictionIds: string[] = []
    for (let i = 0; i < IMAGE_COUNT; i++) {
      const angle  = VIEW_ANGLES[i % VIEW_ANGLES.length]
      const prompt = [
        `photorealistic interior design, 8K, professional photography, natural daylight,`,
        `${style} ${roomType}, ${angle},`,
        `beautiful interior design, professional architectural visualization, high quality, detailed`,
      ].join(' ')

      if (i > 0) {
        process.stdout.write(`  Waiting 12s before next submission (rate limit)...\n`)
        await new Promise(r => setTimeout(r, 12_000))
      }
      let pred: any
      let attempts = 0
      while (attempts < 5) {
        try {
          pred = await replicate.predictions.create({
            model: 'black-forest-labs/flux-1.1-pro-ultra',
            input: {
              prompt,
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
          } else {
            throw err
          }
        }
      }
      if (!pred) throw new Error('Failed to submit render after retries')
      predictionIds.push(pred.id)
      process.stdout.write(`  Submitted render ${i + 1}/${IMAGE_COUNT} (${pred.id})\n`)
    }

    console.log(`  Polling ${IMAGE_COUNT} renders to completion (up to 3 min each)...`)
    process.stdout.write('  Progress: ')
    // Poll sequentially to avoid hammering the API
    const results: (string | null)[] = []
    for (const [i, id] of predictionIds.entries()) {
      const url = await pollReplicate(id, `render-${i + 1}`)
      results.push(url)
    }
    console.log()
    renderUrls = results.filter((u): u is string => typeof u === 'string')
    console.log(`[4/6] OK — ${renderUrls.length}/${IMAGE_COUNT} renders completed`)
  } else {
    console.log(`[4/6] SKIP — REPLICATE_API_TOKEN not set. Using ${IMAGE_COUNT} placeholder images.`)
    renderUrls = PLACEHOLDER_RENDERS
    console.log('       Add REPLICATE_API_TOKEN to apps/web-main/.env.local for real Flux renders.')
  }

  // ── 5: AI transformation video ─────────────────────────────────────────────

  let videoState: Record<string, unknown> | null = null

  if (TIER >= 2 && HAS_VIDEO) {
    const provider = HAS_OPENAI ? 'sora-2-pro' : HAS_GEMINI ? 'veo-3.1' : 'kling-2.5'
    console.log(`[5/6] Submitting AI transformation video via ${provider}...`)

    const videoPrompt = [
      `Cinematic architectural reveal of a ${style} ${roomType},`,
      `slow camera push through space, photorealistic, natural daylight through windows,`,
      `professional real-estate videography, 24mm wide lens, magazine-quality interior design`,
    ].join(' ')

    if (provider === 'kling-2.5') {
      const Replicate = (await import('replicate')).default
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

      const videoPred = await replicate.predictions.create({
        model: 'kwaivgi/kling-v2.5-turbo-pro',
        input: {
          prompt:            videoPrompt,
          duration:          5,
          aspect_ratio:      '16:9',
          ...(renderUrls[0] ? { image: renderUrls[0] } : {}),
        },
      })

      console.log(`  Polling Kling video (${videoPred.id}) — up to 10 min...`)
      process.stdout.write('  Progress: ')
      const videoUrl = await pollReplicate(videoPred.id, 'video', 600_000)
      console.log()

      if (videoUrl) {
        videoState = {
          status:      'completed',
          provider,
          jobId:       videoPred.id,
          outputUrl:   videoUrl,
          startedAt:   new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }
        console.log(`[5/6] OK — video: ${videoUrl}`)
      } else {
        console.log('[5/6] Video job submitted but polling timed out — check Replicate dashboard')
        videoState = { status: 'processing', provider, jobId: videoPred.id, startedAt: new Date().toISOString() }
      }
    } else {
      // Sora / Veo — fire through the /api/concept/video endpoint
      // (requires the Next.js dev server to be running on localhost:3000)
      console.log('  Sora/Veo: trigger via POST /api/concept/video after seeding completes.')
      console.log('  Run: curl -s -X POST http://localhost:3000/api/concept/video \\')
      console.log(`       -H "Content-Type: application/json" -d \'{"intakeId":"${intakeId}"}\'`)
      videoState = null
    }
  } else if (TIER >= 2) {
    console.log('[5/6] SKIP — no video provider key set.')
    console.log('       Set REPLICATE_API_TOKEN (Kling 2.5), OPENAI_API_KEY (Sora), or GEMINI_API_KEY (Veo).')
  } else {
    console.log('[5/6] SKIP — Tier 1 has no video deliverable.')
  }

  // ── 6: Write full output to Supabase ───────────────────────────────────────

  process.stdout.write('[6/6] Writing to Supabase... ')

  const conceptOutput = {
    conceptPackageId:   pkg.conceptPackageId,
    floorplanId:        fp.floorplanId,
    pdfUrl:             null,
    renderUrls,
    packageJson:        pkg.packageJson,
    generatedAt:        new Date().toISOString(),
    floorplanSvgInline: fp.svgString,
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

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════')
  console.log('  TEST COMPLETE')
  console.log('══════════════════════════════════════════════════════')
  console.log(`  Intake ID:   ${intakeId}`)
  console.log(`  Package ID:  ${pkg.conceptPackageId}`)
  console.log(`  Tier:        ${TIER} (${tierLabel})`)
  console.log(`  Renders:     ${renderUrls.length} URLs${HAS_REPLICATE ? '' : ' (placeholder)'}`)
  if (videoState) {
    const vs = videoState as any
    console.log(`  Video:       ${vs.status} (${vs.provider}${vs.outputUrl ? ` → ${vs.outputUrl}` : ''})`)
  }
  if (p?.designConcept?.style)   console.log(`  Style:       ${p.designConcept.style}`)
  if (p?.estimatedCost)          console.log(`  Est. Cost:   $${Number(p.estimatedCost).toLocaleString()}`)
  if (p?.projectTimeline)        console.log(`  Timeline:    ${p.projectTimeline}`)
  console.log()
  console.log('  Portal delivery URL:')
  console.log(`  → ${PORTAL_URL}/deliverables/${intakeId}`)
  console.log()

  if (!HAS_REPLICATE) {
    console.log('  ─── To enable real photorealistic renders ───────────')
    console.log('  Add to apps/web-main/.env.local:')
    console.log('    REPLICATE_API_TOKEN=r8_your_token_here')
    console.log('  Get your token at: https://replicate.com/account/api-tokens')
    console.log()
  }
  if (TIER >= 2 && !HAS_VIDEO) {
    console.log('  ─── To enable AI transformation video ───────────────')
    console.log('  Add ONE of the following to apps/web-main/.env.local:')
    console.log('    REPLICATE_API_TOKEN=r8_... (Kling 2.5 — recommended)')
    console.log('    OPENAI_API_KEY=sk-...      (Sora 2 Pro — cinematic)')
    console.log('    GEMINI_API_KEY=AIza...     (Veo 3.1)')
    console.log()
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('\n[premium-test] FAILED:', msg)
  if (process.env.DEBUG && err instanceof Error) console.error(err.stack)
  process.exit(1)
})
