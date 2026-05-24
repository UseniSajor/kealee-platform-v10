#!/usr/bin/env node
/**
 * Generate homepage + product card media via web-main API.
 *
 *   node scripts/generate-card-media.mjs --scope=home
 *   node scripts/generate-card-media.mjs --scope=product --skip-video
 *   node scripts/generate-card-media.mjs --dry-run
 */

import { loadWebMainEnv } from './load-env.mjs'
loadWebMainEnv()

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const secret = process.env.CRON_SECRET ?? process.env.MARKETING_BOT_API_KEY

const args = process.argv.slice(2)
const scopeArg = args.find((a) => a.startsWith('--scope='))?.split('=')[1] ?? 'all'
const dryRun = args.includes('--dry-run')
const skipVideo = args.includes('--skip-video')

if (!secret && !dryRun) {
  console.error('Set CRON_SECRET or MARKETING_BOT_API_KEY')
  process.exit(1)
}

const res = await fetch(`${base}/api/marketing/card-media/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-cron-secret': secret ?? '',
  },
  body: JSON.stringify({ scope: scopeArg, dryRun, skipVideo }),
})

const json = await res.json().catch(() => ({}))
console.log(JSON.stringify(json, null, 2))
process.exit(res.ok ? 0 : 1)
