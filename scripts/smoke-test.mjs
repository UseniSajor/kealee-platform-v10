#!/usr/bin/env node

/**
 * Production Smoke Test
 * Runs after deploy to verify critical endpoints are responding.
 * Called by .github/workflows/ci.yml Gate 4.
 */

const API_URL = process.env.API_URL || 'https://api.kealee.com'
const TIMEOUT_MS = 10_000

const tests = [
  { name: 'Health check', path: '/health', expect: 200 },
  { name: 'API root', path: '/', expect: [200, 404] },
  { name: 'Funnel sessions endpoint', path: '/funnel/sessions', method: 'POST', body: {}, expect: [200, 201] },
]

let passed = 0
let failed = 0

async function runTest(test) {
  const url = `${API_URL}${test.path}`
  const method = test.method || 'GET'

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const options = {
      method,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    }

    if (test.body) {
      options.body = JSON.stringify(test.body)
    }

    const res = await fetch(url, options)
    clearTimeout(timeout)

    const expectedStatuses = Array.isArray(test.expect) ? test.expect : [test.expect]

    if (expectedStatuses.includes(res.status)) {
      console.log(`  ✓ ${test.name} — ${method} ${test.path} → ${res.status}`)
      passed++
    } else {
      console.error(`  ✗ ${test.name} — ${method} ${test.path} → ${res.status} (expected ${expectedStatuses.join(' or ')})`)
      failed++
    }
  } catch (err) {
    console.error(`  ✗ ${test.name} — ${method} ${test.path} → ${err.message}`)
    failed++
  }
}

async function main() {
  console.log(`\nSmoke testing: ${API_URL}\n`)

  for (const test of tests) {
    await runTest(test)
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

main()
