#!/usr/bin/env node
/**
 * Start Kealee weekly marketing campaign (generate + send today).
 *
 * Usage:
 *   node scripts/start-marketing-campaign.mjs
 *   node scripts/start-marketing-campaign.mjs --dry-run
 *   node scripts/start-marketing-campaign.mjs --generate-only
 *
 * Env: NEXT_PUBLIC_SITE_URL or BASE_URL, CRON_SECRET (or MARKETING_BOT_API_KEY)
 */

const base =
  process.env.BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'http://localhost:3000'

const secret =
  process.env.CRON_SECRET ??
  process.env.KEALEE_OPS_SECRET ??
  process.env.MARKETING_BOT_API_KEY

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const generateOnly = args.includes('--generate-only')

async function main() {
  if (!secret) {
    console.error('Set CRON_SECRET or MARKETING_BOT_API_KEY')
    process.exit(1)
  }

  const res = await fetch(`${base.replace(/\/$/, '')}/api/marketing/campaign/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      generate: true,
      send: !generateOnly,
      dryRun,
      forceGenerate: args.includes('--force'),
    }),
  })

  const json = await res.json()
  console.log(JSON.stringify(json, null, 2))
  if (!res.ok) process.exit(1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
