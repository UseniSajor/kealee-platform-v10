import {
  buildConceptVisualPrompt,
  type ConceptVisualInput,
} from '@kealee/marketing-agency'
import { createMediaRouterFromEnv, waitForMediaJob } from '@kealee/media-router'
import { downloadUrlToBuffer, uploadMarketingAsset } from '@/lib/marketing/card-media-storage'

export interface GeneratedConceptVisual {
  storageUrl: string
  promptUsed: string
  provider: string
  model: string
}

export function isMediaRouterConfigured(): boolean {
  return Boolean(
    process.env.HF_CREDENTIALS?.trim()
    || (process.env.HF_API_KEY_ID?.trim() && process.env.HF_API_KEY_SECRET?.trim())
    || process.env.REPLICATE_API_TOKEN?.trim(),
  )
}

export async function generateConceptVisual(
  input: ConceptVisualInput,
): Promise<GeneratedConceptVisual> {
  const prompt = buildConceptVisualPrompt(input)
  const router = createMediaRouterFromEnv()
  const job = await router.submit({
    kind: 'image',
    intent: input.service_type === 'ADU'
      ? 'development-visualization'
      : 'renovation-visualization',
    prompt,
    aspectRatio: '16:9',
    resolution: '2k',
  })
  const result = await waitForMediaJob(router, job, { timeoutMs: 110_000, intervalMs: 2_000 })
  const remoteUrl = result.outputUrls[0]
  if (!remoteUrl) throw new Error(`${result.provider} returned no image`)

  const bytes = await downloadUrlToBuffer(remoteUrl)
  const id = `concept-${input.service_type}-${Date.now()}`
  const storageUrl = await uploadMarketingAsset('product', id, bytes, 'jpg')

  return {
    storageUrl,
    promptUsed: prompt,
    provider: result.provider,
    model: result.model,
  }
}

// Compatibility exports for existing internal callers during rollout.
export const isReplicateConfigured = isMediaRouterConfigured
export const generateConceptVisualWithReplicate = generateConceptVisual
