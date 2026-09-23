import Replicate from 'replicate'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { onConceptReadyLifecycle } from '@/lib/marketing/lifecycle'
import type { QueuedRenderPair } from '@/lib/v30-replicate-renders'

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
    .select('form_data, status, contact_email, client_name, project_path')
    .eq('id', intakeId)
    .single()

  if (!row) return []

  const formData = (row.form_data as Record<string, unknown>) ?? {}
  const ids = (formData.v30RenderPredictionIds as string[]) ?? []
  if (!ids.length) return []

  const urls: string[] = []
  const urlById = new Map<string, string>()
  let settled = 0
  for (const id of ids) {
    try {
      const prediction = await client.predictions.get(id)
      if (prediction.status === 'succeeded') {
        const url = Array.isArray(prediction.output)
          ? (prediction.output[0] as string)
          : (prediction.output as string)
        if (url) { urls.push(url); urlById.set(id, url) }
      }
      if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') settled += 1
    } catch (err: unknown) {
      console.warn('[v30-replicate-poll]', id, err instanceof Error ? err.message : err)
    }
  }

  lastPollSettled.set(intakeId, { settled, total: ids.length })
  const lifecycle = {
    v30RenderSettledCount: settled,
    v30RenderTotalCount: ids.length,
    ...(ids.length > 0 && settled >= ids.length
      ? { v30RendersSettledAt: new Date().toISOString() }
      : {}),
  }
  if (!urls.length) {
    await supabase
      .from('public_intake_leads')
      .update({ form_data: { ...formData, ...lifecycle } })
      .eq('id', intakeId)
    return []
  }

  // Viewpoint-locked renders resolve into before/after pairs; the customer's
  // photographs they were rendered from become the package's beforeUrls.
  const queuedPairs = Array.isArray(formData.v30RenderPairs) ? (formData.v30RenderPairs as QueuedRenderPair[]) : []
  const beforeAfterPairs = queuedPairs
    .filter(p => urlById.has(p.predictionId))
    .map(p => ({ beforeUrl: p.beforeUrl, afterUrl: urlById.get(p.predictionId)!, label: p.label, area: p.area, viewpoint: p.viewpoint }))
  const previous = (formData.v30ConceptOutput ?? formData.conceptOutput) as Record<string, unknown>
  const beforeUrls = [...new Set([
    ...(Array.isArray(previous?.beforeUrls) ? (previous.beforeUrls as string[]) : []),
    ...beforeAfterPairs.map(p => p.beforeUrl),
  ])]

  const conceptOutput = {
    ...previous,
    renderUrls: urls,
    v30RenderUrls: urls,
    ...(beforeAfterPairs.length ? { beforeAfterPairs, beforeUrls } : {}),
  }

  const becomingReady = row.status === 'paid'
  const nextStatus = becomingReady ? 'concept_ready' : row.status

  await supabase
    .from('public_intake_leads')
    .update({
      form_data: {
        ...formData,
        conceptOutput,
        v30ConceptOutput: conceptOutput,
        v30RendersCompletedAt: new Date().toISOString(),
        ...lifecycle,
        funnelStage: becomingReady ? 'concept_ready' : formData.funnelStage,
      },
      status: nextStatus,
    })
    .eq('id', intakeId)

  if (becomingReady && row.contact_email) {
    void onConceptReadyLifecycle({
      intakeId,
      email: row.contact_email as string,
      clientName: (row.client_name as string) ?? undefined,
      projectPath: (row.project_path as string) ?? 'exterior_concept',
    })
  }

  return urls
}

/** Per-intake settle count from the last poll so the wait loop can stop once every prediction has finished. */
const lastPollSettled = new Map<string, { settled: number; total: number }>()

/** Poll until every prediction has settled (succeeded, failed or canceled) or timeout (server-side). */
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
    // Wait for the whole batch — the viewpoint-locked pairs are queued last and
    // the package's before/after page needs them — but never for an empty one.
    const progress = lastPollSettled.get(intakeId)
    if (ids.length === 0 || (progress && progress.settled >= ids.length)) return urls
    await new Promise(r => setTimeout(r, intervalMs))
  }
  return pollV30RenderPredictions(intakeId)
}
