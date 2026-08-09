#!/usr/bin/env node
/**
 * Marketing funnel smoke test (production or local).
 *
 * Usage:
 *   APP_URL=https://kealee.com CRON_SECRET=... node scripts/marketing-e2e-smoke.mjs
 *   pnpm run test:marketing-e2e
 */

const APP_URL = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://kealee.com').replace(/\/$/, '')
const CRON_SECRET = process.env.CRON_SECRET ?? process.env.KEALEE_OPS_SECRET ?? ''

const results = []

function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`)
}

function skip(name, detail = '') {
  results.push({ name, ok: null, detail })
  console.log(`⏭️  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function fetchStatus(url, init = {}) {
  const res = await fetch(url, { ...init, redirect: 'follow' })
  const text = await res.text().catch(() => '')
  return { status: res.status, text: text.slice(0, 500) }
}

async function main() {
  console.log(`\nMarketing E2E smoke — ${APP_URL}\n`)

  // 1. Landing pages
  for (const path of ['/get-concept', '/concept-package', '/book-a-call']) {
    try {
      const { status } = await fetchStatus(`${APP_URL}${path}`)
      if (status === 200) pass(`GET ${path}`, String(status))
      else fail(`GET ${path}`, `HTTP ${status}`)
    } catch (e) {
      fail(`GET ${path}`, e instanceof Error ? e.message : String(e))
    }
  }

  // 2. Soft capture
  try {
    const { status, text } = await fetchStatus(`${APP_URL}/api/intake/soft-capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `smoke+${Date.now()}@kealee.test`,
        name: 'Smoke Test',
        service: 'kitchen_remodel',
        source: 'marketing-e2e-smoke',
        utm_source: 'smoke',
        utm_medium: 'test',
        utm_campaign: 'e2e',
      }),
    })
    if (status >= 200 && status < 300) pass('POST /api/intake/soft-capture', String(status))
    else fail('POST /api/intake/soft-capture', `HTTP ${status} ${text}`)
  } catch (e) {
    fail('POST /api/intake/soft-capture', e instanceof Error ? e.message : String(e))
  }

  // 3. Cron endpoints
  const crons = [
    { path: '/api/cron/lead-scoring', method: 'GET' },
    { path: '/api/cron/sequences', method: 'GET' },
    { path: '/api/cron/requalify-cold', method: 'GET' },
    { path: '/api/cron/marketing-drip', method: 'GET' },
    { path: '/api/cron/parcel-enrichment', method: 'POST' },
    { path: '/api/cron/parcel-outreach', method: 'POST' },
  ]

  for (const { path, method } of crons) {
    try {
      const { status, text } = await fetchStatus(`${APP_URL}${path}`, { method })
      if (status === 401) {
        pass(`${method} ${path} auth gate`, '401 without secret (expected)')
      } else if (status === 405) {
        fail(`${method} ${path}`, '405 — route not deployed or method missing (redeploy web-main)')
      } else if (status >= 500) {
        fail(`${method} ${path}`, `HTTP ${status} — check CRON_SECRET + Supabase tables`)
      } else if (status >= 200 && status < 300) {
        pass(`${method} ${path}`, String(status))
      } else {
        fail(`${method} ${path}`, `HTTP ${status} ${text}`)
      }
    } catch (e) {
      fail(`${method} ${path}`, e instanceof Error ? e.message : String(e))
    }
  }

  if (CRON_SECRET) {
    for (const { path, method } of crons) {
      try {
        const { status, text } = await fetchStatus(`${APP_URL}${path}`, {
          method,
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        })
        if (status >= 200 && status < 300) pass(`${method} ${path} (authed)`, String(status))
        else fail(`${method} ${path} (authed)`, `HTTP ${status} ${text}`)
      } catch (e) {
        fail(`${method} ${path} (authed)`, e instanceof Error ? e.message : String(e))
      }
    }
  } else {
    skip('Authenticated cron checks', 'Set CRON_SECRET to run')
  }

  // 4. Contact form rejects when Resend missing (503) or succeeds
  try {
    const { status } = await fetchStatus(`${APP_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke',
        email: 'smoke@kealee.test',
        subject: 'E2E',
        message: 'Automated smoke test — ignore',
      }),
    })
    if (status === 200) pass('POST /api/contact', 'Resend configured')
    else if (status === 503) pass('POST /api/contact', '503 when Resend missing (correct)')
    else fail('POST /api/contact', `HTTP ${status}`)
  } catch (e) {
    fail('POST /api/contact', e instanceof Error ? e.message : String(e))
  }

  const failed = results.filter((r) => r.ok === false)
  const passed = results.filter((r) => r.ok === true)
  console.log(`\n${passed.length} passed, ${failed.length} failed, ${results.length - passed.length - failed.length} skipped\n`)
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
