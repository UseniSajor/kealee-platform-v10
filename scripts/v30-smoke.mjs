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

  if (apiStatus.json?.enabled) {
    const quoteRes = await fetch(`${WEB}/api/v30/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath: 'kitchen_remodel', answers: sampleIntake }),
      signal: AbortSignal.timeout(30_000),
    })
    const quoteJson = await quoteRes.json().catch(() => ({}))
    checks.push({
      name: 'WEB /api/v30/intake quote',
      pass: quoteRes.ok && quoteJson?.package?.totalPrice > 0,
      detail: quoteRes.ok ? `$${quoteJson.package.totalPrice}` : quoteJson.error,
    })
  } else {
    checks.push({
      name: 'WEB /api/v30/intake quote',
      pass: true,
      detail: 'skipped — v30 disabled on API (set KEALEE_V30_ENABLED=true)',
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
