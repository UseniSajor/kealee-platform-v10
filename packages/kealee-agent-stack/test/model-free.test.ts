/**
 * The v30 bots with no language model.
 *   npx tsx --test test/model-free.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COST_RECIPES, priceRecipe, recipeFor, executeV30BotWithoutModel } from '../src/v30/model-free'
import { executeV30BotWithLlm, shouldUseV30Llm } from '../src/v30/llm-executor'
import { runV30ParallelGeneration, v30DryRunExecution } from '../src/v30/orchestrator'
import { mapV30DesignToConceptOutput } from '../src/v30/design-bot-executor'

const kitchen = {
  projectId: 'p1', packageId: 'k1',
  inputData: {
    projectPath: 'kitchen_remodel',
    intake: {
      propertyType: 'single family', primaryScope: 'Kitchen remodel', budgetRange: '$50k-$100k', timeline: '3 months',
      location: 'Bethesda, MD', squareFeet: 180, yearBuilt: '1985', utilities: { naturalGas: true }, codeConsiderations: [],
    },
    features: ['Design', 'Estimate', 'Permits'],
    jurisdiction: { determined: true, code: 'montgomery_md', name: 'Montgomery County, Maryland' },
  },
}

test('every recipe line names an assembly that exists in the library, at every tier', () => {
  for (const r of COST_RECIPES) for (const t of ['BUDGET', 'BALANCED', 'PREMIUM'] as const) {
    const e = priceRecipe(r, t, r.defaultSqft, 'Baltimore')
    assert.ok(e.total > 0, `${r.family} ${t}`)
  }
})

test('tiers rise and the region multiplier applies', () => {
  const r = recipeFor('kitchen')!
  const [b, m, p] = (['BUDGET', 'BALANCED', 'PREMIUM'] as const).map(t => priceRecipe(r, t, 150, 'Baltimore').total)
  assert.ok(b < m && m < p)
  const dc = priceRecipe(r, 'BALANCED', 150, 'Washington, DC').subtotal
  const balt = priceRecipe(r, 'BALANCED', 150, 'Baltimore').subtotal
  assert.ok(Math.abs(dc / balt - 1.15) < 0.01)
})

test('with no model configured, the estimate is computed — never a hollow COMPLETE', async () => {
  delete process.env.ANTHROPIC_API_KEY
  assert.equal(shouldUseV30Llm(), false)
  const r = await executeV30BotWithLlm({ ...kitchen, botType: 'estimate', systemPrompt: '' })
  assert.equal(r.status, 'COMPLETE')
  assert.equal(r.modelUsed, 'kealee-model-free')
  const o = r.outputData as any
  assert.equal(o.dryRun, undefined)
  assert.ok(o.costRange.lowEstimate < o.costRange.midpointEstimate && o.costRange.midpointEstimate < o.costRange.highEstimate)
  assert.ok(o.lineItems.length >= 10)
  assert.match(o.assumptions.join(' '), /180 sq ft/)
})

test('KEALEE_MODEL_FREE=true forces the engines even with a key present', () => {
  process.env.ANTHROPIC_API_KEY = 'sk-test'
  process.env.KEALEE_MODEL_FREE = 'true'
  assert.equal(shouldUseV30Llm(), false)
  delete process.env.KEALEE_MODEL_FREE
  delete process.env.ANTHROPIC_API_KEY
})

test('design gives three priced concepts the portal can read', () => {
  const r = executeV30BotWithoutModel({ ...kitchen, botType: 'design' })
  assert.equal(r.status, 'COMPLETE')
  const concepts = (r.outputData as any).concepts
  assert.deepEqual(concepts.map((c: any) => c.tier), ['BUDGET', 'BALANCED', 'PREMIUM'])
  const portal = mapV30DesignToConceptOutput(r.outputData!, { projectPath: 'kitchen_remodel' }) as any
  assert.ok(portal.estimatedCost > 0)
  assert.equal(portal.concepts.length, 3)
  assert.match(portal.imagePrompts[0], /kitchen/i)
})

test('zoning names the determined jurisdiction and invents no fees or review times', () => {
  const o = executeV30BotWithoutModel({ ...kitchen, botType: 'zoning' }).outputData as any
  assert.equal(o.jurisdiction, 'Montgomery County, Maryland')
  assert.ok(o.requiredPermits.includes('Building permit'))
  for (const p of o.permitRequirements) { assert.equal(p.cost, null); assert.equal(p.processingTime, null) }
})

test('what cannot be computed goes to a person, recorded — not completed', () => {
  const pool = executeV30BotWithoutModel({ ...kitchen, botType: 'estimate', inputData: { ...kitchen.inputData, projectPath: 'pool', intake: { ...kitchen.inputData.intake, primaryScope: 'In-ground pool' } } })
  assert.equal(pool.status, 'FAILED')
  assert.equal((pool.outputData as any).requiresHumanFulfillment, true)
  const contractor = executeV30BotWithoutModel({ ...kitchen, botType: 'contractor' })
  assert.equal(contractor.status, 'FAILED')
  assert.equal((contractor.outputData as any).requiresHumanFulfillment, true)
  assert.equal((contractor.outputData as any).recommendations, undefined)
})

test('the old dry run and the default orchestrator path no longer return stubs', async () => {
  const dry = v30DryRunExecution({ ...kitchen, botType: 'estimate' })
  assert.equal((dry.outputData as any).dryRun, undefined)
  const all = await runV30ParallelGeneration('p1', 'k1', kitchen.inputData)
  for (const e of all.executions) {
    assert.equal((e.outputData as any)?.dryRun, undefined, e.botType)
    assert.ok(e.status === 'COMPLETE' || (e.outputData as any).requiresHumanFulfillment, `${e.botType} must be computed or handed to staff`)
  }
})
