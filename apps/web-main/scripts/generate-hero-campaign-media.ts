/**
 * Generate hero campaign media with the platform's Replicate account.
 *
 * From repo root:
 *   pnpm --filter web-main exec tsx scripts/generate-hero-campaign-media.ts
 *   pnpm --filter web-main exec tsx scripts/generate-hero-campaign-media.ts --only hero-dmv-renovation
 *
 * Existing images and videos are never regenerated; delete the file to redo it.
 */
import { existsSync, readFileSync } from 'fs'
import { mkdir, writeFile, readFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import Replicate from 'replicate'
import { stitchMp4Segments, getFfmpegBin } from '../lib/marketing/video-stitch'

const execFileAsync = promisify(execFile)

const webMainRoot = path.join(__dirname, '..')
const repoRoot = path.join(webMainRoot, '..', '..')
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

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
const imageModel = 'black-forest-labs/flux-1.1-pro-ultra'
const videoModel = 'bytedance/seedance-1-pro'

/**
 * A hero clip is either one Seedance shot (5 s) or a SEQUENCE of shots, each
 * continuing from the previous shot's last frame and stitched with the same
 * ffmpeg concat the deliverable process videos use. Seedance caps a shot at
 * 10 s; a 15-second narrative is three 5-second beats.
 */
interface HeroSpec {
  id: string
  imageFile: string
  videoFile: string
  promptImage: string
  /** Single-shot prompt. Ignored when `segments` is set. */
  promptVideo?: string
  segments?: { promptVideo: string; duration: 5 | 10 }[]
}

const specs: HeroSpec[] = [
  // ── DMV 1950s ranch exterior renovation — 15 s, three beats ────────────
  // Grounded in the exterior_concept / whole_home_remodel services and the
  // DC · MD · VA service area (KEALEE.md, AI content generation rules).
  // Modest one-level 1950s home: the attainable renovation, not a luxury
  // build. No footprint change, no added floors.
  {
    id: 'hero-dmv-renovation',
    imageFile: 'hero-dmv-renovation.jpg',
    videoFile: 'hero-dmv-renovation.mp4',
    promptImage:
      'Photorealistic editorial photograph, straight-on street view of a modest 1950s one-level ' +
      'suburban ranch home in the Washington DC / Maryland / Virginia region before renovation: ' +
      'dated pale siding, worn white trim, small original windows, aging concrete entry steps, ' +
      'sagging gutters, patchy lawn and overgrown foundation shrubs, mature deciduous trees, ' +
      'overcast morning light, realistic proportions, wide horizontal 16:9 composition, no people, ' +
      'no text, no logos',
    segments: [
      {
        duration: 5,
        promptVideo:
          'Cinematic residential construction commercial. Slow smooth dolly toward a modest 1950s ' +
          'one-level suburban home in the DC Maryland Virginia region: dated siding, worn trim, small ' +
          'windows, aging entry steps, outdated front yard. A crew begins careful demolition of the ' +
          'deteriorated exterior siding and trim, old gutters coming down, realistic renovation ' +
          'sequencing, natural overcast light, photorealistic, 4K, no text, no logos, no close-up ' +
          'faces, footprint unchanged, no added floors',
      },
      {
        duration: 5,
        promptVideo:
          'Cinematic time-lapse continuation on the same modest one-level DMV suburban home: new ' +
          'insulation and clean horizontal siding going on, new energy-efficient black-framed windows ' +
          'set in place, a warm wood front door installed, rebuilt porch and entry steps, subtle brick ' +
          'accent at the base, new dark roof and gutters, smooth slow camera drift, realistic ' +
          'proportions and construction order, natural daylight, photorealistic, 4K, no text, no ' +
          'logos, no people in close-up, no distorted windows, same footprint',
      },
      {
        duration: 5,
        promptVideo:
          'Cinematic golden-hour reveal of the finished renovation of the same modest one-level DMV ' +
          'suburban home: clean horizontal siding, subtle brick accents, dark roof, black-framed ' +
          'windows, warm wood front door, new exterior lighting glowing, repaired driveway, ' +
          'low-maintenance professional landscaping, slow pull-back to a wide frontal view, ' +
          'attainable and durable rather than luxurious, photorealistic, warm natural light, 4K, ' +
          'no text, no logos, no people in close-up, same footprint',
      },
    ],
  },
  {
    id: 'hero-new-construction',
    imageFile: 'hero-new-construction.jpg',
    videoFile: 'hero-new-construction.mp4',
    promptImage: 'Editorial architectural photography of a stunning modern new construction home being built, timber framing and large glass windows, realistic natural daylight, wide landscape shot, cinematic, forest green and warm neutral palette, horizontal 16:9 composition',
    promptVideo: 'Slow cinematic drone reveal of a modern new construction home frame, smooth forward movement, hyper-realistic, photorealistic lighting, no added text or logos, beautiful sky'
  },
  {
    id: 'hero-landscaping',
    imageFile: 'hero-landscaping.jpg',
    videoFile: 'hero-landscaping.mp4',
    promptImage: 'Editorial photography of a beautiful modern backyard garden and landscaping transformation, lush green plants, elegant stone patio, warm natural sunlight, wide cinematic shot, horizontal 16:9 composition',
    promptVideo: 'Slow horizontal camera pan across a beautifully landscaped modern backyard garden, soft natural daylight shifting, lush plants swaying gently in the breeze, hyper-realistic, architectural digest style'
  },
  {
    id: 'hero-addition',
    imageFile: 'hero-addition.jpg',
    videoFile: 'hero-addition.mp4',
    promptImage: 'Editorial architectural photography of a stunning two-story modern home addition seamlessly blending with a classic house, warm exterior lighting at dusk, twilight sky, horizontal 16:9 composition',
    promptVideo: 'Slow dolly-in cinematic shot of a stunning modern home addition at twilight, warm interior lights glowing through large windows, ultra-realistic, architectural rendering style'
  },
  {
    id: 'hero-kitchen',
    imageFile: 'hero-kitchen.jpg',
    videoFile: 'hero-kitchen.mp4',
    promptImage: 'Editorial interior photography of a high-end luxury kitchen and bath renovation, marble countertops, modern brass fixtures, warm ambient lighting, highly detailed, horizontal 16:9 composition',
    promptVideo: 'Smooth slow-motion gimbal walkthrough of a luxury kitchen renovation, camera pans slowly across marble countertops and modern fixtures, photorealistic lighting, hyper-detailed interior design'
  }
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

async function generateImage(spec: HeroSpec) {
  console.log(`[hero-media] Generating image ${spec.id} with Flux`)
  const output = await replicate.run(imageModel, {
    input: {
      prompt: spec.promptImage,
      aspect_ratio: '16:9',
      output_format: 'jpg',
      output_quality: 92,
      safety_tolerance: 2,
    },
  })
  const remoteUrl = outputUrl(output)
  if (!remoteUrl.startsWith('http')) throw new Error(`No usable image URL for ${spec.id}`)
  await writeFile(path.join(outputRoot, spec.imageFile), await download(remoteUrl))
  console.log(`[hero-media] Saved image ${spec.imageFile}`)
  return remoteUrl
}

/** One Seedance shot, returned as bytes so a sequence can continue from it. */
async function generateShot(
  id: string, startImageUrl: string, prompt: string, duration: 5 | 10,
): Promise<Buffer> {
  console.log(`[hero-media] Generating ${id} (${duration}s) with Seedance 1 Pro`)

  const input = {
    image: startImageUrl,
    prompt,
    duration,
    resolution: '1080p',
    aspect_ratio: '16:9',
  }
  let prediction
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      prediction = await replicate.predictions.create({ model: videoModel, input })
      break
    } catch (error) {
      const status = (error as any).response?.status
      if (status !== 429 || attempt === 4) throw error
      const retryAfter = Number((error as any).response?.headers?.get?.('retry-after') ?? 5)
      await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000))
    }
  }
  if (!prediction) throw new Error('Seedance prediction could not be created')

  let current = prediction
  const startedAt = Date.now()
  while (!['succeeded', 'failed', 'canceled'].includes(current.status)) {
    if (Date.now() - startedAt > 10 * 60_000) throw new Error('Seedance generation timed out')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    current = await replicate.predictions.get(prediction.id)
  }

  if (current.status !== 'succeeded') {
    throw new Error(`Seedance generation ${current.status}: ${String(current.error ?? '')}`)
  }

  const remoteUrl = outputUrl(current.output)
  if (!remoteUrl.startsWith('http')) throw new Error('Seedance returned no usable video URL')
  return download(remoteUrl)
}

/** The last frame of a clip, uploaded so the next shot starts where this one ended. */
async function lastFrameUrl(video: Buffer, id: string): Promise<string> {
  const ffmpeg = getFfmpegBin()
  const dir = path.join(os.tmpdir(), `kealee-hero-${id}-${Date.now()}`)
  await mkdir(dir, { recursive: true })
  const clip = path.join(dir, 'clip.mp4')
  const frame = path.join(dir, 'last.jpg')
  await writeFile(clip, video)
  await execFileAsync(ffmpeg, ['-y', '-sseof', '-0.1', '-i', clip, '-frames:v', '1', '-q:v', '2', frame], { timeout: 60_000 })
  const uploaded = await replicate.files.create(await readFile(frame))
  return String(uploaded.urls?.get)
}

async function generateVideo(spec: HeroSpec, startImageUrl: string) {
  const target = path.join(outputRoot, spec.videoFile)

  if (!spec.segments) {
    if (!spec.promptVideo) throw new Error(`${spec.id} has neither promptVideo nor segments`)
    await writeFile(target, await generateShot(spec.id, startImageUrl, spec.promptVideo, 5))
    console.log(`[hero-media] Saved video ${spec.videoFile}`)
    return
  }

  // A sequence: each beat starts from the previous beat's last frame, then
  // the beats are concatenated. Part files are kept beside the output so a
  // failed later beat does not cost the earlier ones.
  const parts: Buffer[] = []
  let frameUrl = startImageUrl
  for (const [i, seg] of spec.segments.entries()) {
    const partPath = path.join(outputRoot, `${spec.id}.part-${i + 1}.mp4`)
    let bytes: Buffer
    if (existsSync(partPath)) {
      console.log(`[hero-media] Reusing ${path.basename(partPath)}`)
      bytes = await readFile(partPath)
    } else {
      bytes = await generateShot(`${spec.id} beat ${i + 1}/${spec.segments.length}`, frameUrl, seg.promptVideo, seg.duration)
      await writeFile(partPath, bytes)
    }
    parts.push(bytes)
    if (i < spec.segments.length - 1) frameUrl = await lastFrameUrl(bytes, `${spec.id}-${i + 1}`)
  }

  const stitched = await stitchMp4Segments(parts)
  if (!stitched) throw new Error('ffmpeg concat failed; parts are saved beside the output')
  await writeFile(target, stitched)
  const total = spec.segments.reduce((n, s) => n + s.duration, 0)
  console.log(`[hero-media] Saved ${spec.videoFile} (${spec.segments.length} beats, ${total}s)`)
}

async function main() {
  await mkdir(outputRoot, { recursive: true })

  // `--only <id>` generates one spec; everything else is skipped.
  const onlyArg = process.argv.indexOf('--only')
  const only = onlyArg >= 0 ? process.argv[onlyArg + 1] : null

  for (const spec of specs) {
    if (only && spec.id !== only) continue
    let imageUrl = '';
    const imagePath = path.join(outputRoot, spec.imageFile)
    if (!existsSync(imagePath)) {
      imageUrl = await generateImage(spec)
    } else {
      console.log(`[hero-media] Uploading existing image for ${spec.id}`)
      const imageBytes = readFileSync(imagePath)
      const uploaded = await replicate.files.create(imageBytes)
      imageUrl = String(uploaded.urls?.get)
    }

    const videoPath = path.join(outputRoot, spec.videoFile)
    if (!existsSync(videoPath)) {
      await generateVideo(spec, imageUrl)
    } else {
      console.log(`[hero-media] Video ${spec.videoFile} already exists, skipping...`)
    }
  }

  console.log(`[hero-media] All assets generated successfully at ${outputRoot}`)
}

main().catch((error) => {
  console.error('[hero-media]', error)
  process.exit(1)
})
