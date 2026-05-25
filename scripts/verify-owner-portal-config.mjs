#!/usr/bin/env node
/**
 * Verify owner portal URL env + optional Supabase redirect hint.
 * Usage: node scripts/verify-owner-portal-config.mjs
 */

const OWNER = 'https://owner.kealee.com'
const WRONG = ['https://kealee.com', 'http://kealee.com']

function checkEnv(name, value) {
  if (!value) return { ok: false, msg: `${name} not set` }
  const v = value.replace(/\/$/, '')
  if (WRONG.some(w => v === w || v.startsWith(w + '/'))) {
    return { ok: false, msg: `${name}=${value} (should be ${OWNER})` }
  }
  if (!v.includes('owner.kealee.com') && !v.includes('localhost')) {
    return { ok: false, msg: `${name}=${value} (unexpected host)` }
  }
  return { ok: true, msg: `${name}=${v}` }
}

const portalUrl = process.env.NEXT_PUBLIC_OWNER_PORTAL_URL
const appUrl = process.env.NEXT_PUBLIC_APP_URL

console.log('Owner portal config check\n')

const checks = [
  checkEnv('NEXT_PUBLIC_OWNER_PORTAL_URL', portalUrl || OWNER),
]
if (appUrl) checks.push(checkEnv('NEXT_PUBLIC_APP_URL (portal-owner)', appUrl))

let failed = 0
for (const c of checks) {
  console.log(c.ok ? '  OK  ' : ' FAIL ', c.msg)
  if (!c.ok) failed++
}

console.log('\nManual (required if magic links hit kealee.com):')
console.log('  Supabase → Authentication → URL Configuration → Redirect URLs')
console.log('  Add: https://owner.kealee.com/**')
console.log('  Doc: docs/runbooks/owner-portal-auth-redirects.md\n')

process.exit(failed > 0 ? 1 : 0)
