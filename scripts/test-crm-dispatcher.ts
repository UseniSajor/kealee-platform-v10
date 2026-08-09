/**
 * scripts/test-crm-dispatcher.ts
 *
 * Test script to verify the budget parser and CRM dispatcher logic.
 *
 * Usage:
 *   npx tsx scripts/test-crm-dispatcher.ts
 */

import { parseBudgetRange } from '../apps/web-main/lib/marketing/crm-dispatcher'

async function runTests() {
  console.log('🧪 Running CRM Dispatcher & Budget Parser Tests...\n')

  const budgetCases = [
    { input: '$5,000 - $10,000', expected: 5000 },
    { input: '10k-20k', expected: 10000 },
    { input: 'under 50k', expected: 50000 },
    { input: '$15,000', expected: 15000 },
    { input: '15000', expected: 15000 },
    { input: '  $ 30k   ', expected: 30000 },
    { input: '100k - 200k', expected: 100000 },
    { input: 'not provided', expected: undefined },
    { input: '', expected: undefined },
    { input: null, expected: undefined },
    { input: undefined, expected: undefined },
    { input: 25000, expected: 25000 },
  ]

  let passed = 0
  let failed = 0

  console.log('--- 1. Testing Budget Range Parser ---')
  for (const tc of budgetCases) {
    const result = parseBudgetRange(tc.input)
    if (result === tc.expected) {
      console.log(`  ✓ Input: "${tc.input}" → ${result} (Expected: ${tc.expected})`)
      passed++
    } else {
      console.error(`  ✗ Input: "${tc.input}" → ${result} (Expected: ${tc.expected})`)
      failed++
    }
  }

  console.log('\n--- 2. Checking CRM Configuration Status ---')
  const hubspotKey = process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_ACCESS_TOKEN
  const ghlKey = process.env.GHL_API_KEY
  const ghlLocation = process.env.GHL_LOCATION_ID
  const ghlEnabled = process.env.GHL_ENABLED !== 'false' && process.env.GHL_ENABLED !== '0' && !!(ghlKey && ghlLocation)

  console.log(`  HubSpot Key configured:  ${hubspotKey ? '✅ YES' : '❌ NO'}`)
  console.log(`  GHL Key configured:      ${ghlKey ? '✅ YES' : '❌ NO'}`)
  console.log(`  GHL Location configured: ${ghlLocation ? '✅ YES' : '❌ NO'}`)
  console.log(`  GHL Enabled status:      ${ghlEnabled ? '✅ YES' : '❌ NO (Default: legacy disabled)'}`)

  console.log(`\nTests Completed: ${passed} passed, ${failed} failed.`)
  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(err => {
  console.error('Test run failed:', err)
  process.exit(1)
})
