import { getSupabaseAdmin } from '@/lib/supabase-server'
import { generateImages, buildArchitecturalPrompt } from '@/lib/ai-image'

/**
 * Queue Replicate renders from v30 DesignBot imagePrompts (Pascal editor optional; renders are Replicate-only).
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

  const prompts = imagePrompts.filter(Boolean).slice(0, 6)
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

  if (!predictionIds.length) return []

  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', intakeId)
    .single()

  const formData = (row?.form_data as Record<string, unknown>) ?? {}
  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        v30RenderPredictionIds: predictionIds,
        v30RenderProvider: 'replicate-flux',
        v30RendersQueuedAt: new Date().toISOString(),
      },
    })
    .eq('id', intakeId)

  return predictionIds
}
