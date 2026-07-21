/**
 * One-off internal test: 30-second AI walkthrough video for "20 E Balmoral"
 * (HousePlans.com Plan 892-23 — Contemporary Prairie Modern, 3345 sq ft, 2-story).
 *
 * Per room: Flux 1.1 Pro Ultra generates a still image grounded in the plan's
 * actual room labels and style, then Kling v2.5 Turbo Pro animates that still
 * into a 5s clip. All 6 clips are stitched into one output.mp4.
 *
 * Run: pnpm --filter web-main exec tsx scripts/generate-balmoral-walkthrough.ts
 */
import { mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import Replicate from 'replicate'
import { stitchMp4Segments } from '../lib/marketing/video-stitch'

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

const outDir = process.env.BALMORAL_OUT_DIR ?? path.join(__dirname, '..', 'balmoral-tmp-output')

const STYLE =
  'Contemporary Prairie Modern architecture, black metal shed roof, exposed wood beams, ' +
  'wood slat privacy screens, floor-to-ceiling glass walls, wide-plank wood flooring, ' +
  'desert boulder and gravel landscaping, warm dusk lighting'

interface RoomSpec {
  id: string
  label: string
  imagePrompt: string
  motionPrompt: string
}

// Grounded in the actual "Plan 892-23" floor plan (Main + Upper Floor sheets):
// Foyer -> Gallery -> Courtyard -> Great Room/Kitchen -> Private Terrace/Master ->
// Upper Floor Suite -> Covered Terrace.
const ROOMS: RoomSpec[] = [
  {
    id: '1-foyer',
    label: 'Foyer',
    imagePrompt: `Entry foyer of a ${STYLE}, sightline down the gallery hallway toward the great room, polished concrete floor, floor-to-ceiling glass sidelight at the front door, architectural photography, photorealistic, 16:9`,
    motionPrompt: 'Slow forward walking camera movement through the foyer toward the gallery hallway, steady eye-level pace, no people in frame, premium architectural walkthrough style.',
  },
  {
    id: '2-courtyard',
    label: 'Courtyard',
    imagePrompt: `Interior courtyard of a ${STYLE}, covered walkway connecting the gallery to the great room, wood slat screening overhead, boulder and gravel landscaping, glass walls on two sides, photorealistic, 16:9`,
    motionPrompt: 'Slow forward camera movement crossing the courtyard, gentle pan revealing the covered walkway and glass walls, no people in frame, premium architectural walkthrough style.',
  },
  {
    id: '3-great-room-kitchen',
    label: 'Great Room + Kitchen',
    imagePrompt: `Open-concept great room and kitchen of a ${STYLE}, large kitchen island with eating bar, linear fireplace, floor-to-ceiling glass wall opening onto a covered terrace, photorealistic, 16:9`,
    motionPrompt: 'Slow cinematic camera movement panning from the kitchen island across the open great room toward the glass wall, steady pace, no people in frame, premium architectural walkthrough style.',
  },
  {
    id: '4-primary-suite',
    label: 'Primary Suite',
    imagePrompt: `Primary bedroom suite of a ${STYLE}, floor-to-ceiling glass doors opening onto a private terrace, walk-in closet visible through an open doorway, neutral wood tones, photorealistic, 16:9`,
    motionPrompt: 'Slow forward camera movement into the primary suite toward the glass doors and private terrace, no people in frame, premium architectural walkthrough style.',
  },
  {
    id: '5-upper-suite',
    label: 'Upper Floor Suite',
    imagePrompt: `Upper floor guest suite of a ${STYLE}, ensuite bathroom visible through an open doorway, dormer window, wide-plank wood flooring, photorealistic, 16:9`,
    motionPrompt: 'Slow forward camera movement through the upper suite toward the dormer window, no people in frame, premium architectural walkthrough style.',
  },
  {
    id: '6-covered-terrace',
    label: 'Covered Terrace',
    imagePrompt: `Covered rear terrace of a ${STYLE}, black metal shed roof overhang on exposed wood beams, outdoor living area opening onto the desert boulder landscape, dusk lighting, photorealistic, 16:9`,
    motionPrompt: 'Slow outward camera movement from the covered terrace toward the landscaped yard, warm dusk light, no people in frame, premium architectural walkthrough style.',
  },
]

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

async function main() {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN not set')
  const replicate = new Replicate({ auth: token })

  await mkdir(outDir, { recursive: true })

  const imageModel = 'black-forest-labs/flux-1.1-pro-ultra'
  const videoModel = 'kwaivgi/kling-v2.5-turbo-pro'

  const clipBuffers: Buffer[] = []

  for (const room of ROOMS) {
    console.log(`\n[balmoral] === ${room.label} ===`)

    const mp4Path = path.join(outDir, `${room.id}.mp4`)
    if (existsSync(mp4Path)) {
      console.log(`[balmoral] Already have ${mp4Path}, skipping generation.`)
      clipBuffers.push(await readFile(mp4Path))
      continue
    }

    const jpgPath = path.join(outDir, `${room.id}.jpg`)
    let imageUrl: string
    if (existsSync(jpgPath)) {
      console.log(`[balmoral] Reusing existing still image ${jpgPath}`)
      // Kling needs a URL, not a local path — re-upload the cached still via Replicate's file API isn't
      // needed here since we still have the original remote URL cached in the sibling .url file if present.
      const urlCache = path.join(outDir, `${room.id}.jpg.url`)
      if (existsSync(urlCache)) {
        imageUrl = (await readFile(urlCache, 'utf8')).trim()
      } else {
        imageUrl = ''
      }
    } else {
      imageUrl = ''
    }

    if (!imageUrl) {
      console.log(`[balmoral] Generating still image via ${imageModel}...`)
      const imgOutput = await withRetry(
        () => replicate.run(imageModel, {
          input: {
            prompt: room.imagePrompt,
            aspect_ratio: '16:9',
            output_format: 'jpg',
            output_quality: 92,
            safety_tolerance: 2,
          },
        }),
        `${room.id} image`,
      )
      imageUrl = outputUrl(imgOutput)
      if (!imageUrl.startsWith('http')) throw new Error(`No image URL for ${room.id}`)
      console.log(`[balmoral] Image ready: ${imageUrl}`)
      await writeFile(jpgPath, await download(imageUrl))
      await writeFile(`${jpgPath}.url`, imageUrl, 'utf8')
    }

    console.log(`[balmoral] Animating via ${videoModel}...`)
    const prediction = await withRetry(
      () => replicate.predictions.create({
        model: videoModel,
        input: {
          start_image: imageUrl,
          prompt: room.motionPrompt,
          duration: 5,
          aspect_ratio: '16:9',
        },
      }),
      `${room.id} video`,
    )
    const done = await waitForPrediction(replicate, prediction.id, 8 * 60_000)
    if (done.status !== 'succeeded') throw new Error(`Video generation failed for ${room.id}: ${done.status} ${JSON.stringify(done.error)}`)
    const videoUrl = outputUrl(done.output)
    if (!videoUrl.startsWith('http')) throw new Error(`No video URL for ${room.id}`)
    console.log(`[balmoral] Clip ready: ${videoUrl}`)
    const clipBuffer = await download(videoUrl)
    await writeFile(mp4Path, clipBuffer)
    clipBuffers.push(clipBuffer)
  }

  console.log('\n[balmoral] Stitching all clips...')
  const stitched = await stitchMp4Segments(clipBuffers)
  if (!stitched) throw new Error('ffmpeg stitch failed')
  const finalPath = path.join(outDir, 'balmoral-walkthrough-30s.mp4')
  await writeFile(finalPath, stitched)
  console.log(`\n[balmoral] DONE: ${finalPath}`)
}

main().catch((err) => {
  console.error('[balmoral] FAILED:', err)
  process.exit(1)
})
