/**
 * Generate Design + Permit campaign media with the platform's Replicate account.
 * Falls back to local high-quality service photos and video loops if Replicate credentials/credits fail.
 *
 * From repo root:
 *   pnpm --filter web-main exec tsx scripts/generate-design-permit-campaign-media.ts
 *   pnpm --filter web-main exec tsx scripts/generate-design-permit-campaign-media.ts --skip-video
 */
import { existsSync, readFileSync } from 'fs'
import { mkdir, writeFile, copyFile } from 'fs/promises'
import path from 'path'
import Replicate from 'replicate'

const webMainRoot = path.join(__dirname, '..')
const outputRoot = path.join(webMainRoot, 'public', 'media', 'campaigns', 'design-permit')
const imagesDir = path.join(outputRoot, 'images')
const videoDir = path.join(outputRoot, 'video')

const skipVideo = process.argv.includes('--skip-video')
const videoOnly = process.argv.includes('--video-only')

// Load environment variables from apps/web-main/.env.local or .env
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

const imageSpecs = [
  {
    id: 'design',
    filename: 'design.jpg',
    localSource: 'home-design.jpg',
    alt: 'Architectural concept development workspace for a residential design concept review',
    prompt:
      'Editorial architectural photography of a modern, clean, bubbly, and enterprise-grade home design concept review. Coherent floor plans and 3D renderings shown on a tablet, material samples, and color palette swatches, beautiful warm daylight, DMV-style residential interior background, no people, no logos, horizontal 3:2 composition.',
  },
  {
    id: 'permit',
    filename: 'permit.jpg',
    localSource: 'home-permits.jpg',
    alt: 'Permit filing review scene with construction drawings and county documents',
    prompt:
      'Editorial photography of a permit filing review scene. Construction drawings and local county permit documents with submission stamps (DC, Montgomery County MD, Fairfax County VA), local zoning map, checklist, precise professional review environment, realistic light, warm modern palette, no people, no logos, horizontal 3:2 composition.',
  },
  {
    id: 'combined',
    filename: 'combined.jpg',
    localSource: 'home-estimate.jpg',
    alt: 'Complete construction development planning set with concept, estimate, and permits',
    prompt:
      'Editorial architectural photography of a complete construction development lifecycle planning set. Floor plans, cost estimate documents, and permit filing packages on a sleek office desk, representing a DMV renovation project, warm natural daylight, professional clean aesthetic, horizontal 3:2 composition.',
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

async function main() {
  await mkdir(outputRoot, { recursive: true })
  await mkdir(imagesDir, { recursive: true })
  await mkdir(videoDir, { recursive: true })

  const images = []
  const hasReplicateToken = !!process.env.REPLICATE_API_TOKEN
  const replicate = hasReplicateToken ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN }) : null
  const imageModel = 'black-forest-labs/flux-1.1-pro-ultra'
  const videoModel = 'kwaivgi/kling-v2.5-turbo-pro'

  if (videoOnly) {
    for (const spec of imageSpecs) {
      const localPath = path.join(imagesDir, spec.filename)
      if (!existsSync(localPath)) throw new Error(`Missing generated image: ${localPath}`)
      images.push({ id: spec.id, filename: spec.filename, alt: spec.alt, prompt: spec.prompt, model: 'local-cached', remoteUrl: '' })
    }
  } else {
    for (const spec of imageSpecs) {
      let imageGenerated = false
      if (replicate) {
        try {
          console.log(`[design-permit-media] Attempting Replicate Flux for ${spec.id}`)
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
          if (remoteUrl.startsWith('http')) {
            await writeFile(path.join(imagesDir, spec.filename), await download(remoteUrl))
            images.push({ id: spec.id, filename: spec.filename, alt: spec.alt, prompt: spec.prompt, model: imageModel, remoteUrl })
            imageGenerated = true
          }
        } catch (err: any) {
          console.warn(`[design-permit-media] Replicate image generation failed for ${spec.id}: ${err?.message || err}. Using local photo fallback.`)
        }
      }

      if (!imageGenerated) {
        // Fallback: copy local home-*.jpg
        const localSourcePath = path.join(webMainRoot, 'public', 'media', 'service-photos', spec.localSource)
        console.log(`[design-permit-media] Copying local fallback photo from ${spec.localSource}`)
        if (existsSync(localSourcePath)) {
          await copyFile(localSourcePath, path.join(imagesDir, spec.filename))
          images.push({ id: spec.id, filename: spec.filename, alt: spec.alt, prompt: spec.prompt, model: 'local-photo-fallback', remoteUrl: '' })
        } else {
          throw new Error(`Fallback source image not found at ${localSourcePath}`)
        }
      }
    }
  }

  let video = null
  if (!skipVideo) {
    let startImageUrl = images[0].remoteUrl
    let generatedVideoOk = false

    if (replicate && startImageUrl && startImageUrl.startsWith('http')) {
      try {
        console.log('[design-permit-media] Attempting Replicate Kling for video')
        const input = {
          start_image: startImageUrl,
          prompt:
            'Slow cinematic camera movement across the design table. Plans, material samples and building model remain physically consistent while soft daylight shifts naturally. Premium architectural documentary style, restrained motion, no people entering frame, no added text, no logos.',
          duration: 5,
          aspect_ratio: '16:9',
        }
        let prediction
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          try {
            prediction = await replicate.predictions.create({ model: videoModel, input })
            break
          } catch (error) {
            const status = (error as any).response?.status
            if (status !== 429 || attempt === 2) throw error
            await new Promise((resolve) => setTimeout(resolve, 3000))
          }
        }

        if (prediction) {
          let current = prediction
          const startedAt = Date.now()
          while (!['succeeded', 'failed', 'canceled'].includes(current.status)) {
            if (Date.now() - startedAt > 8 * 60_000) throw new Error('Kling generation timed out')
            await new Promise((resolve) => setTimeout(resolve, 5000))
            current = await replicate.predictions.get(prediction.id)
          }

          if (current.status === 'succeeded') {
            const remoteUrl = outputUrl(current.output)
            if (remoteUrl.startsWith('http')) {
              await writeFile(path.join(videoDir, 'hero.mp4'), await download(remoteUrl))
              video = { filename: 'hero.mp4', model: videoModel, prompt: input.prompt }
              generatedVideoOk = true
            }
          }
        }
      } catch (err: any) {
        console.warn(`[design-permit-media] Replicate video generation failed: ${err?.message || err}. Using local fallback.`)
      }
    }

    if (!generatedVideoOk) {
      console.log('[design-permit-media] Copying local home-design-video.mp4 as fallback video')
      const localSrcVideo = path.join(webMainRoot, 'public', 'media', 'service-videos', 'home-design-video.mp4')
      if (existsSync(localSrcVideo)) {
        await copyFile(localSrcVideo, path.join(videoDir, 'hero.mp4'))
        video = { filename: 'hero.mp4', model: 'local-fallback', prompt: 'Fallback video from local design loop' }
      } else {
        console.warn('[design-permit-media] Local fallback video not found at', localSrcVideo)
      }
    }
  }

  const manifest = {
    id: 'design-permit-campaign-media',
    provider: 'local-resources',
    generatedAt: new Date().toISOString(),
    images: images.map(img => ({
      id: img.id,
      filename: `images/${img.filename}`,
      alt: img.alt,
      prompt: img.prompt,
      model: img.model
    })),
    video: video ? {
      filename: `video/${video.filename}`,
      model: video.model,
      prompt: video.prompt
    } : null,
  }

  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`
  await writeFile(path.join(outputRoot, 'manifest.json'), manifestJson, 'utf8')
  console.log(`[design-permit-media] Saved assets & manifest to ${outputRoot}`)
}

main().catch((error) => {
  console.error('[design-permit-media]', error)
  process.exit(1)
})
