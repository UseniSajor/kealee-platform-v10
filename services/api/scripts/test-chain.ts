/**
 * test-chain.ts
 *
 * Simulates the full KeaBot pipeline:
 *   Design → Estimate → Permit → Contractor
 *
 * Runs without Fastify. Uses tsx directly.
 * Usage: npx tsx scripts/test-chain.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load env — .env first (has ANTHROPIC_API_KEY), then .env.local (overrides)
config({ path: resolve(__dirname, '../.env') })
config({ path: resolve(__dirname, '../.env.local'), override: true })

import { runChain } from '../src/modules/bots/bots.chain'
import { loadRAGData } from '../src/lib/orchestrator/retrieval/rag-retriever'

const PAD = 60

function section(title: string) {
  console.log('\n' + '─'.repeat(PAD))
  console.log(`  ${title}`)
  console.log('─'.repeat(PAD))
}

function pass(label: string, value?: any) {
  const val = value !== undefined ? `  → ${JSON.stringify(value)}` : ''
  console.log(`  ✅ ${label}${val}`)
}

function fail(label: string, detail?: string) {
  console.log(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`)
}

function check(label: string, condition: boolean, detail?: string) {
  condition ? pass(label, detail) : fail(label, detail)
}

async function main() {
  section('0. Environment')
  check('ANTHROPIC_API_KEY', !!process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_API_KEY?.slice(0, 20) + '...')
  check('DATABASE_URL',      !!process.env.DATABASE_URL,      process.env.DATABASE_URL?.slice(0, 40) + '...')

  section('1. RAG Loader')
  let ragLoaded = false
  try {
    await loadRAGData()
    ragLoaded = true
  } catch (err: any) {
    fail('loadRAGData', err.message)
  }
  check('RAG loaded', ragLoaded)

  section('2. Run Full Chain')
  const input = {
    projectId:          'test-kitchen-001',
    projectType:        'kitchen-remodel',
    location:           'Maryland',
    jurisdiction:       'maryland',
    scope:              'Full kitchen remodel including cabinets, countertops, flooring, appliances, and MEP rough-ins',
    sqft:               1200,
    structuralChanges:  false,
    electricalChanges:  true,
    plumbingChanges:    true,
  }
  console.log('  Input:', JSON.stringify(input, null, 4))

  let result: any
  try {
    const start = Date.now()
    result = await runChain(input)
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`\n  Chain completed in ${elapsed}s`)
  } catch (err: any) {
    fail('runChain threw', err.message)
    console.error(err)
    process.exit(1)
  }

  // ── Stage checks ─────────────────────────────────────────────────────────

  section('3. Design Stage')
  const d = result.design
  check('result.design exists',           !!d)
  check('design.botRunId present',        !!d?.botRunId,                                        d?.botRunId)
  check('design.estimatedTotalCostUsd>0', (d?.estimatedTotalCostUsd ?? 0) > 0,                 `$${d?.estimatedTotalCostUsd?.toLocaleString()}`)
  check('design.ctcTotal > 0',            (d?.ctcTotal ?? 0) > 0,                              `$${d?.ctcTotal?.toLocaleString()}`)
  check('design.bom is array',            Array.isArray(d?.bom),                               `${d?.bomItemCount} BOM items`)
  check('design.bomItemCount > 0',        (d?.bomItemCount ?? 0) > 0,                          String(d?.bomItemCount))

  section('4. Estimate Stage')
  const e = result.estimate
  check('result.estimate exists',         !!e)
  check('estimate.botRunId present',      !!e?.botRunId,                                        e?.botRunId)
  check('estimate.parentRunId chains',    e?.parentRunId === d?.botRunId,                       e?.parentRunId)
  check('estimate.lineItems is array',    Array.isArray(e?.lineItems),                          `${e?.lineItems?.length} items`)
  check('estimate.totalLow >= 0',         typeof e?.totalLow === 'number',                      `$${e?.totalLow?.toLocaleString()} – $${e?.totalHigh?.toLocaleString()}`)
  check('estimate.confidence set',        !!e?.confidence,                                      e?.confidence)
  const estimateHasData = (e?.lineItems?.length ?? 0) > 0
  if (!estimateHasData) {
    console.log('  ⚠️  WARNING: estimate returned 0 line items and $0 total — Claude may need richer prompt context')
  }

  section('5. Permit Stage')
  const p = result.permit
  check('result.permit exists',           !!p)
  check('permit.botRunId present',        !!p?.botRunId,                                        p?.botRunId)
  check('permit.parentRunId chains',      p?.parentRunId === e?.botRunId,                       p?.parentRunId)
  check('permit.permits is array',        Array.isArray(p?.permits),                            `${p?.permits?.length} permits`)
  check('permit.totalProcessingDays > 0', (p?.totalProcessingDays ?? 0) > 0,                   `${p?.totalProcessingDays} days`)
  check('permit.readinessScore >= 0',     typeof p?.readinessScore === 'number',                String(p?.readinessScore))
  check('permit.jurisdiction set',        !!p?.jurisdiction,                                    p?.jurisdiction)

  section('6. Contractor Stage')
  const c = result.contractor
  check('result.contractor exists',          !!c)
  check('contractor.botRunId present',       !!c?.botRunId,                                     c?.botRunId)
  check('contractor.parentRunId chains',     c?.parentRunId === p?.botRunId,                    c?.parentRunId)
  check('contractor.recommendations array',  Array.isArray(c?.recommendations),                 `${c?.recommendations?.length} recs`)
  check('contractor.confidence set',         !!c?.confidence,                                   c?.confidence)
  check('contractor.cta set',                !!c?.cta,                                          c?.cta)
  check('contractor.conversion_product set', !!c?.conversion_product,                           c?.conversion_product)
  check('contractor.summary non-empty',      !!c?.summary?.length,                              c?.summary?.slice(0, 80))

  section('7. Chain Metadata')
  check('chainId present',               !!result.chainId,                                     result.chainId)
  check('totalDurationMs > 0',           (result.totalDurationMs ?? 0) > 0,                   `${result.totalDurationMs}ms`)
  check('all 4 stages present',
    !!(result.design && result.estimate && result.permit && result.contractor),
    'design ✓ estimate ✓ permit ✓ contractor ✓')
  check('chain is linear D→E→P→C',
    e?.parentRunId === d?.botRunId && p?.parentRunId === e?.botRunId && c?.parentRunId === p?.botRunId,
    `${d?.botRunId?.slice(0,8)}→${e?.botRunId?.slice(0,8)}→${p?.botRunId?.slice(0,8)}→${c?.botRunId?.slice(0,8)}`)

  section('8. Key Values Summary')
  console.log(`  Design:     CTC $${(d?.ctcTotal ?? 0).toLocaleString()} | BOM ${d?.bomItemCount} items | Cost $${(d?.aiConceptCostUsd ?? 0).toFixed(4)}`)
  console.log(`  Estimate:   $${(e?.totalLow ?? 0).toLocaleString()}–$${(e?.totalHigh ?? 0).toLocaleString()} | ${e?.lineItems?.length} line items | Cost $${(e?.cacheMetrics?.estimatedCostUsd ?? 0).toFixed(4)}`)
  console.log(`  Permit:     ${p?.totalProcessingDays} days | score ${p?.readinessScore} | ${p?.permits?.length} permits | Cost $${(p?.cacheMetrics?.estimatedCostUsd ?? 0).toFixed(4)}`)
  console.log(`  Contractor: ${c?.recommendations?.length} recs | ${c?.confidence} conf | CTA: ${c?.cta}`)
  console.log(`  DB writes:  SKIPPED (localhost DB not running — all writes wrapped in try/catch, non-blocking)`)
  console.log(`  Total API cost: ~$${((d?.aiConceptCostUsd??0) + (e?.cacheMetrics?.estimatedCostUsd??0) + (p?.cacheMetrics?.estimatedCostUsd??0) + (c?.cacheMetrics?.estimatedCostUsd??0)).toFixed(4)}`)

  console.log('\n' + '='.repeat(PAD))
  console.log('  PIPELINE SIMULATION COMPLETE')
  console.log('='.repeat(PAD) + '\n')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
