#!/usr/bin/env node
/**
 * Deploy Marketing Agency layer:
 * 1. Apply Supabase migrations (agency tables + intelligence RLS)
 * 2. Optionally provision Zem + Kealee admin users
 * 3. Print production env checklist
 *
 * Usage:
 *   node scripts/deploy-marketing-agency.mjs
 *   node scripts/deploy-marketing-agency.mjs --provision-users
 *   node scripts/deploy-marketing-agency.mjs --skip-migrations
 */

import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const MIGRATIONS = [
  'packages/database/supabase/migrations/20260701_marketing_agency_layer.sql',
  'packages/database/supabase/migrations/20260702_intelligence_rls.sql',
]

const args = new Set(process.argv.slice(2))
const provisionUsers = args.has('--provision-users')
const skipMigrations = args.has('--skip-migrations')

function run(cmd, label) {
  console.log(`\n[deploy-marketing-agency] ${label}`)
  execSync(cmd, { cwd: repoRoot, stdio: 'inherit', env: process.env })
}

function printEnvChecklist() {
  console.log(`
=== Railway / Vercel env checklist (web-main) ===

Required:
  CRON_SECRET                    # production cron Bearer auth
  REPLICATE_API_TOKEN            # concept visual generation
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Marketing agency (default native drip — do NOT set enterprise flag yet):
  # KEALEE_ENTERPRISE_CRM_ENABLED=true   # only when GHL/HubSpot paid

Optional API access for Zem tools:
  MARKETING_API_KEYS=[{"key":"YOUR_KEY","role":"marketing_agency","label":"Zem"}]

Provision users (one-time, local — passwords via env):
  ZEM_AGENCY_EMAIL=zem-marketing@access.kealee.com
  ZEM_AGENCY_PASSWORD=<secure>
  KEALEE_MARKETING_ADMIN_EMAIL=marketing-admin@kealee.com
  KEALEE_MARKETING_ADMIN_PASSWORD=<secure>
  node scripts/provision-marketing-agency-users.mjs

URLs:
  Zem workspace:    https://kealee.com/marketing/workspace
  Kealee approvals: https://kealee.com/admin/marketing/approvals
`)
}

async function main() {
  if (!skipMigrations) {
    for (const file of MIGRATIONS) {
      run(`node scripts/apply-supabase-sql.mjs ${file}`, `migration ${path.basename(file)}`)
    }
  } else {
    console.log('[deploy-marketing-agency] skipping migrations')
  }

  if (provisionUsers) {
    run('node scripts/provision-marketing-agency-users.mjs', 'provision Supabase users')
  } else {
    console.log('\n[deploy-marketing-agency] skip user provision (pass --provision-users to create logins)')
  }

  printEnvChecklist()
  console.log('[deploy-marketing-agency] done')
}

main().catch((e) => {
  console.error('[deploy-marketing-agency]', e.message)
  process.exit(1)
})
