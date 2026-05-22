#!/usr/bin/env node
/**
 * P0 ops checklist — verifies env + API v30 status (items 1–4).
 */
const checks = []

function env(name) {
  const v = process.env[name]
  checks.push({ name: `env:${name}`, pass: Boolean(v?.trim()), value: v ? '(set)' : '(missing)' })
}

env('DATABASE_URL')
env('KEALEE_V30_ENABLED')
env('NEXT_PUBLIC_KEALEE_V30_ENABLED')
env('KEALEE_V30_PUBLIC_USER_ID')
env('ANTHROPIC_API_KEY')
env('INTERNAL_API_URL')
env('STRIPE_WEBHOOK_SECRET')

const api = process.env.INTERNAL_API_URL || process.env.API_URL || 'http://localhost:3001'

async function apiCheck() {
  try {
    const res = await fetch(`${api.replace(/\/$/, '')}/v30/status`, { signal: AbortSignal.timeout(10_000) })
    const json = await res.json()
    checks.push({
      name: 'API /v30/status',
      pass: res.ok && json.enabled === true,
      value: JSON.stringify(json),
    })
  } catch (e) {
    checks.push({ name: 'API /v30/status', pass: false, value: String(e) })
  }
}

await apiCheck()

let failed = 0
console.log('Kealee v30 setup check\n')
for (const c of checks) {
  console.log(`${c.pass ? '✓' : '✗'} ${c.name} ${c.value}`)
  if (!c.pass) failed++
}
console.log(failed ? `\n${failed} issue(s) — see DEPLOY-RUNBOOK.md` : '\nReady for pnpm v30:migrate && pnpm v30:smoke')
process.exit(failed ? 1 : 0)
