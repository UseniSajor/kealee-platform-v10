/**
 * One-off: re-encode the oversized generated home-card videos (~33-37MB, raw
 * ~47Mbps AI-generator output) down to a web-appropriate bitrate and re-upload
 * to the same Supabase storage path (upsert), so manifest.json URLs don't change.
 * Usage: pnpm exec tsx scripts/compress-home-card-videos.ts
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

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
  const { downloadUrlToBuffer, uploadMarketingAsset } = await import('../lib/marketing/card-media-storage')
  const manifestPath = join(webMainRoot, 'public', 'media', 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  const keys = ['home:design', 'home:estimate', 'home:permits', 'home:build']
  const tmpDir = await mkdtemp(join(tmpdir(), 'compress-home-video-'))

  for (const key of keys) {
    const entry = manifest.cards[key]
    if (!entry?.videoUrl) {
      console.log(`SKIP ${key}: no videoUrl`)
      continue
    }
    // Must match the id used by the original upload (card-media-generator.ts
    // uploads video as `${spec.id}-video`) so this overwrites in place instead
    // of landing at a new, unreferenced path.
    const id = `${key.split(':')[1]}-video`
    console.log(`[${key}] downloading ${entry.videoUrl}`)
    const bytes = await downloadUrlToBuffer(entry.videoUrl)
    const before = bytes.length

    const inPath = join(tmpDir, `${id}-in.mp4`)
    const outPath = join(tmpDir, `${id}-out.mp4`)
    await writeFile(inPath, bytes)

    await execFileAsync(ffmpegPath as string, [
      '-y', '-i', inPath,
      '-an',
      '-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
      '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outPath,
    ])

    const compressed = await readFile(outPath)
    const after = compressed.length
    if (after >= before) {
      console.log(`SKIP ${key}: compression did not shrink (${before} -> ${after})`)
      continue
    }

    const url = await uploadMarketingAsset('home', id, compressed, 'mp4')
    console.log(`OK ${key}: ${before} -> ${after} bytes, reuploaded to ${url}`)
  }

  await rm(tmpDir, { recursive: true, force: true })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
