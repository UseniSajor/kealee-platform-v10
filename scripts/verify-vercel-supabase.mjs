#!/usr/bin/env node
/**
 * scripts/verify-vercel-supabase.mjs
 *
 * Checks that kealee-web-main and kealee-portal-owner have the correct
 * Supabase and portal-URL env vars set in Vercel.
 *
 * Exit codes:
 *   0  — all checks passed
 *   1  — one or more checks failed (printed to stderr)
 *   2  — VERCEL_TOKEN not set (prints dashboard links)
 *
 * Usage:
 *   VERCEL_TOKEN=<token> node scripts/verify-vercel-supabase.mjs
 *   # or via pnpm:
 *   pnpm run verify:vercel-supabase
 */

const TOKEN = process.env.VERCEL_TOKEN
const TEAM  = 'team_0fysx1qe1pHEgsZ3mMpMQ7mF'

const PROJECTS = [
  {
    name:  'kealee-web-main',
    id:    'prj_RhuCu2Um0yeGa1MOO0OPIWYoEqeA',
    dashboardUrl: 'https://vercel.com/kealee/kealee-web-main/settings/environment-variables',
    rules: [
      { key: 'SUPABASE_SERVICE_ROLE_KEY',    targets: ['production', 'preview'], secret: true },
      { key: 'NEXT_PUBLIC_SUPABASE_URL',     targets: ['production', 'preview'], secret: false, notContains: ['your-project', 'replace_me', 'local_dev_stub'] },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',targets: ['production', 'preview'], secret: true },
      { key: 'NEXT_PUBLIC_OWNER_PORTAL_URL', targets: ['production'],            secret: false, mustEqual: 'https://owner.kealee.com' },
      { key: 'NEXT_PUBLIC_APP_URL',          targets: ['production'],            secret: false, mustEqual: 'https://kealee.com' },
      { key: 'RESEND_API_KEY',               targets: ['production'],            secret: true },
      { key: 'ANTHROPIC_API_KEY',            targets: ['production'],            secret: true },
      { key: 'REPLICATE_API_TOKEN',          targets: ['production'],            secret: true },
    ],
  },
  {
    name: 'kealee-portal-owner',
    id:   'prj_6WZI4qeXe5noLL00iUY6YnfnzLGt',
    dashboardUrl: 'https://vercel.com/kealee/kealee-portal-owner/settings/environment-variables',
    rules: [
      { key: 'SUPABASE_SERVICE_ROLE_KEY',    targets: ['production', 'preview'], secret: true },
      { key: 'NEXT_PUBLIC_SUPABASE_URL',     targets: ['production', 'preview'], secret: false, notContains: ['your-project', 'replace_me', 'local_dev_stub'] },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',targets: ['production', 'preview'], secret: true },
      { key: 'NEXT_PUBLIC_OWNER_PORTAL_URL', targets: ['production'],            secret: false, mustEqual: 'https://owner.kealee.com', notContains: ['kealee.com/auth', 'kealee.com/deliverables'] },
      { key: 'NEXT_PUBLIC_APP_URL',          targets: ['production'],            secret: false, mustEqual: 'https://owner.kealee.com' },
      { key: 'RESEND_API_KEY',               targets: ['production'],            secret: true },
    ],
  },
]

const PLACEHOLDERS = ['your-project', 'replace_me', 'local_dev_stub', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...', 'placeholder']

// ── helpers ──────────────────────────────────────────────────────────────────

function pass(msg)  { console.log(`  ✅  ${msg}`) }
function fail(msg)  { console.error(`  ❌  ${msg}`) }
function warn(msg)  { console.warn( `  ⚠️   ${msg}`) }
function head(msg)  { console.log(`\n${msg}`) }

async function fetchEnvs(projectId) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${TEAM}&limit=200`,
    { headers: { Authorization: `Bearer ${TOKEN}` } },
  )
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`)
  const { envs } = await res.json()
  return envs ?? []
}

function isPlaceholder(value) {
  if (!value) return true
  const v = value.toLowerCase().trim()
  return PLACEHOLDERS.some(p => v.includes(p.toLowerCase()))
}

// ── main ─────────────────────────────────────────────────────────────────────

if (!TOKEN) {
  console.error('\n❌  VERCEL_TOKEN is not set.\n')
  console.error('Set it and re-run:\n  VERCEL_TOKEN=<token> pnpm run verify:vercel-supabase\n')
  console.error('Get your token at: https://vercel.com/account/tokens\n')
  for (const p of PROJECTS) {
    console.error(`  ${p.name} env vars: ${p.dashboardUrl}`)
  }
  process.exit(2)
}

let totalFails = 0

for (const project of PROJECTS) {
  head(`── ${project.name} ──────────────────────────────────`)

  let envs
  try {
    envs = await fetchEnvs(project.id)
  } catch (err) {
    fail(`Could not fetch envs: ${err.message}`)
    totalFails++
    continue
  }

  // Build a map: key → list of { target[], value (if plain) }
  const envMap = {}
  for (const e of envs) {
    const key = e.key
    if (!envMap[key]) envMap[key] = []
    envMap[key].push({
      targets: e.target ?? [],
      value:   e.type === 'encrypted' ? null : (e.value ?? ''),
      secret:  e.type === 'encrypted',
    })
  }

  for (const rule of project.rules) {
    const entries = envMap[rule.key] ?? []

    if (entries.length === 0) {
      fail(`${rule.key} — NOT SET`)
      totalFails++
      continue
    }

    // Check required targets
    const coveredTargets = new Set(entries.flatMap(e => e.targets))
    const missingTargets = rule.targets.filter(t => !coveredTargets.has(t))

    if (missingTargets.length > 0) {
      fail(`${rule.key} — missing targets: ${missingTargets.join(', ')}`)
      totalFails++
      continue
    }

    // For plain (non-secret) vars: check value quality
    let valueFailed = false
    for (const entry of entries) {
      if (entry.secret) continue  // can't inspect encrypted values

      if (rule.mustEqual && entry.value !== rule.mustEqual) {
        fail(`${rule.key} = "${entry.value}" — expected "${rule.mustEqual}"`)
        totalFails++
        valueFailed = true
        break
      }

      if (rule.notContains) {
        for (const bad of rule.notContains) {
          if ((entry.value ?? '').includes(bad)) {
            fail(`${rule.key} contains forbidden substring "${bad}" (value: "${entry.value}")`)
            totalFails++
            valueFailed = true
            break
          }
        }
        if (valueFailed) break
      }

      if (isPlaceholder(entry.value)) {
        fail(`${rule.key} appears to be a placeholder: "${entry.value}"`)
        totalFails++
        valueFailed = true
        break
      }
    }

    if (!valueFailed) {
      const targets = [...coveredTargets].join(', ')
      pass(`${rule.key} — set for [${targets}]`)
    }
  }
}

head('─────────────────────────────────────────────────────')
if (totalFails === 0) {
  console.log('\n✅  All Vercel + Supabase env var checks passed.\n')
  process.exit(0)
} else {
  console.error(`\n❌  ${totalFails} check(s) failed. Fix the above in Vercel dashboard:\n`)
  for (const p of PROJECTS) {
    console.error(`  ${p.name}: ${p.dashboardUrl}`)
  }
  console.error()
  process.exit(1)
}
