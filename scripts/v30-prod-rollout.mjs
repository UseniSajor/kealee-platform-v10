#!/usr/bin/env node
/**
 * Production rollout for v30 (ops 1–4): migrate, env check, smoke.
 * Usage: node scripts/v30-prod-rollout.mjs [--skip-migrate] [--api URL] [--web URL]
 */
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const skipMigrate = process.argv.includes('--skip-migrate')
const api = process.argv.includes('--api')
  ? process.argv[process.argv.indexOf('--api') + 1]
  : process.env.INTERNAL_API_URL || process.env.API_URL
const web = process.argv.includes('--web')
  ? process.argv[process.argv.indexOf('--web') + 1]
  : process.env.WEB_MAIN_URL || 'http://localhost:3000'

function run(cmd, args, cwd = root) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true })
    p.on('close', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))))
  })
}

async function main() {
  console.log('Kealee v30 production rollout\n')

  if (!skipMigrate) {
    console.log('── 1. Database migrate ──')
    await run('npx', ['prisma', 'migrate', 'deploy'], path.join(root, 'packages', 'database'))
  } else {
    console.log('── 1. Migrate skipped ──')
  }

  console.log('\n── 2. Env check ──')
  process.env.INTERNAL_API_URL = api
  await run('node', ['scripts/v30-setup-check.mjs'])

  console.log('\n── 3. Stripe ──')
  console.log('Confirm production webhook: checkout.session.completed')
  console.log('Metadata: source=public_intake_v30 for v30 checkout')

  console.log('\n── 4. Smoke ──')
  await run('node', ['scripts/v30-smoke.mjs', '--api', api, '--web', web])

  console.log('\n✓ Rollout script finished. Enable on Vercel/Railway:')
  console.log('  KEALEE_V30_ENABLED=true')
  console.log('  NEXT_PUBLIC_KEALEE_V30_ENABLED=true')
  console.log('  REPLICATE_API_TOKEN=... (images; Pascal is editor-only)')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
