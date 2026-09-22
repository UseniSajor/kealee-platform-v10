import { getSupabaseAdmin } from '@/lib/supabase-server'
import { generateImages, buildArchitecturalPrompt } from '@/lib/ai-image'

/** A customer photograph the intake labelled — the "before" of a before/after pair. */
export interface ReferencePhoto {
  url: string
  label: string
  area?: string
  viewpoint?: string
}

/** One queued viewpoint-locked render, persisted as form_data.v30RenderPairs until it resolves. */
export interface QueuedRenderPair {
  predictionId: string
  beforeUrl: string
  label: string
  area?: string
  viewpoint?: string
}

const MAX_FREE_RENDERS = 6
const MAX_PAIRED_RENDERS = 3

/**
 * Pick the customer's photographs that can anchor a before/after pair: image
 * uploads with a label or viewpoint from the intake form (uploadedFileMeta).
 */
export function referencePhotosFromFormData(formData: Record<string, unknown>): ReferencePhoto[] {
  const meta = Array.isArray(formData.uploadedFileMeta) ? (formData.uploadedFileMeta as Array<Record<string, unknown>>) : []
  return meta
    .filter(f => typeof f.url === 'string' && /^https?:\/\//i.test(String(f.url)))
    .filter(f => f.type !== 'video' && f.type !== 'document')
    .filter(f => Boolean(f.label) || Boolean(f.viewpoint))
    .map(f => ({
      url: String(f.url),
      label: String(f.label ?? f.name ?? 'Existing'),
      area: f.area != null && f.area !== '' ? String(f.area) : undefined,
      viewpoint: f.viewpoint != null && f.viewpoint !== '' ? String(f.viewpoint) : undefined,
    }))
    .slice(0, MAX_PAIRED_RENDERS)
}

/**
 * The before/after standard (docs/system/concept-package-deliverables.md):
 * the after view must share the customer photograph's viewpoint and geometry.
 * The photograph goes in as the img2img reference; the prompt pins the camera.
 */
export function buildViewpointLockedPrompt(photo: ReferencePhoto, conceptPrompt: string, roomType: string): string {
  const where = [photo.area, photo.label].filter(Boolean).join(' — ')
  return buildArchitecturalPrompt({
    roomType,
    style: 'modern',
    renderMode: 'realistic',
    extra: [
      `Re-render the reference photograph (${where}) as the proposed design concept.`,
      photo.viewpoint ? `Camera position and viewpoint: ${photo.viewpoint}.` : 'Keep the exact camera position of the reference photograph.',
      'Keep the same viewpoint, lens, room geometry, window and door openings, ceiling height and structural walls as the photograph;',
      'change only finishes, fixtures, cabinetry, furniture and lighting to match the concept.',
      conceptPrompt,
    ].join(' '),
  })
}

/**
 * Queue Replicate renders from v30 DesignBot imagePrompts (Pascal editor optional; renders are Replicate-only).
 * When the intake carries labelled photographs, one extra render per photograph
 * is queued img2img from that photograph so the package can show a before/after
 * pair from the same viewpoint.
 */
export async function queueV30DesignRenders(
  intakeId: string,
  imagePrompts: string[],
  roomType = 'kitchen',
): Promise<string[]> {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.warn('[v30-renders] REPLICATE_API_TOKEN missing — skip renders')
    return []
  }

  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', intakeId)
    .single()
  const formData = (row?.form_data as Record<string, unknown>) ?? {}

  const prompts = imagePrompts.filter(Boolean).slice(0, MAX_FREE_RENDERS)
  const predictionIds: string[] = []

  for (const raw of prompts) {
    try {
      const prompt = buildArchitecturalPrompt({
        roomType,
        style: 'modern',
        renderMode: 'realistic',
        extra: raw,
      })
      const job = await generateImages({ prompt, count: 1 })
      predictionIds.push(job.predictionId)
    } catch (err: unknown) {
      console.warn('[v30-renders] submit failed:', err instanceof Error ? err.message : err)
    }
  }

  // Before/after pairs — the recommended concept's first prompt, rendered from
  // each labelled customer photograph with the camera locked to that photo.
  const pairs: QueuedRenderPair[] = []
  const conceptPrompt = prompts[0]
  if (conceptPrompt) {
    for (const photo of referencePhotosFromFormData(formData)) {
      try {
        const job = await generateImages({
          prompt: buildViewpointLockedPrompt(photo, conceptPrompt, roomType),
          inputImageUrl: photo.url,
          count: 1,
        })
        pairs.push({ predictionId: job.predictionId, beforeUrl: photo.url, label: photo.label, area: photo.area, viewpoint: photo.viewpoint })
      } catch (err: unknown) {
        console.warn('[v30-renders] paired submit failed:', photo.label, err instanceof Error ? err.message : err)
      }
    }
  }

  if (!predictionIds.length && !pairs.length) return []

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        v30RenderPredictionIds: [...predictionIds, ...pairs.map(p => p.predictionId)],
        v30RenderPairs: pairs,
        v30RenderProvider: 'replicate-flux',
        v30RendersQueuedAt: new Date().toISOString(),
      },
    })
    .eq('id', intakeId)

  return [...predictionIds, ...pairs.map(p => p.predictionId)]
}
