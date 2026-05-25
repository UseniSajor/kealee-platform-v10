/**
 * Direct CLI — no dev server required.
 * Usage (from repo root):
 *   pnpm exec tsx apps/web-main/scripts/run-card-media-cli.ts --scope=home --skip-video
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

const args = process.argv.slice(2)
const scope = (args.find((a) => a.startsWith('--scope='))?.split('=')[1] ??
  'all') as 'home' | 'product' | 'all'
const dryRun = args.includes('--dry-run')
const skipVideo = args.includes('--skip-video')
const fallbackOnly = args.includes('--fallback-only')
const withVideos = args.includes('--with-videos') || (!skipVideo && fallbackOnly)

async function main() {
  const { syncFallbackCardMedia } = await import('../lib/marketing/card-media-sync-fallbacks')

  if (fallbackOnly) {
    const { manifest, count } = await syncFallbackCardMedia({ scope, withVideos })
    console.log(
      JSON.stringify(
        { mode: 'fallback-sync', withVideos, count, cards: manifest.cards, updatedAt: manifest.updatedAt },
        null,
        2,
      ),
    )
    return
  }

  const hasImageProvider = Boolean(process.env.OPENAI_API_KEY || process.env.REPLICATE_API_TOKEN)
  if (!hasImageProvider && !dryRun) {
    console.warn('[card-media] No OPENAI_API_KEY or REPLICATE_API_TOKEN — syncing Unsplash fallbacks to public/media/')
    const { manifest, count } = await syncFallbackCardMedia({ scope, withVideos: !skipVideo })
    console.log(
      JSON.stringify(
        { mode: 'fallback-sync', withVideos: !skipVideo, count, cards: manifest.cards, updatedAt: manifest.updatedAt },
        null,
        2,
      ),
    )
    return
  }

  const { runCardMediaBatch } = await import('../lib/marketing/card-media-generator')
  const { manifest, results } = await runCardMediaBatch({
    scope,
    dryRun,
    skipVideo,
    useMarketingBot: Boolean(process.env.ANTHROPIC_API_KEY),
  })

  const ok = results.filter((r) => r.ok).length
  console.log(
    JSON.stringify(
      {
        mode: dryRun ? 'dry-run' : 'generate',
        generated: ok,
        failed: results.length - ok,
        updatedAt: manifest.updatedAt,
        results,
      },
      null,
      2,
    ),
  )

  if (ok < results.length) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
