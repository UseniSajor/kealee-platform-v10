/**
 * Concept Image Generator Service
 * Generates concept renderings via Flux 1.1 Pro Ultra on Replicate.
 * Pattern: intake data → build prompt → Replicate prediction → poll → return image URLs
 */

import { Anthropic } from '@anthropic-ai/sdk'

const REPLICATE_MODEL = 'black-forest-labs/flux-1.1-pro-ultra'
const REPLICATE_API_BASE = 'https://api.replicate.com/v1'

// ============================================================================
// Types
// ============================================================================

export interface ConceptImageInput {
  title: string
  description?: string
  styleDirection?: string
  projectType?: string
  existingPhotos?: string[] // URLs to reference photos
}

export interface ConceptImageOutput {
  url: string
  label: string
  caption: string
  prompt: string
  format: 'jpg' | 'png'
}

// ============================================================================
// Prompt Generation
// ============================================================================

function generateImagePrompt(input: ConceptImageInput, type: 'exterior' | 'interior'): string {
  const components: string[] = [
    `Photorealistic architectural ${type} rendering, professional photography style, high detail, natural daylight`,
    `Project: "${input.title}"`,
  ]

  if (input.description) {
    components.push(input.description)
  }

  if (input.styleDirection) {
    components.push(`Style: ${input.styleDirection}`)
  }

  switch (input.projectType) {
    case 'kitchen_remodel':
      if (type === 'interior') {
        components.push(
          'Modern kitchen with high-end appliances, granite counters, custom cabinetry, pendant lighting'
        )
      }
      break
    case 'bathroom_remodel':
      if (type === 'interior') {
        components.push('Spa-like bathroom with custom tile, double vanity, soaking tub, walk-in shower')
      }
      break
    case 'exterior_renovation':
    case 'adu':
    case 'new_construction':
      if (type === 'exterior') {
        components.push('Modern exterior with updated siding, new windows, manicured landscaping, professional lighting')
      }
      break
  }

  components.push('8K resolution, architectural visualization, no watermarks, no text overlays')

  return components.join('. ')
}

// ============================================================================
// Claude Vision-based Image Description
// ============================================================================

export async function generateConceptDescriptionViaVision(
  input: ConceptImageInput,
  existingPhotoUrl?: string
): Promise<string> {
  try {
    const client = new Anthropic()

    if (!existingPhotoUrl) {
      return generateImagePrompt(input, 'interior')
    }

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: existingPhotoUrl,
              },
            },
            {
              type: 'text',
              text: `Analyze this ${input.projectType || 'interior'} space and describe how it should look after the following concept update:

Title: ${input.title}
Description: ${input.description || 'See photo'}
Style Direction: ${input.styleDirection || 'Modern and contemporary'}

Provide a detailed description suitable for generating a photorealistic rendering. Focus on materials, finishes, lighting, and spatial characteristics.`,
            },
          ],
        },
      ],
    })

    const textContent = message.content.find((block) => block.type === 'text')
    return textContent && 'text' in textContent ? textContent.text : generateImagePrompt(input, 'interior')
  } catch (err) {
    console.error('[Image Generation] Vision analysis failed:', err)
    return generateImagePrompt(input, 'interior')
  }
}

// ============================================================================
// Replicate Polling
// ============================================================================

async function pollPrediction(token: string, predictionId: string, maxWaitMs = 120_000): Promise<any> {
  const deadline = Date.now() + maxWaitMs
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 4000))
    const res = await fetch(`${REPLICATE_API_BASE}/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) break
    const prediction = await res.json()
    if (
      prediction.status === 'succeeded' ||
      prediction.status === 'failed' ||
      prediction.status === 'canceled'
    ) {
      return prediction
    }
  }
  return { status: 'failed', error: 'Timed out waiting for Replicate prediction' }
}

// ============================================================================
// Image Generation via Replicate (Flux 1.1 Pro Ultra)
// ============================================================================

export async function generateConceptImages(
  input: ConceptImageInput
): Promise<ConceptImageOutput[]> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    console.warn('[Image Generation] REPLICATE_API_TOKEN not configured — skipping image generation')
    return []
  }

  const jobs: Array<{ prompt: string; label: string; caption: string }> = []

  // Always generate an interior render
  jobs.push({
    prompt: generateImagePrompt(input, 'interior'),
    label: 'Interior Concept',
    caption: `Proposed interior rendering for ${input.title}`,
  })

  // Add exterior render for applicable project types
  const exteriorTypes = ['exterior_renovation', 'adu', 'new_construction', 'addition']
  if (!input.projectType || exteriorTypes.includes(input.projectType)) {
    jobs.push({
      prompt: generateImagePrompt(input, 'exterior'),
      label: 'Exterior Concept',
      caption: `Proposed exterior rendering for ${input.title}`,
    })
  }

  const images: ConceptImageOutput[] = []

  for (const job of jobs) {
    try {
      const submitRes = await fetch(`${REPLICATE_API_BASE}/models/${REPLICATE_MODEL}/predictions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          // Ask Replicate to hold the connection up to 30s before falling through to polling
          Prefer: 'wait=30',
        },
        body: JSON.stringify({
          input: {
            prompt: job.prompt,
            aspect_ratio: '16:9',
            output_format: 'jpg',
            output_quality: 95,
            safety_tolerance: 2,
            raw: false,
          },
        }),
      })

      if (!submitRes.ok) {
        const errBody = await submitRes.text().catch(() => '')
        console.error(`[Image Generation] Submit failed (${submitRes.status}):`, errBody)
        continue
      }

      let prediction = await submitRes.json()

      if (prediction.status !== 'succeeded') {
        prediction = await pollPrediction(token, prediction.id)
      }

      if (prediction.status === 'succeeded' && prediction.output) {
        const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
        images.push({
          url,
          label: job.label,
          caption: job.caption,
          prompt: job.prompt,
          format: 'jpg',
        })
        console.log(`[Image Generation] Generated "${job.label}": ${url}`)
      } else {
        console.warn(`[Image Generation] Prediction failed for "${job.label}":`, prediction.error)
      }
    } catch (err: any) {
      console.error(`[Image Generation] Error generating "${job.label}":`, err?.message)
    }
  }

  return images
}

// ============================================================================
// Store Generated Images
// ============================================================================

export interface StorageResult {
  imageUrls: string[]
  fileUploadIds: string[]
}

export async function storeConceptImages(
  images: ConceptImageOutput[],
  deps: { storage: any; prisma: any }
): Promise<StorageResult> {
  const imageUrls: string[] = []
  const fileUploadIds: string[] = []

  for (const image of images) {
    try {
      const response = await fetch(image.url)
      if (!response.ok) {
        console.warn(`[Image Storage] Failed to fetch image from Replicate: ${image.url}`)
        continue
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      const uploadResult = await deps.storage.uploadFile({
        bucket: 'designs',
        path: `concept-renders/${Date.now()}-${image.label.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        file: buffer,
        contentType: 'image/jpeg',
      })
      imageUrls.push(uploadResult.url)
    } catch (err: any) {
      console.error('[Image Storage] Failed to store concept image:', err?.message)
      // Fall back to using the Replicate CDN URL directly
      imageUrls.push(image.url)
    }
  }

  return { imageUrls, fileUploadIds }
}
