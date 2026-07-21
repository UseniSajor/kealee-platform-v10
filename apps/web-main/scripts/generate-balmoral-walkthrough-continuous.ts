/**
 * Continuous 2-minute interior walkthrough for "20 E Balmoral"
 * (HousePlans.com Plan 892-23 — Contemporary Prairie Modern, 3345 sq ft, 2-story).
 *
 * Unlike the 6-shot version (generate-balmoral-walkthrough.ts), this chains
 * clips by last-frame: only segment 1 starts from a fresh Flux still. Every
 * later segment's start_image is the extracted last frame of the previous
 * segment's video (uploaded via Replicate's file API), so the camera
 * continues moving instead of hard-cutting between disconnected shots.
 * 24 segments x 5s = 120s, following actual room adjacencies from the plan's
 * Main Floor and Upper Floor sheets.
 *
 * Run: pnpm --filter web-main exec tsx scripts/generate-balmoral-walkthrough-continuous.ts
 */
import { mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import Replicate from 'replicate'
import { stitchMp4Segments } from '../lib/marketing/video-stitch'

const execFileAsync = promisify(execFile)
const outDir = process.env.BALMORAL_OUT_DIR ?? path.join(__dirname, '..', 'balmoral-continuous-tmp-output')

async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 5): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status !== 429 || i === attempts) throw err
      const wait = 5000 * i
      console.log(`[balmoral] ${label} rate-limited (429), retry ${i}/${attempts} in ${wait}ms...`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw new Error('unreachable')
}

const STYLE_TAG = 'Contemporary Prairie Modern interior, wide-plank wood flooring, warm natural light, premium architectural walkthrough style, no people in frame'

interface Segment {
  id: string
  label: string
  motionPrompt: string
}

// Grounded in Plan 892-23's actual Main Floor + Upper Floor room adjacencies:
// Foyer -> Gallery -> Primary Suite wing -> back through Gallery -> Great Room/Kitchen
// -> Den/Bedroom 2 wing -> Staircase -> Upper Floor.
const SEGMENTS: Segment[] = [
  { id: '01-foyer', label: 'Foyer (entry)', motionPrompt: `Camera enters through the front door into the foyer of a ${STYLE_TAG}, floor-to-ceiling glass sidelight, polished concrete floor.` },
  { id: '02-gallery', label: 'Gallery hallway', motionPrompt: `Continue walking forward down the gallery hallway, ${STYLE_TAG}, steady eye-level pace.` },
  { id: '03-gallery-den-glimpse', label: 'Gallery past Den', motionPrompt: `Continue down the gallery, passing the den/office doorway on the right, ${STYLE_TAG}.` },
  { id: '04-primary-entry', label: 'Primary Suite entry', motionPrompt: `Turn into the primary bedroom suite doorway, ${STYLE_TAG}, entering a spacious bedroom.` },
  { id: '05-primary-bedroom', label: 'Primary Bedroom', motionPrompt: `Pan across the primary bedroom toward floor-to-ceiling glass doors opening onto a private terrace, ${STYLE_TAG}.` },
  { id: '06-primary-bath', label: 'Primary Bath', motionPrompt: `Continue into the primary ensuite bathroom, freestanding tub, ${STYLE_TAG}.` },
  { id: '07-walk-in-closet', label: 'Walk-in Closet', motionPrompt: `Continue into the primary walk-in closet, built-in wood shelving, ${STYLE_TAG}.` },
  { id: '08-back-gallery', label: 'Back through Gallery', motionPrompt: `Turn back and walk down the gallery hallway toward the great room, ${STYLE_TAG}.` },
  { id: '09-great-room-entry', label: 'Great Room entry', motionPrompt: `Enter the great room, a wide open living space with tall windows, ${STYLE_TAG}.` },
  { id: '10-great-room-fireplace', label: 'Great Room fireplace', motionPrompt: `Pan across the great room toward a linear fireplace wall, comfortable seating area, ${STYLE_TAG}.` },
  { id: '11-toward-kitchen', label: 'Toward Kitchen', motionPrompt: `Continue from the great room toward the open kitchen, ${STYLE_TAG}.` },
  { id: '12-kitchen-island', label: 'Kitchen Island', motionPrompt: `Arrive at the kitchen island and eating bar, large windows over the sink, ${STYLE_TAG}.` },
  { id: '13-kitchen-pantry-laundry', label: 'Kitchen to Laundry', motionPrompt: `Continue past the kitchen toward the laundry and mud room, built-in storage, ${STYLE_TAG}.` },
  { id: '14-back-toward-den', label: 'Back toward Den', motionPrompt: `Turn back and walk toward the den/home office, ${STYLE_TAG}.` },
  { id: '15-den', label: 'Den / Office', motionPrompt: `Enter the den, a home office with a built-in desk and bookshelves, ${STYLE_TAG}.` },
  { id: '16-toward-bedroom2', label: 'Toward Bedroom 2', motionPrompt: `Continue from the den toward the second bedroom, ${STYLE_TAG}.` },
  { id: '17-bedroom2', label: 'Bedroom 2', motionPrompt: `Pan across the second bedroom, large window, ${STYLE_TAG}.` },
  { id: '18-bedroom2-bath', label: 'Bedroom 2 Bath', motionPrompt: `Continue into the second bathroom, ${STYLE_TAG}.` },
  { id: '19-toward-stairs', label: 'Toward Staircase', motionPrompt: `Walk toward the staircase leading to the upper floor, ${STYLE_TAG}.` },
  { id: '20-ascend-stairs', label: 'Ascending Stairs', motionPrompt: `Ascend the staircase to the upper floor, wood treads and metal railing, ${STYLE_TAG}.` },
  { id: '21-upper-loft', label: 'Upper Loft', motionPrompt: `Arrive at the upper floor loft/gathering area at the top of the stairs, ${STYLE_TAG}.` },
  { id: '22-upper-suite-entry', label: 'Upper Suite entry', motionPrompt: `Continue into the upper floor guest suite, ${STYLE_TAG}.` },
  { id: '23-upper-suite', label: 'Upper Suite', motionPrompt: `Pan across the upper guest suite, dormer window, ${STYLE_TAG}.` },
  { id: '24-upper-suite-bath', label: 'Upper Suite Bath (final)', motionPrompt: `Continue into the upper suite ensuite bathroom, final shot of the walkthrough, ${STYLE_TAG}.` },
]

const FIRST_STILL_PROMPT =
  `Entry foyer of a Contemporary Prairie Modern architecture home, black metal shed roof, exposed wood beams, ` +
  `wood slat privacy screens, floor-to-ceiling glass walls, wide-plank wood flooring, sightline down the gallery ` +
  `hallway toward the great room, polished concrete floor, floor-to-ceiling glass sidelight at the front door, ` +
  `architectural photography, photorealistic, 16:9`

function outputUrl(output: unknown): string {
  if (Array.isArray(output)) return String(output[0] ?? '')
  if (output && typeof output === 'object' && 'url' in output) {
    const url = (output as { url?: unknown }).url
    return typeof url === 'function' ? String((url as () => unknown).call(output)) : String(url)
  }
  return String(output ?? '')
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000) })
  if (!response.ok) throw new Error(`Download failed with ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function waitForPrediction(replicate: Replicate, id: string, budgetMs: number) {
  const startedAt = Date.now()
  let current = await replicate.predictions.get(id)
  while (!['succeeded', 'failed', 'canceled'].includes(current.status)) {
    if (Date.now() - startedAt > budgetMs) throw new Error(`Prediction ${id} timed out`)
    await new Promise((r) => setTimeout(r, 5000))
    current = await replicate.predictions.get(id)
  }
  return current
}

function getFfmpegBin(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const staticPath: string | null = require('ffmpeg-static') as string | null
    if (staticPath) return staticPath
  } catch { /* fall through to system ffmpeg */ }
  return 'ffmpeg'
}

/** Extract the last frame of an mp4 as a JPEG buffer. */
async function extractLastFrame(mp4Path: string, outJpgPath: string): Promise<Buffer> {
  await execFileAsync(getFfmpegBin(), ['-y', '-sseof', '-1', '-i', mp4Path, '-update', '1', '-q:v', '2', outJpgPath], { timeout: 30_000 })
  return readFile(outJpgPath)
}

async function main() {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN not set')
  const replicate = new Replicate({ auth: token })

  await mkdir(outDir, { recursive: true })

  const imageModel = 'black-forest-labs/flux-1.1-pro-ultra'
  const videoModel = 'kwaivgi/kling-v2.5-turbo-pro'

  const clipBuffers: Buffer[] = []
  let prevMp4Path: string | null = null

  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i]
    console.log(`\n[balmoral] === ${i + 1}/${SEGMENTS.length}: ${seg.label} ===`)

    const mp4Path = path.join(outDir, `${seg.id}.mp4`)
    if (existsSync(mp4Path)) {
      console.log(`[balmoral] Already have ${mp4Path}, skipping.`)
      clipBuffers.push(await readFile(mp4Path))
      prevMp4Path = mp4Path
      continue
    }

    // Resolve start_image: fresh Flux still for segment 1, else last frame of the previous clip.
    let startImageUrl: string
    if (i === 0) {
      console.log(`[balmoral] Generating opening still via ${imageModel}...`)
      const imgOutput = await withRetry(
        () => replicate.run(imageModel, {
          input: { prompt: FIRST_STILL_PROMPT, aspect_ratio: '16:9', output_format: 'jpg', output_quality: 92, safety_tolerance: 2 },
        }),
        `${seg.id} opening image`,
      )
      const url = outputUrl(imgOutput)
      if (!url.startsWith('http')) throw new Error(`No opening image URL`)
      await writeFile(path.join(outDir, `${seg.id}-start.jpg`), await download(url))
      startImageUrl = url
    } else {
      if (!prevMp4Path) throw new Error(`No previous clip to chain from at segment ${i + 1}`)
      console.log(`[balmoral] Extracting last frame of ${path.basename(prevMp4Path)}...`)
      const frameJpgPath = path.join(outDir, `${seg.id}-start.jpg`)
      const frameBuf = await extractLastFrame(prevMp4Path, frameJpgPath)
      console.log(`[balmoral] Uploading chained frame to Replicate...`)
      const frameBytes = frameBuf.buffer.slice(frameBuf.byteOffset, frameBuf.byteOffset + frameBuf.byteLength) as ArrayBuffer
      const blob = new Blob([frameBytes], { type: 'image/jpeg' })
      const fileResult = await withRetry(() => replicate.files.create(blob), `${seg.id} frame upload`)
      startImageUrl = fileResult.urls.get
    }

    console.log(`[balmoral] Animating via ${videoModel}...`)
    const prediction = await withRetry(
      () => replicate.predictions.create({
        model: videoModel,
        input: { start_image: startImageUrl, prompt: seg.motionPrompt, duration: 5, aspect_ratio: '16:9' },
      }),
      `${seg.id} video`,
    )
    const done = await waitForPrediction(replicate, prediction.id, 8 * 60_000)
    if (done.status !== 'succeeded') throw new Error(`Video generation failed for ${seg.id}: ${done.status} ${JSON.stringify(done.error)}`)
    const videoUrl = outputUrl(done.output)
    if (!videoUrl.startsWith('http')) throw new Error(`No video URL for ${seg.id}`)
    console.log(`[balmoral] Clip ready: ${videoUrl}`)
    const clipBuffer = await download(videoUrl)
    await writeFile(mp4Path, clipBuffer)
    clipBuffers.push(clipBuffer)
    prevMp4Path = mp4Path
  }

  console.log('\n[balmoral] Stitching all 24 clips into one continuous video...')
  const stitched = await stitchMp4Segments(clipBuffers)
  if (!stitched) throw new Error('ffmpeg stitch failed')
  const finalPath = path.join(outDir, 'balmoral-walkthrough-continuous-2min.mp4')
  await writeFile(finalPath, stitched)
  console.log(`\n[balmoral] DONE: ${finalPath}`)
}

main().catch((err) => {
  console.error('[balmoral] FAILED:', err)
  process.exit(1)
})
