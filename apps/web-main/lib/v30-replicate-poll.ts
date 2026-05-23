import Replicate from 'replicate'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const replicate = () =>
  process.env.REPLICATE_API_TOKEN ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN }) : null

/**
 * Poll v30 Replicate prediction IDs and merge output URLs into conceptOutput.renderUrls.
 */
export async function pollV30RenderPredictions(intakeId: string): Promise<string[]> {
  const client = replicate()
  if (!client) return []

  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('form_data, status')
    .eq('id', intakeId)
    .single()

  if (!row) return []

  const formData = (row.form_data as Record<string, unknown>) ?? {}
  const ids = (formData.v30RenderPredictionIds as string[]) ?? []
  if (!ids.length) return []

  const urls: string[] = []
  for (const id of ids) {
    try {
      const prediction = await client.predictions.get(id)
      if (prediction.status === 'succeeded') {
        const url = Array.isArray(prediction.output)
          ? (prediction.output[0] as string)
          : (prediction.output as string)
        if (url) urls.push(url)
      }
    } catch (err: unknown) {
      console.warn('[v30-replicate-poll]', id, err instanceof Error ? err.message : err)
    }
  }

  if (!urls.length) return []

  const conceptOutput = {
    ...((formData.v30ConceptOutput ?? formData.conceptOutput) as Record<string, unknown>),
    renderUrls: urls,
    v30RenderUrls: urls,
  }

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        conceptOutput,
        v30ConceptOutput: conceptOutput,
        v30RendersCompletedAt: new Date().toISOString(),
      },
      status: row.status === 'paid' ? 'concept_ready' : row.status,
    })
    .eq('id', intakeId)

  return urls
}

/** Poll until all predictions succeed or timeout (server-side). */
export async function pollV30RendersUntilDone(
  intakeId: string,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<string[]> {
  const maxAttempts = options?.maxAttempts ?? 40
  const intervalMs = options?.intervalMs ?? 15_000

  for (let i = 0; i < maxAttempts; i++) {
    const urls = await pollV30RenderPredictions(intakeId)
    const supabase = getSupabaseAdmin()
    const { data: row } = await supabase
      .from('public_intake_leads')
      .select('form_data')
      .eq('id', intakeId)
      .single()
    const formData = (row?.form_data as Record<string, unknown>) ?? {}
    const ids = (formData.v30RenderPredictionIds as string[]) ?? []
    if (urls.length >= Math.min(ids.length, 1)) return urls
    await new Promise(r => setTimeout(r, intervalMs))
  }
  return pollV30RenderPredictions(intakeId)
}
