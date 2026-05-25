#!/usr/bin/env node
/**
 * Verify SUPABASE_SERVICE_ROLE_KEY (and related Supabase env) on Vercel
 * for kealee-web-main and kealee-portal-owner — Production + Preview.
 *
 * Uses Vercel REST API (requires VERCEL_TOKEN).
 * Create token: https://vercel.com/account/tokens
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node scripts/verify-vercel-supabase-service-role.mjs
 *   pnpm run verify:vercel-supabase
 */

const TEAM_ID = process.env.VERCEL_TEAM_ID ?? 'team_0fysx1qe1pHEgsZ3mMpMQ7mF'

const PROJECTS = [
  {
    name: 'kealee-web-main',
    id: process.env.VERCEL_WEB_MAIN_PROJECT_ID ?? 'prj_RhuCu2Um0yeGa1MOO0OPIWYoEqeA',
    dashboard: 'https://vercel.com/kealee/kealee-web-main/settings/environment-variables',
    vars: [
      { key: 'SUPABASE_SERVICE_ROLE_KEY', targets: ['production', 'preview'], required: true },
      { key: 'NEXT_PUBLIC_SUPABASE_URL', targets: ['production', 'preview'], required: true },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', targets: ['production', 'preview'], required: true },
      { key: 'NEXT_PUBLIC_OWNER_PORTAL_URL', targets: ['production', 'preview'], required: true },
    ],
  },
  {
    name: 'kealee-portal-owner',
    id: process.env.VERCEL_PORTAL_OWNER_PROJECT_ID ?? 'prj_6WZI4qeXe5noLL00iUY6YnfnzLGt',
    dashboard: 'https://vercel.com/kealee/kealee-portal-owner/settings/environment-variables',
    vars: [
      { key: 'SUPABASE_SERVICE_ROLE_KEY', targets: ['production', 'preview'], required: true },
      { key: 'NEXT_PUBLIC_SUPABASE_URL', targets: ['production', 'preview'], required: true },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', targets: ['production', 'preview'], required: true },
      { key: 'NEXT_PUBLIC_OWNER_PORTAL_URL', targets: ['production', 'preview'], required: true },
      { key: 'RESEND_API_KEY', targets: ['production', 'preview'], required: false },
    ],
  },
]

const PLACEHOLDER_PATTERNS = [
  /^$/,
  /placeholder/i,
  /your[-_]?project/i,
  /replace_me/i,
  /local_dev_stub/i,
  /your[-_]?service[-_]?role/i,
  /^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.local_dev/i,
]

const OWNER_PORTAL_OK = 'https://owner.kealee.com'
const WRONG_PORTAL = /^https?:\/\/(www\.)?kealee\.com\/?$/i

function isPlaceholder(value) {
  if (value == null || typeof value !== 'string') return false
  const v = value.trim()
  return PLACEHOLDER_PATTERNS.some(p => p.test(v))
}

function validateValue(key, value) {
  if (!value) return null
  if (isPlaceholder(value)) return 'placeholder or empty value'
  if (key === 'NEXT_PUBLIC_OWNER_PORTAL_URL' && WRONG_PORTAL.test(value.replace(/\/$/, ''))) {
    return `must be ${OWNER_PORTAL_OK}, not kealee.com`
  }
  if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !value.includes('supabase.co')) {
    return 'expected *.supabase.co URL'
  }
  if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !value.startsWith('eyJ')) {
    return 'expected JWT-shaped service role key (eyJ...)'
  }
  return null
}

async function fetchProjectEnvs(projectId, token) {
  const url = `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${TEAM_ID}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Vercel API ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.envs ?? data ?? []
}

/** @returns {Map<string, { targets: Set<string>, value?: string, type?: string }>} */
function indexEnvs(envRows) {
  const map = new Map()
  for (const row of envRows) {
    const key = row.key
    if (!key) continue
    const entry = map.get(key) ?? { targets: new Set(), value: undefined, type: row.type }
    for (const t of row.target ?? []) entry.targets.add(t)
    if (row.value != null && row.value !== '') entry.value = row.value
    if (row.type) entry.type = row.type
    map.set(key, entry)
  }
  return map
}

function checkProject(project, envIndex) {
  const lines = []
  let failed = 0

  for (const spec of project.vars) {
    const entry = envIndex.get(spec.key)
    for (const target of spec.targets) {
      const label = `${spec.key} @ ${target}`
      if (!entry) {
        if (spec.required) {
          lines.push({ ok: false, msg: `MISSING  ${label}` })
          failed++
        } else {
          lines.push({ ok: null, msg: `optional missing ${label}` })
        }
        continue
      }
      if (!entry.targets.has(target)) {
        if (spec.required) {
          lines.push({ ok: false, msg: `MISSING  ${label} (defined for: ${[...entry.targets].join(', ') || 'none'})` })
          failed++
        }
        continue
      }
      const valueErr = validateValue(spec.key, entry.value)
      if (valueErr) {
        lines.push({ ok: false, msg: `BAD     ${label} — ${valueErr}` })
        failed++
        continue
      }
      const typeHint = entry.type === 'encrypted' || entry.type === 'secret' ? ' (encrypted)' : ''
      lines.push({ ok: true, msg: `OK      ${label}${typeHint}` })
    }
  }
  return { lines, failed }
}

async function main() {
  const token = process.env.VERCEL_TOKEN?.trim()
  console.log('\nVercel Supabase service-role check (Production + Preview)\n')

  if (!token) {
    console.error('VERCEL_TOKEN is not set.\n')
    console.error('1. Create a token: https://vercel.com/account/tokens')
    console.error('2. Run:')
    console.error('   PowerShell:  $env:VERCEL_TOKEN = "your_token"')
    console.error('   pnpm run verify:vercel-supabase\n')
    console.error('Manual dashboard:')
    for (const p of PROJECTS) {
      console.error(`  ${p.name}: ${p.dashboard}`)
      console.error(`    → SUPABASE_SERVICE_ROLE_KEY for Production and Preview\n`)
    }
    process.exit(2)
  }

  let totalFailed = 0

  for (const project of PROJECTS) {
    console.log('─'.repeat(60))
    console.log(`Project: ${project.name}`)
    console.log(`Dashboard: ${project.dashboard}`)
    try {
      const rows = await fetchProjectEnvs(project.id, token)
      const index = indexEnvs(rows)
      const { lines, failed } = checkProject(project, index)
      for (const line of lines) {
        const prefix = line.ok === true ? '  ✓' : line.ok === false ? '  ✗' : '  ·'
        console.log(prefix, line.msg)
      }
      totalFailed += failed
      if (failed === 0) {
        console.log('  → All required Supabase env vars present for Production + Preview')
      }
    } catch (err) {
      console.error('  ✗', err.message)
      totalFailed++
    }
    console.log('')
  }

  console.log('─'.repeat(60))
  if (totalFailed > 0) {
    console.error(`Failed: ${totalFailed} issue(s). Fix in Vercel → Settings → Environment Variables, then redeploy.\n`)
    process.exit(1)
  }
  console.log('All checks passed. Redeploy web-main + portal-owner if you changed env recently.\n')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
