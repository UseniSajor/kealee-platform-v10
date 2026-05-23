#!/usr/bin/env node
/**
 * Fast offline checks for garden + whole-home v30 concept paths (no HTTP/LLM).
 * Usage: node scripts/v30-concept-scope-test.mjs
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { analyzeV30Intake } = require('../packages/kealee-agent-stack/dist/v30/intake-analyzer.js')
const {
  calculateV30PackagePrice,
  DEFAULT_V30_PRICING_FORMULA,
} = require('../packages/kealee-agent-stack/dist/v30/pricing.js')
const { mergeV30PackageFeatures } = require('../packages/kealee-agent-stack/dist/v30/package-features.js')
const {
  assembleLandscapePremiumPackage,
  shouldResolveLotGis,
} = require('../packages/kealee-agent-stack/dist/v30/landscape-deliverables.js')

const gardenAnswers = {
  propertyType: 'single-family',
  primaryScope: 'garden_landscape',
  budgetRange: '$25K-$75K',
  timeline: '4-6 weeks',
  location: 'Arlington, VA',
  squareFeet: 1200,
  yearBuilt: '1980-2000',
  utilities: { naturalGas: false, waterSewer: true },
  codeConsiderations: ['none'],
}

const wholeAnswers = {
  propertyType: 'single-family',
  primaryScope: 'whole_home_concept',
  budgetRange: '$250K-$500K',
  timeline: '12-16 weeks',
  location: 'Bethesda, MD',
  squareFeet: 3200,
  yearBuilt: '1960-1980',
  utilities: { naturalGas: true, waterSewer: true },
  codeConsiderations: ['structural'],
}

function runCase(name, projectPath, answers, tier) {
  const analysis = analyzeV30Intake(answers, DEFAULT_V30_PRICING_FORMULA, projectPath)
  const features = mergeV30PackageFeatures(analysis.suggestedFeatures, {
    tier,
    projectPath,
    answers,
  })
  const { totalPrice } = calculateV30PackagePrice(
    analysis.estimatedCost,
    features,
    DEFAULT_V30_PRICING_FORMULA,
    { answers, projectPath },
  )
  const noPermits = !features.some(f => /^permits?$/i.test(f))
  const hasFloorplan = features.some(f => /floorplan/i.test(f))
  const pass =
    totalPrice > 0 &&
    hasFloorplan &&
    (name.includes('garden') ? noPermits : features.some(f => /^permits?$/i.test(f)))
  return { name, pass, totalPrice, features, complexity: analysis.scopeComplexity }
}

const gardenPkg = assembleLandscapePremiumPackage({
  tier: 3,
  projectPath: 'garden_concept',
  floorplanOutput: {
    plantSchedule: [{ species: 'Hydrangea macrophylla', quantity: 8, unit: 'each', unitCost: 45 }],
    treeSchedule: [{ species: 'Cercis canadensis', quantity: 1, unitCost: 380 }],
    materialTakeoff: [{ material: 'Compost', quantity: 6, unit: 'cu yd', unitCost: 55 }],
  },
  estimateOutput: { estimatedCost: 18500, costRange: { low: 14000, high: 24000 } },
})

const cases = [
  runCase('garden concept (tier 3)', 'garden_concept', gardenAnswers, 3),
  runCase('whole home concept (tier 3)', 'whole_home_concept', wholeAnswers, 3),
]

let failed = 0
console.log('v30 concept scope tests (offline)\n')
for (const c of cases) {
  const icon = c.pass ? '✓' : '✗'
  if (!c.pass) failed++
  console.log(`${icon} ${c.name}`)
  console.log(`   $${c.totalPrice} | ${c.features.join(', ')} | complexity=${c.complexity}`)
}

const landscapeOk =
  gardenPkg?.plants?.length >= 1 &&
  gardenPkg?.trees?.length >= 1 &&
  gardenPkg?.materials?.length >= 1 &&
  gardenPkg?.estimatedCost?.mid > 0
console.log(`${landscapeOk ? '✓' : '✗'} Premium+ landscape package assembler`)
if (!landscapeOk) failed++
else console.log(`   plants=${gardenPkg.plants.length} trees=${gardenPkg.trees.length} mid=$${gardenPkg.estimatedCost.mid}`)

if (!shouldResolveLotGis('garden_concept')) failed++
if (shouldResolveLotGis('whole_home_concept')) failed++
console.log(`${shouldResolveLotGis('garden_concept') ? '✓' : '✗'} GIS for garden`)
console.log(`${!shouldResolveLotGis('whole_home_concept') ? '✓' : '✗'} GIS skipped for whole home`)

console.log(failed ? `\n${failed} failed` : '\nAll passed')
process.exit(failed ? 1 : 0)
