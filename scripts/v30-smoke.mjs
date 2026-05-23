#!/usr/bin/env node
/**
 * Kealee v30 smoke checks (P0).
 * Usage: node scripts/v30-smoke.mjs [--api http://localhost:3001] [--web http://localhost:3000]
 */
const API = process.argv.includes('--api')
  ? process.argv[process.argv.indexOf('--api') + 1]
  : process.env.INTERNAL_API_URL || process.env.API_URL || 'http://localhost:3001'
const WEB = process.argv.includes('--web')
  ? process.argv[process.argv.indexOf('--web') + 1]
  : process.env.WEB_MAIN_URL || 'http://localhost:3000'

const checks = []

async function get(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* html ok for web */
  }
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 200) }
}

async function main() {
  console.log('Kealee v30 smoke\nAPI:', API, '\nWEB:', WEB, '\n')

  const apiStatus = await get(`${API}/v30/status`)
  checks.push({
    name: 'API /v30/status',
    pass: apiStatus.ok && apiStatus.json?.version === '3.0',
    detail: apiStatus.json ?? apiStatus.text,
  })

  const webGetConcept = await get(`${WEB}/get-concept`)
  checks.push({
    name: 'WEB /get-concept',
    pass: webGetConcept.status === 200,
    detail: `HTTP ${webGetConcept.status}`,
  })

  const sampleIntake = {
    propertyType: 'single-family',
    primaryScope: 'kitchen_remodel',
    budgetRange: '$100K-$250K',
    timeline: '6-8 weeks',
    location: 'Washington DC',
    squareFeet: 1800,
    yearBuilt: '1980-2000',
    utilities: { naturalGas: true, waterSewer: true },
    codeConsiderations: ['none'],
  }

  async function postV30Intake(projectPath, answers, selectedFeatures) {
    const res = await fetch(`${WEB}/api/v30/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath, answers, selectedFeatures }),
      signal: AbortSignal.timeout(60_000),
    })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, json }
  }

  if (apiStatus.json?.enabled) {
    const kitchen = await postV30Intake('kitchen_remodel', sampleIntake)
    checks.push({
      name: 'WEB /api/v30/intake — kitchen',
      pass: kitchen.ok && kitchen.json?.package?.totalPrice > 0,
      detail: kitchen.ok ? `$${kitchen.json.package.totalPrice}` : kitchen.json.error,
    })

    const gardenAnswers = {
      ...sampleIntake,
      primaryScope: 'garden_landscape',
      squareFeet: 1200,
      location: 'Arlington, VA',
      codeConsiderations: ['none'],
    }
    const garden = await postV30Intake('garden_concept', gardenAnswers, [
      'Design',
      'Floorplan',
      'Estimate',
      'CADExport',
    ])
    const gardenFeatures = garden.json?.package?.features ?? garden.json?.quote?.features ?? []
    const gardenNoPermits = !gardenFeatures.some(f => /^permits?$/i.test(String(f)))
    checks.push({
      name: 'WEB /api/v30/intake — garden concept',
      pass: garden.ok && garden.json?.package?.totalPrice > 0 && gardenNoPermits,
      detail: garden.ok
        ? `$${garden.json.package.totalPrice} features=${gardenFeatures.join(',')}`
        : garden.json.error,
    })

    const wholeAnswers = {
      ...sampleIntake,
      primaryScope: 'whole_home_concept',
      squareFeet: 3200,
      location: 'Bethesda, MD',
      budgetRange: '$250K-$500K',
      timeline: '12-16 weeks',
    }
    const whole = await postV30Intake('whole_home_concept', wholeAnswers, [
      'Design',
      'Floorplan',
      'Estimate',
      'Permits',
    ])
    const wholeFeatures = whole.json?.package?.features ?? []
    const wholeHasFloorplan = wholeFeatures.some(f => /floorplan/i.test(String(f)))
    checks.push({
      name: 'WEB /api/v30/intake — whole home concept',
      pass: whole.ok && whole.json?.package?.totalPrice > 0 && wholeHasFloorplan,
      detail: whole.ok
        ? `$${whole.json.package.totalPrice} features=${wholeFeatures.join(',')}`
        : whole.json.error,
    })
  } else {
    checks.push({
      name: 'WEB /api/v30/intake quotes',
      pass: true,
      detail: 'skipped — v30 disabled on API (set KEALEE_V30_ENABLED=true)',
    })
  }

  try {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const {
      assembleLandscapePremiumPackage,
      shouldResolveLotGis,
    } = require('../packages/kealee-agent-stack/dist/v30/landscape-deliverables.js')
    const pkg = assembleLandscapePremiumPackage({
      tier: 3,
      projectPath: 'garden_concept',
      floorplanOutput: {
        plantSchedule: [{ species: 'Lavandula angustifolia', commonName: 'Lavender', quantity: 24, unit: 'each', unitCost: 18 }],
        treeSchedule: [{ species: 'Acer rubrum', caliperOrSize: '2.5 in', quantity: 2, unitCost: 450 }],
        materialTakeoff: [{ material: 'Bluestone pavers', quantity: 180, unit: 'sqft', unitCost: 14 }],
      },
      estimateOutput: { estimatedCost: 28500, costRange: { low: 22000, high: 35000 } },
      lotContext: { lat: 38.88, lng: -77.1 },
    })
    checks.push({
      name: 'landscape Premium+ package assembler',
      pass:
        pkg?.plants?.length === 1 &&
        pkg?.trees?.length === 1 &&
        pkg?.materials?.length === 1 &&
        pkg?.estimatedCost?.mid > 0,
      detail: pkg
        ? `plants=${pkg.plants.length} trees=${pkg.trees.length} mid=$${pkg.estimatedCost.mid}`
        : 'null',
    })
    checks.push({
      name: 'GIS — garden resolves lot',
      pass: shouldResolveLotGis('garden_concept', 'garden_landscape'),
      detail: 'garden_concept',
    })
    checks.push({
      name: 'GIS — whole home does not require lot GIS',
      pass: !shouldResolveLotGis('whole_home_concept', 'whole_home_concept'),
      detail: 'whole_home_concept',
    })
  } catch (err) {
    checks.push({
      name: 'landscape Premium+ package assembler',
      pass: false,
      detail: err instanceof Error ? err.message : String(err),
    })
  }

  let failed = 0
  for (const c of checks) {
    const icon = c.pass ? '✓' : '✗'
    if (!c.pass) failed++
    console.log(`${icon} ${c.name}`)
    if (c.detail) console.log('   ', typeof c.detail === 'object' ? JSON.stringify(c.detail) : c.detail)
  }

  console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed')
  process.exit(failed ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
