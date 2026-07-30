/**
 * One-off: regenerate the facade before/after images with the corrected
 * older-style-house prompt (product:facade in card-media-spec.ts).
 * Usage: pnpm exec tsx scripts/regen-facade-images.ts
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const webMainRoot = join(__dirname, '..')
for (const name of ['.env.local', '.env.vercel.production', '.env']) {
  const p = join(webMainRoot, name)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const key = t.slice(0, eq).trim()
    if (!process.env[key]) process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
}

async function main() {
  const { runCardMediaBatch } = await import('../lib/marketing/card-media-generator')
  const { manifest, results } = await runCardMediaBatch({
    keys: ['product:facade'],
    scope: 'product',
    skipVideo: true,
    force: true,
    useMarketingBot: Boolean(process.env.ANTHROPIC_API_KEY),
  })
  console.log(JSON.stringify(results, null, 2))
  console.log('manifest entry:', JSON.stringify(manifest.cards['product:facade'], null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
