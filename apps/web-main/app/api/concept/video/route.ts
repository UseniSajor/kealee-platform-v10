/**
 * POST /api/concept/video      — Submit process video generation for an intake.
 * GET  /api/concept/video?intakeId=… — Poll status / chain segments / fetch URL.
 *
 * Premium (tier 2): Kling — up to 3 process segments.
 * Premium+ (tier 3): Sora 2 Pro — up to 6 segments, stitched when ffmpeg is available.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { TIER_VIDEO_DEFAULTS, type VideoProvider } from '@kealee/core-rules'
import { resolveConceptTier } from '@kealee/core-rules'
import { getVideoStatus, pickVideoProvider, downloadSoraVideo } from '@/lib/ai-video'
import { archiveReplicateOutputsFireAndForget } from '@/lib/replicate-archive'
import {
  buildDeliverableProcessPlan,
  startNextDeliverableSegment,
  pollCurrentDeliverableSegment,
  finalizeDeliverableStitch,
  type DeliverableProcessVideoState,
} from '@/lib/marketing/process-video-generator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PAID_INTAKE_STATUSES = new Set(['paid', 'concept_ready', 'processing'])

type LegacyConceptVideoState = {
  videoKind?: undefined
  status: 'pending' | 'processing' | 'completed' | 'failed'
  provider: VideoProvider
  jobId: string
  outputUrl?: string
  inputImageUrl?: string
  model?: string
  startedAt: string
  completedAt?: string
  error?: string
}

type ConceptVideoState = LegacyConceptVideoState | DeliverableProcessVideoState

function isProcessState(state: ConceptVideoState): state is DeliverableProcessVideoState {
  return state.videoKind === 'process'
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      intakeId?: string
      provider?: VideoProvider
      regenerate?: boolean
    }

    const { intakeId, provider: providerOverride, regenerate } = body
    if (!intakeId) {
      return NextResponse.json({ error: 'intakeId is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: intake, error: fetchErr } = await supabase
      .from('public_intake_leads')
      .select('id, project_path, status, form_data')
      .eq('id', intakeId)
      .single()

    if (fetchErr || !intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    if (!PAID_INTAKE_STATUSES.has(intake.status as string)) {
      return NextResponse.json(
        { error: 'Payment required', message: 'Video generation is only available after intake payment.' },
        { status: 402 },
      )
    }

    const formData = (intake.form_data ?? {}) as Record<string, unknown>
    const tier = resolveConceptTier(formData, { projectPath: intake.project_path as string })
    const tierKey = tier
    const tierDefault = TIER_VIDEO_DEFAULTS[tierKey]

    if (!tierDefault) {
      return NextResponse.json(
        { error: 'Video not included in this tier', tier: tierKey },
        { status: 400 },
      )
    }

    const conceptOutput = formData.conceptOutput as Record<string, unknown> | undefined
    const style = (conceptOutput?.designConcept as { style?: string } | undefined)?.style ?? 'modern'
    const roomType = inferRoomType(intake.project_path as string)

    const beforeUrls = (conceptOutput?.beforeUrls as string[] | undefined) ?? []
    const interiorRenderUrls = (conceptOutput?.interiorRenderUrls as string[] | undefined) ?? []
    const exteriorRenderUrls = (conceptOutput?.exteriorRenderUrls as string[] | undefined) ?? []
    const renderUrls = (conceptOutput?.renderUrls as string[] | undefined) ?? []
    const inputImageUrl =
      beforeUrls[0] ??
      interiorRenderUrls[0] ??
      exteriorRenderUrls[0] ??
      (formData.selectedRenderUrl as string | undefined) ??
      (formData.coverImageUrl as string | undefined) ??
      renderUrls[0]

    const existing = formData.conceptVideo as ConceptVideoState | undefined
    if (existing?.status === 'processing' && !regenerate) {
      return NextResponse.json(existing, { status: 202 })
    }
    if (
      existing &&
      existing.status === 'completed' &&
      existing.inputImageUrl === inputImageUrl &&
      !regenerate
    ) {
      return NextResponse.json({ ...existing, cached: true })
    }

    let provider: VideoProvider
    try {
      provider = providerOverride ?? tierDefault ?? pickVideoProvider()
    } catch (err) {
      return NextResponse.json(
        { error: 'No video provider configured', message: String((err as Error).message) },
        { status: 503 },
      )
    }

    const plan = buildDeliverableProcessPlan({
      tier: tierKey,
      projectPath: intake.project_path as string,
      provider,
      inputImageUrl,
    })

    if (!plan) {
      return NextResponse.json({ error: 'No process video plan for tier' }, { status: 400 })
    }

    const { state: started, job } = await startNextDeliverableSegment(plan, {
      style,
      roomType,
      inputImageUrl,
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Failed to start process video', state: started },
        { status: 500 },
      )
    }

    await supabase
      .from('public_intake_leads')
      .update({ form_data: { ...formData, conceptVideo: started } })
      .eq('id', intakeId)

    return NextResponse.json(started, { status: 202 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[concept/video POST]', message)
    return NextResponse.json(
      { error: 'Failed to start video generation', message },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const intakeId = req.nextUrl.searchParams.get('intakeId')
    if (!intakeId) {
      return NextResponse.json({ error: 'intakeId is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: intake, error: fetchErr } = await supabase
      .from('public_intake_leads')
      .select('id, project_path, form_data')
      .eq('id', intakeId)
      .single()

    if (fetchErr || !intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    const formData = (intake.form_data ?? {}) as Record<string, unknown>
    let state = formData.conceptVideo as ConceptVideoState | undefined

    if (!state) {
      return NextResponse.json({ status: 'not_started' })
    }

    if (state.status === 'completed' || state.status === 'failed') {
      return NextResponse.json(state)
    }

    if (isProcessState(state)) {
      const conceptOutput = formData.conceptOutput as Record<string, unknown> | undefined
      const style = (conceptOutput?.designConcept as { style?: string } | undefined)?.style ?? 'modern'
      const roomType = inferRoomType(intake.project_path as string)

      const mirror = async (remoteUrl: string) =>
        mirrorVideoUrl(supabase, intakeId, state!.provider, remoteUrl, state as DeliverableProcessVideoState)

      state = await pollCurrentDeliverableSegment(state, mirror)

      const allDone = state.segments.every((s) => s.status === 'completed')
      const needsNext =
        state.currentIndex < state.segments.length &&
        state.segments[state.currentIndex]?.status === 'pending'

      let justFinished = false
      if (needsNext) {
        const { state: nextStarted } = await startNextDeliverableSegment(state, {
          style,
          roomType,
          inputImageUrl: state.inputImageUrl,
        })
        state = nextStarted
      } else if (allDone && !state.outputUrl) {
        state = await finalizeDeliverableStitch(state, (bytes) =>
          uploadVideoToStorage(supabase, intakeId, bytes),
        )
        justFinished = state.status === 'completed' && Boolean(state.outputUrl)
      }

      if (state !== formData.conceptVideo) {
        await supabase
          .from('public_intake_leads')
          .update({ form_data: { ...formData, conceptVideo: state } })
          .eq('id', intakeId)
      }

      // Kick Tier 3 format trimming (30s / 15s / 10s) once master is ready.
      // Fire-and-forget so the GET response is not delayed.
      if (justFinished) {
        const tier = resolveConceptTier(formData, { projectPath: intake.project_path as string })
        if (tier >= 3) {
          const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
          fetch(`${appBaseUrl}/api/concept/video/formats`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ intakeId }),
          }).catch((err: unknown) => {
            console.warn('[concept/video] Tier 3 format kick failed:', (err as Error)?.message ?? err)
          })
        }
      }

      return NextResponse.json(state)
    }

    const legacy = state as LegacyConceptVideoState
    const live = await getVideoStatus(legacy.provider, legacy.jobId)

    const mappedStatus: LegacyConceptVideoState['status'] =
      live.status === 'queued' ? 'pending' : live.status
    let next: LegacyConceptVideoState = { ...legacy, status: mappedStatus, error: live.error }

    if (live.status === 'completed' && live.outputUrl) {
      let publicUrl = live.outputUrl

      if (publicUrl.startsWith('openai://')) {
        const sceneId = publicUrl.replace('openai://', '')
        try {
          const bytes = await downloadSoraVideo(sceneId)
          publicUrl = await uploadVideoToStorage(supabase, intakeId, bytes)
        } catch (mirrorErr: unknown) {
          const msg = mirrorErr instanceof Error ? mirrorErr.message : String(mirrorErr)
          next = { ...next, status: 'failed', error: `Mirror failed: ${msg}` }
        }
      }

      if (next.status === 'completed') {
        next = { ...next, outputUrl: publicUrl, completedAt: new Date().toISOString() }

        if (legacy.provider === 'kling-2.5' && live.outputUrl) {
          archiveReplicateOutputsFireAndForget({
            predictionId: legacy.jobId,
            source: 'concept-video-kling',
            mediaKind: 'video',
            outputUrls: [live.outputUrl],
            model: legacy.model,
            context: { intakeId },
          })
        }
      }
    }

    if (next.status !== legacy.status || next.outputUrl !== legacy.outputUrl) {
      await supabase
        .from('public_intake_leads')
        .update({ form_data: { ...formData, conceptVideo: next } })
        .eq('id', intakeId)
    }

    return NextResponse.json(next)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[concept/video GET]', message)
    return NextResponse.json({ error: 'Failed to poll video status' }, { status: 500 })
  }
}

async function mirrorVideoUrl(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  intakeId: string,
  provider: VideoProvider,
  remoteUrl: string,
  state: DeliverableProcessVideoState,
): Promise<string> {
  if (remoteUrl.startsWith('openai://')) {
    const sceneId = remoteUrl.replace('openai://', '')
    const bytes = await downloadSoraVideo(sceneId)
    return uploadVideoToStorage(supabase, intakeId, bytes)
  }

  if (provider === 'kling-2.5') {
    archiveReplicateOutputsFireAndForget({
      predictionId: state.segments[state.currentIndex]?.jobId ?? '',
      source: 'concept-video-kling',
      mediaKind: 'video',
      outputUrls: [remoteUrl],
      model: state.model,
      context: { intakeId },
    })
  }

  return remoteUrl
}

function inferRoomType(projectPath: string): string {
  if (projectPath.includes('kitchen')) return 'kitchen'
  if (projectPath.includes('bath')) return 'bathroom'
  if (projectPath.includes('garden') || projectPath.includes('landscape')) return 'garden'
  if (projectPath.includes('exterior')) return 'exterior'
  if (projectPath.includes('whole_home') || projectPath.includes('addition')) return 'living'
  return 'interior'
}

async function uploadVideoToStorage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  intakeId: string,
  bytes: Buffer,
): Promise<string> {
  const bucket =
    process.env.SUPABASE_CONCEPT_VIDEO_BUCKET?.trim() || 'concept-videos'
  const filePath = `${intakeId}/${Date.now()}.mp4`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, bytes, { contentType: 'video/mp4', upsert: true })

  if (error) throw new Error(`Storage upload failed (${bucket}): ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
