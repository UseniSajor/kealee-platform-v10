#!/usr/bin/env node
/**
 * Launch parcel marketing automation — steps 1–5:
 * 1. Apply Supabase migration
 * 2. Seed DMV residential parcels + queue direct mail
 * 3. Set Railway env (PARCEL_USE_LOCAL_ASSESSOR, SKIP_TRACE placeholders)
 * 4. Ensure cron services exist (prints Railway dashboard instructions)
 * 5. Export direct-mail CSV
 */

import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

function run(cmd, label) {
  console.log(`\n=== ${label} ===`)
  console.log(cmd)
  execSync(cmd, { cwd: repoRoot, stdio: 'inherit' })
}

async function setRailwayParcelEnv() {
  console.log('\n=== Step 3: Railway env (parcel outreach) ===')
  try {
    execSync('railway variables --service web-main --set "PARCEL_USE_LOCAL_ASSESSOR=true"', {
      cwd: repoRoot,
      stdio: 'inherit',
    })
    console.log('  Set PARCEL_USE_LOCAL_ASSESSOR=true on web-main')
  } catch (e) {
    console.warn('  railway set failed:', e.message?.slice?.(0, 80))
  }
  console.log('  Optional later: PARCEL_ASSESSOR_API_URL, SKIP_TRACE_API_URL, SKIP_TRACE_API_KEY')
}

function printCronInstructions() {
  console.log(`
=== Step 3b: Railway cron services ===
Create these services (root directory = services/<name>) if missing:
  - marketing-cron-parcel-enrichment  (cron: 0 12 * * *)
  - marketing-cron-parcel-outreach    (cron: 0 13 * * *)
  - marketing-cron-marketing-drip     (cron: 0 14 * * *)

Each needs: CRON_SECRET, APP_URL (https://kealee.com or your Railway web-main URL)
Sync env: .\\scripts\\railway-sync-web-main-marketing-env.ps1
`)
}

async function main() {
  run('node scripts/apply-supabase-sql.mjs', 'Step 1: Supabase migration')
  run('node scripts/seed-parcel-outreach.mjs', 'Step 2: Seed DMV parcels')
  await setRailwayParcelEnv()
  printCronInstructions()
  run('node scripts/export-direct-mail-queue.mjs', 'Step 5: Export direct mail CSV')
  console.log('\n[launch-parcel-marketing] complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
