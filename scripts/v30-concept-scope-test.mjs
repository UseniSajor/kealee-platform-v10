#!/usr/bin/env node
/**
 * Fast offline checks for v30 concept paths (garden, kitchen, bath, addition, whole home).
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { analyzeV30Intake } = require('../packages/kealee-agent-stack/dist/v30/intake-analyzer.js')
const { calculateV30PackagePrice, DEFAULT_V30_PRICING_FORMULA } = require('../packages/kealee-agent-stack/dist/v30/pricing.js')
const { calculateFloorplanAddon } = require('../packages/kealee-agent-stack/dist/v30/floorplan-pricing.js')
const { mergeV30PackageFeatures } = require('../packages/kealee-agent-stack/dist/v30/package-features.js')
const {
  assembleLandscapePremiumPackage,
  shouldResolveLotGis,
} = require('../packages/kealee-agent-stack/dist/v30/landscape-deliverables.js')
const { inferFloorplanScope } = require('../packages/kealee-agent-stack/dist/v30/floorplan-pricing.js')

const base = {
  propertyType: 'single-family',
  budgetRange: '$100K-$250K',
  timeline: '6-8 weeks',
  location: 'Arlington, VA',
  yearBuilt: '1980-2000',
  utilities: { naturalGas: true, waterSewer: true },
  codeConsiderations: ['none'],
}

const cases = [
  {
    name: 'garden Premium+',
    projectPath: 'garden_concept',
    answers: { ...base, primaryScope: 'garden_landscape', squareFeet: 1200 },
    tier: 3,
    expectFloorplan: true,
    expectPermits: false,
    floorplanScope: 'garden_landscape',
    gis: true,
  },
  {
    name: 'kitchen Premium',
    projectPath: 'kitchen_remodel',
    answers: { ...base, primaryScope: 'kitchen_remodel', squareFeet: 220 },
    tier: 2,
    expectFloorplan: true,
    expectPermits: true,
    floorplanScope: 'kitchen',
    gis: true,
  },
  {
    name: 'bathroom Premium',
    projectPath: 'bathroom_remodel',
    answers: { ...base, primaryScope: 'bathroom_remodel', squareFeet: 65 },
    tier: 2,
    expectFloorplan: true,
    expectPermits: true,
    floorplanScope: 'bath',
    gis: true,
  },
  {
    name: 'addition Premium+',
    projectPath: 'addition_expansion',
    answers: { ...base, primaryScope: 'addition', squareFeet: 480 },
    tier: 3,
    expectFloorplan: true,
    expectPermits: true,
    floorplanScope: 'addition',
    gis: true,
  },
  {
    name: 'whole home Premium+',
    projectPath: 'whole_home_concept',
    answers: { ...base, primaryScope: 'whole_home_concept', squareFeet: 3200, budgetRange: '$250K-$500K' },
    tier: 3,
    expectFloorplan: true,
    expectPermits: true,
    floorplanScope: 'whole_house',
    gis: true,
  },
]

let failed = 0
console.log('v30 concept + floorplan scope tests\n')

for (const c of cases) {
  const analysis = analyzeV30Intake(c.answers, DEFAULT_V30_PRICING_FORMULA, c.projectPath)
  const features = mergeV30PackageFeatures(analysis.suggestedFeatures, {
    tier: c.tier,
    projectPath: c.projectPath,
    answers: c.answers,
  })
  const { totalPrice } = calculateV30PackagePrice(
    analysis.estimatedCost,
    features,
    DEFAULT_V30_PRICING_FORMULA,
    { answers: c.answers, projectPath: c.projectPath },
  )
  const fpScope = inferFloorplanScope(c.answers, c.projectPath)
  const fpAddon = calculateFloorplanAddon(c.answers, DEFAULT_V30_PRICING_FORMULA, c.projectPath)
  const hasFloorplan = features.some(f => /^floorplan$/i.test(f))
  const hasPermits = features.some(f => /^permits?$/i.test(f))
  const gisOk = shouldResolveLotGis(c.projectPath, c.answers.primaryScope) === c.gis
  const pass =
    totalPrice > 0 &&
    hasFloorplan === c.expectFloorplan &&
    hasPermits === c.expectPermits &&
    fpScope === c.floorplanScope &&
    fpAddon.amount > 0 &&
    gisOk

  if (!pass) failed++
  console.log(`${pass ? '✓' : '✗'} ${c.name}`)
  console.log(
    `   $${totalPrice} | floorplan=${hasFloorplan} scope=${fpScope} addon=$${fpAddon.amount} permits=${hasPermits} gis=${gisOk}`,
  )
}

const gardenPkg = assembleLandscapePremiumPackage({
  tier: 3,
  projectPath: 'garden_concept',
  floorplanOutput: {
    plantSchedule: [{ species: 'Hosta', quantity: 20, unit: 'each' }],
    treeSchedule: [{ species: 'Dogwood', quantity: 1 }],
    materialTakeoff: [{ material: 'Mulch', quantity: 8, unit: 'cu yd' }],
  },
  estimateOutput: { estimatedCost: 12000 },
})
const landscapeOk = gardenPkg?.plants?.length >= 1
console.log(`${landscapeOk ? '✓' : '✗'} landscape Premium+ assembler`)
if (!landscapeOk) failed++

console.log(failed ? `\n${failed} failed` : '\nAll passed')
process.exit(failed ? 1 : 0)
