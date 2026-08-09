/**
 * Generate hero campaign media with the platform's Replicate account.
 *
 * From repo root:
 *   pnpm --filter web-main exec tsx scripts/generate-hero-campaign-media.ts
 */
import { existsSync, readFileSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import Replicate from 'replicate'

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

const specs = [
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

async function generateImage(spec: typeof specs[0]) {
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

async function generateVideo(spec: typeof specs[0], startImageUrl: string) {
  console.log(`[hero-media] Generating video ${spec.id} with Seedance 1 Pro`)

  const input = {
    image: startImageUrl,
    prompt: spec.promptVideo,
    duration: 5,
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
  await writeFile(path.join(outputRoot, spec.videoFile), await download(remoteUrl))
  console.log(`[hero-media] Saved video ${spec.videoFile}`)
}

async function main() {
  await mkdir(outputRoot, { recursive: true })

  for (const spec of specs) {
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
