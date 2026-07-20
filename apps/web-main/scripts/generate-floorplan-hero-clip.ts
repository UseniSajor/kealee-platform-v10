/**
 * Hero video clip: 2D architectural floor plan reveal.
 *
 * Grounded in the platform's actual concept-package deliverable
 * ("2D architectural floor plan with MEP layers" — Premium tier,
 * docs/system/concept-package-deliverables.md) and the required
 * "permit and inspection imagery / blueprints at job site" content
 * category. Flux 1.1 Pro Ultra generates a still of a real printed
 * floor plan on a job-site table, then Kling v2.5 Turbo Pro animates
 * a slow reveal pan — same pipeline as generate-balmoral-walkthrough.ts.
 *
 * Run: pnpm --filter web-main exec tsx scripts/generate-floorplan-hero-clip.ts
 */
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import Replicate from 'replicate'

async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 5): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status !== 429 || i === attempts) throw err
      const wait = 5000 * i
      console.log(`[floorplan-hero] ${label} rate-limited (429), retry ${i}/${attempts} in ${wait}ms...`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw new Error('unreachable')
}

const outDir = process.env.FLOORPLAN_HERO_OUT_DIR ?? path.join(__dirname, '..', 'floorplan-hero-tmp-output')

const IMAGE_PROMPT =
  'Clean white 3D architectural massing model of a whole-home renovation floor plan, isometric cutaway ' +
  'view showing interior wall layout, room divisions, door openings, and roofline, matte white and light ' +
  'grey architectural study model on a wood studio table, soft studio lighting, shallow depth of field, ' +
  'no text, no labels, no signage, pure architectural form, photorealistic product photography, 16:9'

const MOTION_PROMPT =
  'Slow orbiting camera movement around the white architectural model, revealing the interior room layout ' +
  'from a shifting isometric angle, steady and smooth, premium architectural presentation style, no people ' +
  'in frame, no text'

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

  console.log('[floorplan-hero] Generating still image via', imageModel, '...')
  const imgOutput = await withRetry(
    () => replicate.run(imageModel, {
      input: {
        prompt: IMAGE_PROMPT,
        aspect_ratio: '16:9',
        output_format: 'jpg',
        output_quality: 92,
        safety_tolerance: 2,
      },
    }),
    'still image',
  )
  const imageUrl = outputUrl(imgOutput)
  if (!imageUrl.startsWith('http')) throw new Error('No image URL returned')
  console.log('[floorplan-hero] Image ready:', imageUrl)
  await writeFile(path.join(outDir, 'floorplan-still.jpg'), await download(imageUrl))

  console.log('[floorplan-hero] Animating via', videoModel, '...')
  const prediction = await withRetry(
    () => replicate.predictions.create({
      model: videoModel,
      input: {
        start_image: imageUrl,
        prompt: MOTION_PROMPT,
        duration: 5,
        aspect_ratio: '16:9',
      },
    }),
    'video',
  )
  const done = await waitForPrediction(replicate, prediction.id, 8 * 60_000)
  if (done.status !== 'succeeded') throw new Error(`Video generation failed: ${done.status} ${JSON.stringify(done.error)}`)
  const videoUrl = outputUrl(done.output)
  if (!videoUrl.startsWith('http')) throw new Error('No video URL returned')
  console.log('[floorplan-hero] Clip ready:', videoUrl)

  const finalPath = path.join(outDir, 'hero-floorplan.mp4')
  await writeFile(finalPath, await download(videoUrl))
  console.log('\n[floorplan-hero] DONE:', finalPath)
}

main().catch((err) => {
  console.error('[floorplan-hero] FAILED:', err)
  process.exit(1)
})
