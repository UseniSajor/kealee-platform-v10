import Replicate from 'replicate'
import {
  buildConceptVisualPrompt,
  type ConceptVisualInput,
} from '@kealee/marketing-agency'
import { downloadUrlToBuffer, uploadMarketingAsset } from '@/lib/marketing/card-media-storage'

export interface GeneratedConceptVisual {
  storageUrl: string
  promptUsed: string
  provider: string
  model: string
}

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN?.trim())
}

export async function generateConceptVisualWithReplicate(
  input: ConceptVisualInput,
): Promise<GeneratedConceptVisual> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN not configured')

  const prompt = buildConceptVisualPrompt(input)
  const replicate = new Replicate({ auth: token })

  let prediction = await replicate.predictions.create({
    model: 'black-forest-labs/flux-1.1-pro-ultra',
    input: {
      prompt,
      aspect_ratio: '16:9',
      raw: false,
      safety_tolerance: 2,
    },
  })

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    prediction.status !== 'canceled'
  ) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    prediction = await replicate.predictions.get(prediction.id)
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`Replicate failed: ${prediction.error ?? prediction.status}`)
  }

  const out = prediction.output
  const remoteUrl = Array.isArray(out) ? String(out[0]) : String(out)
  if (!remoteUrl) throw new Error('Replicate returned no image')

  const bytes = await downloadUrlToBuffer(remoteUrl)
  const id = `concept-${input.service_type}-${Date.now()}`
  const storageUrl = await uploadMarketingAsset('product', id, bytes, 'jpg')

  return {
    storageUrl,
    promptUsed: prompt,
    provider: 'replicate',
    model: 'black-forest-labs/flux-1.1-pro-ultra',
  }
}
