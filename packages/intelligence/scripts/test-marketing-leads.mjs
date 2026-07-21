#!/usr/bin/env node
/**
 * Run marketing + lead intelligence agent scenarios.
 * Usage: node scripts/test-marketing-leads.mjs
 */
import { MARKETING_LEAD_SCENARIOS } from '../dist/fixtures/marketing-lead-scenarios.js'
import { runAllMarketingLeadScenarios } from '../dist/pipeline/marketing-lead-pipeline.js'

const results = await runAllMarketingLeadScenarios(MARKETING_LEAD_SCENARIOS)

let passed = 0
let failed = 0

console.log('\nKealee Intelligence — Marketing & Lead Agent Tests\n')
console.log('='.repeat(72))

for (const r of results) {
  const icon = r.passed ? 'PASS' : 'FAIL'
  if (r.passed) passed++
  else failed++

  console.log(`\n[${icon}] ${r.label} (${r.scenarioId})`)
  console.log(`  Segment:    ${r.marketing.audienceSegment}`)
  console.log(`  Score:      ${r.opportunity.totalOpportunityScore} (${r.opportunity.recommendedPriority})`)
  console.log(`  Channel:    ${r.marketing.recommendedChannel}`)
  console.log(`  Routed:     ${r.routing.routed}`)
  console.log(`  CRM score:  ${r.opportunity.crmUpdates?.lead_score ?? 'n/a'}`)
  console.log(`  Review:     ${r.humanReviewRequired ? r.reviewReasons.join(', ') : 'none'}`)
  if (!r.passed) {
    for (const e of r.errors) console.log(`  ERROR: ${e}`)
  }
}

console.log('\n' + '='.repeat(72))
console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total\n`)
process.exit(failed > 0 ? 1 : 0)
