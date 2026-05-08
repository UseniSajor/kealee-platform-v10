#!/usr/bin/env node
/**
 * Call production (or any) web-main intake diagnostics after a test purchase.
 *
 * Usage:
 *   BASE_URL=https://kealee.com INTAKE_ID=<uuid> KEALEE_OPS_SECRET=<secret> node scripts/smoke-intake-diagnostics.mjs
 *
 * Get INTAKE_ID from the success URL: /intake/<path>/success?...&intakeId=<uuid>
 */

const base = process.env.BASE_URL ?? ''
const intakeId = process.env.INTAKE_ID ?? ''
const secret = process.env.KEALEE_OPS_SECRET ?? ''

if (!base || !intakeId || !secret) {
  console.error('Missing env: BASE_URL, INTAKE_ID, and KEALEE_OPS_SECRET are required.')
  process.exit(1)
}

const url = new URL('/api/intake/diagnostics', base.replace(/\/$/, ''))
url.searchParams.set('intakeId', intakeId)

const res = await fetch(url.toString(), {
  headers: { 'x-kealee-ops': secret },
})

const text = await res.text()
let body
try {
  body = JSON.parse(text)
} catch {
  body = text
}

console.log('HTTP', res.status)
console.log(JSON.stringify(body, null, 2))

if (!res.ok) process.exit(1)

if (body?.hasConceptOutput) {
  console.error('\nOK: concept output present on intake record.')
  process.exit(0)
}

console.error(
  '\nNo conceptOutput on this intake yet. If status is "paid", wait and re-run, or check Stripe webhooks and Vercel logs for /api/concept/generate.'
)
if (body?.status === 'new') {
  console.error('Status is still "new" — checkout may not have completed or webhook did not mark paid.')
}
process.exit(2)