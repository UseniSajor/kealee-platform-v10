#!/usr/bin/env node
/**
 * Setup + run card media pipeline.
 * - Loads .env.local / Vercel env
 * - Creates Supabase bucket when configured
 * - AI generation when OPENAI_API_KEY or REPLICATE_API_TOKEN set
 * - Otherwise syncs curated fallbacks into public/media + manifest.json
 */
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadWebMainEnv } from './load-env.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(root, '../..')

loadWebMainEnv()

const args = process.argv.slice(2)
const scope = args.find((a) => a.startsWith('--scope='))?.split('=')[1] ?? 'all'
const skipVideo = args.includes('--skip-video')
const forceAi = args.includes('--force-ai')

console.log('\n── Card media setup ──\n')

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const hasImage = Boolean(process.env.OPENAI_API_KEY || process.env.REPLICATE_API_TOKEN)
const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY)

console.log(`  Supabase:      ${hasSupabase ? 'yes' : 'no (will save to public/media/)'}`)
console.log(`  Image AI:      ${hasImage ? 'yes' : 'no (fallback sync)'}`)
console.log(`  MarketingBot:  ${hasAnthropic ? 'yes' : 'no'}`)
console.log(`  Scope:         ${scope}`)
console.log(`  Skip video:    ${skipVideo}\n`)

if (hasSupabase) {
  const bucket = spawnSync('node', ['scripts/ensure-marketing-media-bucket.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  if (bucket.status !== 0) {
    console.warn('Bucket setup failed — continuing with local public/media/ storage')
  }
}

const cliArgs = ['exec', 'tsx', 'scripts/run-card-media-cli.ts', `--scope=${scope}`]
if (skipVideo) cliArgs.push('--skip-video')
if (!hasImage && !forceAi) {
  cliArgs.push('--fallback-only')
  if (!skipVideo) cliArgs.push('--with-videos')
}

const run = spawnSync('pnpm', cliArgs, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, TSX_TSCONFIG_PATH: join(root, 'tsconfig.json') },
  shell: true,
})

process.exit(run.status ?? 1)
