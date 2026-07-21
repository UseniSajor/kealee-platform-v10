#!/usr/bin/env node
/**
 * Print finished Premium deliverable payloads (addition + whole-home)
 * matching /api/concept/generate dual-scope output + owner portal URLs.
 *
 * Usage:
 *   node scripts/show-premium-deliverable.mjs
 *   BASE_URL=https://kealee.com INTAKE_ADDITION=... INTAKE_WHOLE_HOME=... node scripts/show-premium-deliverable.mjs --live
 */

import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORTAL = (process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? 'https://owner.kealee.com').replace(/\/$/, '')
const VIDEO =
  process.env.CONCEPT_PLACEHOLDER_VIDEO_URL?.trim() ||
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

const DUAL_STUBS = {
  addition_expansion: {
    label: 'Addition / Expansion (Premium)',
    renderCount: 5,
    interior: [
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80',
    ],
    exterior: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=80',
    ],
  },
  whole_home_remodel: {
    label: 'Whole-Home Remodel (Premium)',
    renderCount: 7,
    interior: [
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
      'https://images.unsplash.com/photo-1600566752734-2a0cd0e0da49?w=1920&q=80',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80',
      'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1920&q=80',
    ],
    exterior: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80',
      'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=1920&q=80',
    ],
  },
}

function splitDual(total) {
  const exterior = Math.max(2, Math.ceil(total * 0.4))
  const interior = Math.max(2, total - exterior)
  return { interior, exterior }
}

function buildConceptOutput(projectPath) {
  const pack = DUAL_STUBS[projectPath]
  const { interior, exterior } = splitDual(pack.renderCount)
  const interiorRenderUrls = pack.interior.slice(0, interior)
  const exteriorRenderUrls = pack.exterior.slice(0, exterior)
  return {
    designConcept: {
      style: 'Modern Contemporary',
      colorPalette: ['Warm white', 'Charcoal trim', 'Natural oak'],
      keyFeatures: [
        'Open-plan living tied to new addition',
        'Updated exterior massing and materials',
        'DMV permit roadmap included',
      ],
    },
    estimatedCost: projectPath === 'addition_expansion' ? 185000 : 320000,
    projectTimeline: projectPath === 'addition_expansion' ? '12–18 weeks' : '20–32 weeks',
    description: `Premium concept package for ${pack.label}.`,
    interiorRenderUrls,
    exteriorRenderUrls,
    renderUrls: [...interiorRenderUrls, ...exteriorRenderUrls],
    videoUrl: VIDEO,
    videoDuration: 60,
    permitScope: {
      requiresPermit: true,
      permitTypes: ['Building Permit', 'Electrical Permit'],
      estimatedPermitFee: 1200,
      estimatedProcessingDays: 28,
      requiresPE: false,
      notes: 'Addition/remodel scope requires AHJ submittal before construction.',
    },
    buildabilityFlag: 'feasible',
    readinessScore: 72,
  }
}

function portalUrl(intakeId, projectPath) {
  return `${PORTAL}/deliverables/${intakeId}?projectPath=${encodeURIComponent(projectPath)}`
}

function printDeliverable(intakeId, projectPath, co, source) {
  const pack = DUAL_STUBS[projectPath]
  const interior = co.interiorRenderUrls?.length ?? 0
  const exterior = co.exteriorRenderUrls?.length ?? 0
  const video = co.videoUrl ? 'yes' : 'no'

  console.log('')
  console.log('═'.repeat(72))
  console.log(`✓ ${pack.label}`)
  console.log(`  source: ${source}`)
  console.log(`  interior: ${interior}  exterior: ${exterior}  video: ${video}`)
  console.log('─'.repeat(72))
  console.log(`  Owner Portal:`)
  console.log(`  ${portalUrl(intakeId, projectPath)}`)
  console.log('')
  console.log('  Interior renders:')
  for (const [i, u] of (co.interiorRenderUrls ?? []).entries()) {
    console.log(`    [${i + 1}] ${u}`)
  }
  console.log('  Exterior renders:')
  for (const [i, u] of (co.exteriorRenderUrls ?? []).entries()) {
    console.log(`    [${i + 1}] ${u}`)
  }
  console.log(`  Video: ${co.videoUrl}`)
  console.log('')
  console.log('  conceptOutput (saved to form_data):')
  console.log(JSON.stringify(co, null, 2))
}

function loadEnvFile(relPath) {
  const p = join(ROOT, relPath)
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

async function fetchLive(intakeId, projectPath) {
  const base = (process.env.BASE_URL ?? 'https://kealee.com').replace(/\/$/, '')
  const res = await fetch(`${base}/api/concept/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intakeId }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? body.message ?? `HTTP ${res.status}`)
  return body.conceptOutput
}

async function main() {
  const live = process.argv.includes('--live')
  loadEnvFile('apps/web-main/.env.local')
  loadEnvFile('services/api/.env.local')

  console.log('\nPremium deliverable preview — Addition + Whole-Home (tier 2)\n')

  const cases = [
    { projectPath: 'addition_expansion', envKey: 'INTAKE_ADDITION' },
    { projectPath: 'whole_home_remodel', envKey: 'INTAKE_WHOLE_HOME' },
  ]

  let ok = 0
  for (const c of cases) {
    const intakeId = process.env[c.envKey] || randomUUID()
    try {
      const co = live
        ? await fetchLive(intakeId, c.projectPath)
        : buildConceptOutput(c.projectPath)
      printDeliverable(intakeId, c.projectPath, co, live ? `live ${process.env.BASE_URL ?? 'https://kealee.com'}` : 'local demo (deploy + regenerate for production DB)')
      ok++
    } catch (err) {
      console.error(`✗ ${DUAL_STUBS[c.projectPath].label}: ${err.message}`)
      const co = buildConceptOutput(c.projectPath)
      printDeliverable(intakeId, c.projectPath, co, 'demo fallback (live generate failed)')
      ok++
    }
  }

  console.log('═'.repeat(72))
  console.log(`\n${ok}/${cases.length} packages shown. Open Owner Portal URLs in browser for UI.\n`)
  if (!live) {
    console.log('Tip: set INTAKE_* UUIDs + BASE_URL and run with --live after deploy.\n')
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
