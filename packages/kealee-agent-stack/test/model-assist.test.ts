/**
 * Narratives, and the hosted models where the engines stop.
 *   npx tsx --test test/model-assist.test.ts
 * A local OpenAI-compatible server stands in for the Qwen deployment.
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { numbersPreserved, assist } from '../src/v30/model-assist'
import { executeV30BotEngineFirst, executeV30BotWithoutModel } from '../src/v30/model-free'
import { existingConditions, parseBudget, yearOf } from '../src/v30/model-free/narratives'

const kitchen = {
  projectId: 'p1', packageId: 'k1',
  inputData: {
    projectPath: 'kitchen_remodel',
    intake: {
      propertyType: 'rowhouse', primaryScope: 'Kitchen remodel', budgetRange: '$50k-$100k', timeline: '3 months',
      location: 'Washington, DC', squareFeet: 160, yearBuilt: '1924', utilities: { naturalGas: true }, codeConsiderations: ['historic district'],
    },
    features: ['Design', 'Estimate', 'Permits'],
    jurisdiction: { determined: true, code: 'district_of_columbia', name: 'District of Columbia' },
  },
}

// ── Fake Qwen ────────────────────────────────────────────────────────────────
type Reply = (system: string, user: string) => string
let reply: Reply = () => ''
let calls = 0
let originalFetch: typeof globalThis.fetch
before(() => {
  originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    if (String(input).includes('127.0.0.1:1')) throw new TypeError('fetch failed')
    calls++
    const b = JSON.parse(String(init?.body ?? '{}')) as { messages: { role: string; content: string }[] }
    const text = reply(b.messages[0].content, b.messages[1].content)
    return new Response(JSON.stringify({ model: 'qwen-kealee-test', choices: [{ message: { content: text } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  process.env.INTERNAL_LLM_ENABLED = 'true'
  process.env.INTERNAL_TEXT_BASE_URL = 'http://qwen.test/v1'
  process.env.KEALEE_QWEN_TIMEOUT_MS = '1000'
  delete process.env.ANTHROPIC_API_KEY
})
after(() => {
  globalThis.fetch = originalFetch
  delete process.env.INTERNAL_LLM_ENABLED
  delete process.env.INTERNAL_TEXT_BASE_URL
  delete process.env.KEALEE_QWEN_TIMEOUT_MS
})

// ── Narratives ───────────────────────────────────────────────────────────────
test('the concept narrative is built from the order, section by section', () => {
  const o = executeV30BotWithoutModel({ ...kitchen, botType: 'design' }).outputData as any
  const balanced = o.concepts[1]
  const headings = balanced.narrativeSections.map((s: any) => s.heading)
  for (const h of ['Design direction', 'Materials and finishes', 'Layout and function', 'Where the money goes', 'Existing conditions to confirm', 'Sequence and timeline', 'Permits', 'Next steps']) {
    assert.ok(headings.includes(h), h)
  }
  const text = balanced.narrativeSections.map((s: any) => s.body).join(' ')
  assert.match(text, /Renovation, Repair and Painting Rule/)   // built 1924 → lead
  assert.match(text, /knob-and-tube/)                          // pre-1950
  assert.match(text, /historic district/)                      // intake consideration
  assert.match(text, /NKBA/)                                   // kitchen layout guidance
  assert.match(text, /District of Columbia/)                   // permit office
  assert.match(balanced.narrative, /per sq ft/)
})

test('year, budget and existing-condition readers', () => {
  assert.equal(yearOf('pre-1950'), 1949)
  assert.equal(yearOf('1970s'), 1970)
  assert.deepEqual(parseBudget('$50k-$100k'), [50000, 100000])
  assert.deepEqual(parseBudget('under $40k'), [0, 40000])
  assert.ok(existingConditions({ family: 'bath', label: 'Bath', propertyType: '', location: '', yearBuilt: '', budgetRange: '', timeline: '', naturalGas: false, codeConsiderations: [], permitTypes: [], jurisdictionName: null })[0].includes('site visit'))
})

// ── Guards ───────────────────────────────────────────────────────────────────
test('a rewrite may not drop, change or add a number', () => {
  const src = 'Priced at $64,767 — $360 per sq ft — with a 15% contingency and 42 in aisles.'
  assert.equal(numbersPreserved(src, 'At $64,767 ($360 per sq ft), with 15% contingency and 42 in aisles.'), null)
  assert.match(numbersPreserved(src, 'Priced at $65,000 with 15% contingency, 42 in aisles, $360/sq ft.')!, /dropped 64767|introduced 65000/)
  assert.match(numbersPreserved(src, 'At $64,767, $360 per sq ft, 15% contingency, 42 in aisles, done in 6 weeks.')!, /introduced 6/)
  assert.match(numbersPreserved('Two 36 in doors need two 36 in openings.', 'Two 36 in doors need an opening.')!, /dropped 36/)
  assert.match(numbersPreserved('One 36 in door.', 'One 36 in door and another 36 in opening.')!, /introduced 36/)
})

// ── Qwen polishes, the guard holds ──────────────────────────────────────────
test('Qwen polishes the narrative when it keeps every number', async () => {
  reply = (_s, user) => `Here is a warmer version. ${user}`
  const r = await executeV30BotEngineFirst({ ...kitchen, botType: 'estimate' })
  assert.equal(r.status, 'COMPLETE')
  const o = r.outputData as any
  assert.match(o.narrative, /^Here is a warmer version/)
  assert.ok(o.narrativeKealee, 'the original Kealee text is kept beside it')
  assert.match(r.modelUsed, /qwen/)
  assert.ok(o.modelTrace.some((t: any) => t.provider === 'qwen' && t.accepted))
  assert.equal(o.costRange.midpointEstimate > 0, true, 'numbers still come from the engine')
})

test('a Qwen rewrite that changes a figure is rejected and the Kealee text stands', async () => {
  reply = () => 'This kitchen will cost about $10 total.'
  const r = await executeV30BotEngineFirst({ ...kitchen, botType: 'estimate' })
  const o = r.outputData as any
  assert.doesNotMatch(o.narrative, /\$10 total/)
  assert.equal(o.narrativeKealee, undefined)
  const t = o.modelTrace.find((x: any) => x.provider === 'qwen')
  assert.equal(t.accepted, false)
  assert.match(t.rejection, /dropped|introduced/)
})

// ── Where the engines stop ──────────────────────────────────────────────────
test('ops copy the engines do not write is drafted by Qwen and completes', async () => {
  reply = () => JSON.stringify({ objectionsHandled: [{ objectType: 'Price', response: 'We price from our cost library.' }] })
  const r = await executeV30BotEngineFirst({ ...kitchen, botType: 'sales' })
  assert.equal(r.status, 'COMPLETE')
  assert.match((r.outputData as any).generatedBy, /^qwen:/)
})

test('a customer deliverable the engines cannot compute gets a model draft for staff — not a delivery', async () => {
  reply = () => JSON.stringify({ mode: 'PRELIMINARY', costRange: { lowEstimate: 40000, highEstimate: 90000 } })
  const pool = { ...kitchen, botType: 'estimate' as const, inputData: { ...kitchen.inputData, intake: { ...kitchen.inputData.intake, primaryScope: 'In-ground pool' } } }
  const r = await executeV30BotEngineFirst(pool)
  assert.equal(r.status, 'FAILED')
  const o = r.outputData as any
  assert.equal(o.requiresHumanFulfillment, true)
  assert.ok(o.modelDraft)
  assert.match(o.modelDraftBy, /^qwen:/)
})

test('contractor recommendations are never sent to a model', async () => {
  const before = calls
  const r = await executeV30BotEngineFirst({ ...kitchen, botType: 'contractor' })
  assert.equal(calls, before)
  assert.equal((r.outputData as any).requiresHumanFulfillment, true)
})

test('with Qwen down and no Claude, nothing is lost: the engines deliver', async () => {
  process.env.INTERNAL_TEXT_BASE_URL = 'http://127.0.0.1:1/v1'
  const outcome = await assist({ task: 't', system: 's', prompt: 'p' })
  assert.equal(outcome.ok, false)
  assert.equal(outcome.traces[0].accepted, false)
  const r = await executeV30BotEngineFirst({ ...kitchen, botType: 'design' })
  assert.equal(r.status, 'COMPLETE')
  assert.equal((r.outputData as any).concepts.length, 3)
})
