/**
 * Generate the farmhouse and craftsman 15-second homepage hero videos.
 *
 * From repo root:
 *   pnpm --filter web-main exec tsx scripts/generate-home-style-hero-media.ts
 */
import { execFile } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'
import Replicate from 'replicate'

const execFileAsync = promisify(execFile)
const webMainRoot = path.join(__dirname, '..')
const outputRoot = path.join(webMainRoot, 'public', 'media', 'hero-videos')

for (const name of ['.env.local', '.env.vercel.production', '.env']) {
  const envPath = path.join(webMainRoot, name)
  if (!existsSync(envPath)) continue

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 1) continue
    const key = trimmed.slice(0, separator).trim()
    if (!process.env[key]) {
      process.env[key] = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
}

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error('REPLICATE_API_TOKEN is not configured in apps/web-main/.env.local')
}
if (!ffmpegPath) throw new Error('ffmpeg-static is unavailable')
// `ffmpeg-static` is typed `string | null`, and the guard above does NOT narrow
// it at the call site: TypeScript treats an imported binding as possibly
// reassigned, so the narrowing does not survive into a function body. Binding
// the checked value to a local const carries the proof forward, which a `!`
// assertion would only have silenced.
const FFMPEG: string = ffmpegPath

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
const imageModel = 'black-forest-labs/flux-1.1-pro-ultra'
const videoModel = 'bytedance/seedance-1-pro'

type HeroSpec = {
  id: string
  posterPrompt: string
  constructionPrompt: string
  revealPrompt: string
}

const sharedNegative =
  'No people in close-up, no logos, no text, no watermarks, no distorted geometry, no warped windows, no floating materials, no unrealistic construction sequencing or building proportions.'

const specs: HeroSpec[] = [
  {
    id: 'hero-modern-farmhouse',
    posterPrompt:
      'Wide sunrise drone view of a partially completed modern farmhouse on a spacious green lot, foundation and precise timber framing visible, clean realistic jobsite, white board-and-batten materials staged neatly, black standing-seam metal roof components, natural wood beams, large black-framed windows, premium real-estate development commercial, photorealistic architectural visualization, natural lighting, high detail, horizontal 16:9 composition, no people, no text, no logos.',
    constructionPrompt:
      `Create a cinematic architectural construction time-lapse of one consistent modern farmhouse on a spacious green lot. Begin with a wide sunrise drone shot of the partially completed farmhouse, then progress in physically correct order through foundation, framing, black standing-seam roof installation, large black-framed windows, clean white board-and-batten siding, natural wood beams, and the covered front porch. Smooth forward cinematic camera movement, realistic construction details, premium real-estate development commercial, natural lighting, photorealistic, high detail, 4K visual quality. ${sharedNegative}`,
    revealPrompt:
      `A smooth cinematic drone reveal of the same completed modern farmhouse at golden hour. Clean white board-and-batten siding, black standing-seam metal roof, natural wood beams, large black-framed windows, covered front porch, and simple elegant finished landscaping. Slow graceful forward movement ending on a polished wide exterior hero view, premium real-estate development commercial, photorealistic, natural golden light, high detail, 4K visual quality. ${sharedNegative}`,
  },
  {
    id: 'hero-modern-craftsman',
    posterPrompt:
      'Smooth forward-looking wide view over a residential lot with construction layout visible for a modern craftsman home at warm early morning, precise foundation markings and realistic materials, contemporary craftsman form, warm wood siding materials, charcoal accents, tapered porch columns, natural stone base, black-framed windows, gabled rooflines, premium builder commercial, photorealistic architectural visualization, high detail, horizontal 16:9 composition, no people, no text, no logos.',
    constructionPrompt:
      `Create a cinematic architectural construction time-lapse of one consistent modern craftsman home. Start with a smooth forward-moving camera shot over a residential lot with the construction layout visible, then progress in physically correct order through foundation, framing, gabled roof installation, warm wood exterior siding, charcoal accents, natural stone base, black-framed windows, front entry, wide front porch, and tapered porch columns. Premium builder commercial, realistic construction process, warm natural lighting, photorealistic architectural visualization, high detail, 4K visual quality. ${sharedNegative}`,
    revealPrompt:
      `A smooth dramatic dusk reveal of the same completed modern craftsman home. Contemporary craftsman design, warm wood siding, charcoal accents, tapered porch columns, natural stone base, wide front porch, black-framed windows, layered gabled rooflines, and refined finished landscaping. Slow cinematic forward camera movement ending on a polished wide exterior hero view, warm interior glow, premium builder commercial, photorealistic, high detail, 4K visual quality. ${sharedNegative}`,
  },
]

function outputUrl(output: unknown): string {
  if (typeof output === 'string') return output
  if (Array.isArray(output) && output.length > 0) return String(output[0])
  if (output && typeof output === 'object' && 'url' in output) {
    const url = (output as { url?: unknown }).url
    return typeof url === 'function' ? String(url.call(output)) : String(url)
  }
  return String(output ?? '')
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000) })
  if (!response.ok) throw new Error(`Download failed with ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function generatePoster(spec: HeroSpec): Promise<{ bytes: Buffer; remoteUrl: string }> {
  console.log(`[home-style-hero] Generating poster for ${spec.id}`)
  const output = await replicate.run(imageModel, {
    input: {
      prompt: spec.posterPrompt,
      aspect_ratio: '16:9',
      output_format: 'jpg',
      output_quality: 92,
      safety_tolerance: 2,
    },
  })
  const remoteUrl = outputUrl(output)
  if (!remoteUrl.startsWith('http')) throw new Error(`No usable poster URL for ${spec.id}`)
  return { bytes: await download(remoteUrl), remoteUrl }
}

async function generateVideo(prompt: string, duration: 5 | 10, startImage?: string): Promise<Buffer> {
  const input: Record<string, unknown> = {
    prompt,
    duration,
    resolution: '1080p',
    aspect_ratio: '16:9',
  }
  if (startImage) input.image = startImage

  let prediction
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      prediction = await replicate.predictions.create({ model: videoModel, input })
      break
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status !== 429 || attempt === 4) throw error
      await new Promise((resolve) => setTimeout(resolve, attempt * 8_000))
    }
  }
  if (!prediction) throw new Error('Seedance prediction could not be created')

  const startedAt = Date.now()
  let current = prediction
  while (!['succeeded', 'failed', 'canceled'].includes(current.status)) {
    if (Date.now() - startedAt > 15 * 60_000) throw new Error('Seedance generation timed out')
    await new Promise((resolve) => setTimeout(resolve, 5_000))
    current = await replicate.predictions.get(prediction.id)
  }
  if (current.status !== 'succeeded') {
    throw new Error(`Seedance generation ${current.status}: ${String(current.error ?? '')}`)
  }

  const remoteUrl = outputUrl(current.output)
  if (!remoteUrl.startsWith('http')) throw new Error('Seedance returned no usable video URL')
  return download(remoteUrl)
}

async function composeExactly15Seconds(first: Buffer, second: Buffer): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(os.tmpdir(), 'kealee-home-style-hero-'))
  const firstPath = path.join(workDir, 'construction.mp4')
  const secondPath = path.join(workDir, 'reveal.mp4')
  const listPath = path.join(workDir, 'segments.txt')
  const outputPath = path.join(workDir, 'hero.mp4')

  try {
    await Promise.all([
      writeFile(firstPath, first),
      writeFile(secondPath, second),
      writeFile(listPath, `file '${firstPath}'\nfile '${secondPath}'\n`, 'utf8'),
    ])
    await execFileAsync(
      FFMPEG,
      [
        '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
        '-an', '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,tpad=stop_mode=clone:stop_duration=1',
        '-t', '15', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outputPath,
      ],
      { timeout: 10 * 60_000, maxBuffer: 10 * 1024 * 1024 },
    )
    return await readFile(outputPath)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function main() {
  await mkdir(outputRoot, { recursive: true })

  for (const spec of specs) {
    const posterPath = path.join(outputRoot, `${spec.id}.jpg`)
    const videoPath = path.join(outputRoot, `${spec.id}.mp4`)
    if (existsSync(posterPath) && existsSync(videoPath)) {
      console.log(`[home-style-hero] ${spec.id} already exists; skipping`)
      continue
    }

    const poster = await generatePoster(spec)
    await writeFile(posterPath, poster.bytes)
    console.log(`[home-style-hero] Generating 10-second construction sequence for ${spec.id}`)
    const construction = await generateVideo(spec.constructionPrompt, 10)
    console.log(`[home-style-hero] Generating 5-second finished reveal for ${spec.id}`)
    const reveal = await generateVideo(spec.revealPrompt, 5, poster.remoteUrl)
    console.log(`[home-style-hero] Composing exact 15-second master for ${spec.id}`)
    await writeFile(videoPath, await composeExactly15Seconds(construction, reveal))
  }

  console.log(`[home-style-hero] Completed assets in ${outputRoot}`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[home-style-hero] ${message}`)
  process.exit(1)
})
