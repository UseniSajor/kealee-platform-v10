/**
 * Generate preconstruction campaign media with the platform's Replicate account.
 *
 * From repo root:
 *   pnpm --filter web-main exec tsx scripts/generate-preconstruction-campaign-media.ts
 *   pnpm --filter web-main exec tsx scripts/generate-preconstruction-campaign-media.ts --skip-video
 */
import { existsSync, readFileSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import Replicate from 'replicate'

const webMainRoot = path.join(__dirname, '..')
const repoRoot = path.join(webMainRoot, '..', '..')
const outputRoot = path.join(repoRoot, 'apps', 'marketing', 'public', 'media', 'generated')
const commandCenterOutputRoot = path.join(
  repoRoot,
  'apps',
  'command-center',
  'public',
  'renderings',
  'marketing',
  'preconstruction',
)
const skipVideo = process.argv.includes('--skip-video')
const videoOnly = process.argv.includes('--video-only')

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
const videoModel = 'kwaivgi/kling-v2.5-turbo-pro'

const imageSpecs = [
  {
    id: 'preconstruction-design',
    filename: 'preconstruction-design.jpg',
    alt: 'Architectural concept development workspace for a residential construction project',
    prompt:
      'Editorial architectural photography of a refined preconstruction design review, physical massing model, floor plans, material samples and a tablet showing three coherent building concept options, warm modern studio, no visible people, no logos, no legible text, realistic natural daylight, sophisticated forest green and warm neutral palette, premium but practical, horizontal 3:2 composition',
  },
  {
    id: 'preconstruction-estimate',
    filename: 'preconstruction-estimate.jpg',
    alt: 'Construction estimating workspace with drawings, quantity takeoff, and material references',
    prompt:
      'Editorial construction estimating workspace, detailed building drawings beside an organized quantity takeoff on a laptop, calculator, scale ruler, material samples and trade division tabs, credible professional preconstruction environment, no visible people, no logos, no legible text, realistic daylight, forest green and warm neutral palette, horizontal 3:2 composition',
  },
  {
    id: 'preconstruction-permit',
    filename: 'preconstruction-permit.jpg',
    alt: 'Permit planning review with site plan, code references, and submission documents',
    prompt:
      'Editorial permit planning scene for a real construction project, site plan and architectural sheets organized with code reference books, jurisdiction map, checklist tabs and professional review marks, no visible people, no logos, no legible text, realistic natural light, calm precise atmosphere, forest green and warm neutral palette, horizontal 3:2 composition',
  },
] as const

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

async function generateImage(spec: (typeof imageSpecs)[number]) {
  console.log(`[preconstruction-media] Generating ${spec.id} with Flux`)
  const output = await replicate.run(imageModel, {
    input: {
      prompt: spec.prompt,
      aspect_ratio: '3:2',
      output_format: 'jpg',
      output_quality: 92,
      safety_tolerance: 2,
    },
  })
  const remoteUrl = outputUrl(output)
  if (!remoteUrl.startsWith('http')) throw new Error(`No usable image URL for ${spec.id}`)
  await writeFile(path.join(outputRoot, spec.filename), await download(remoteUrl))
  return { ...spec, model: imageModel, remoteUrl }
}

async function generateVideo(startImageUrl: string) {
  console.log('[preconstruction-media] Generating hero video with Kling 2.5')
  const input = {
    start_image: startImageUrl,
    prompt:
      'Slow cinematic camera movement across the preconstruction design table. Plans, material samples and building model remain physically consistent while soft daylight shifts naturally. Premium architectural documentary style, restrained motion, no people entering frame, no added text, no logos.',
    duration: 5,
    aspect_ratio: '16:9',
  }
  let prediction
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      prediction = await replicate.predictions.create({ model: videoModel, input })
      break
    } catch (error) {
      const status = (error as { response?: { status?: number; headers?: { get?: (name: string) => string | null } } }).response?.status
      if (status !== 429 || attempt === 4) throw error
      const retryAfter = Number(
        (error as { response?: { headers?: { get?: (name: string) => string | null } } })
          .response?.headers?.get?.('retry-after') ?? 2,
      )
      await new Promise((resolve) => setTimeout(resolve, (retryAfter + 1) * 1000))
    }
  }
  if (!prediction) throw new Error('Kling prediction could not be created')

  let current = prediction
  const startedAt = Date.now()
  while (!['succeeded', 'failed', 'canceled'].includes(current.status)) {
    if (Date.now() - startedAt > 8 * 60_000) throw new Error('Kling generation timed out')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    current = await replicate.predictions.get(prediction.id)
  }

  if (current.status !== 'succeeded') {
    throw new Error(`Kling generation ${current.status}: ${String(current.error ?? '')}`)
  }

  const remoteUrl = outputUrl(current.output)
  if (!remoteUrl.startsWith('http')) throw new Error('Kling returned no usable video URL')
  const filename = 'preconstruction-hero.mp4'
  await writeFile(path.join(outputRoot, filename), await download(remoteUrl))
  return { filename, model: videoModel, prompt: (current as any).input?.prompt, remoteUrl }
}

async function main() {
  await mkdir(outputRoot, { recursive: true })
  await mkdir(commandCenterOutputRoot, { recursive: true })

  const images = []
  if (videoOnly) {
    for (const spec of imageSpecs) {
      const localPath = path.join(outputRoot, spec.filename)
      if (!existsSync(localPath)) throw new Error(`Missing generated image: ${localPath}`)
      images.push({ ...spec, model: imageModel, remoteUrl: '' })
    }
  } else {
    for (const spec of imageSpecs) {
      images.push(await generateImage(spec))
    }
  }

  let startImageUrl = images[0].remoteUrl
  if (videoOnly) {
    console.log('[preconstruction-media] Uploading the completed design image for Kling input')
    const imageBytes = readFileSync(path.join(outputRoot, imageSpecs[0].filename))
    const uploaded = await replicate.files.create(imageBytes)
    startImageUrl = String(uploaded.urls?.get)
  }
  const video = skipVideo ? null : await generateVideo(startImageUrl)
  const manifest = {
    id: 'preconstruction-campaign-media',
    provider: 'replicate',
    generatedAt: new Date().toISOString(),
    images: images.map(({ remoteUrl: _remoteUrl, ...image }) => image),
    video: video ? { filename: video.filename, model: video.model, prompt: video.prompt } : null,
  }

  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`
  await writeFile(path.join(outputRoot, 'manifest.json'), manifestJson, 'utf8')
  await writeFile(path.join(commandCenterOutputRoot, 'manifest.json'), manifestJson, 'utf8')
  for (const image of imageSpecs) {
    await writeFile(
      path.join(commandCenterOutputRoot, image.filename),
      readFileSync(path.join(outputRoot, image.filename)),
    )
  }
  if (video) {
    await writeFile(
      path.join(commandCenterOutputRoot, video.filename),
      readFileSync(path.join(outputRoot, video.filename)),
    )
  }
  console.log(`[preconstruction-media] Saved assets to ${outputRoot}`)
}

main().catch((error) => {
  console.error('[preconstruction-media]', error)
  process.exit(1)
})
