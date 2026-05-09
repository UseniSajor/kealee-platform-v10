/**
 * POST /api/concept/video      — Submit a video-generation job for an intake.
 * GET  /api/concept/video?intakeId=… — Poll status / fetch URL when ready.
 *
 * Provider auto-pick (lib/ai-video.ts): Sora 2 Pro → Veo 3.1 → Kling 2.5,
 * based on which API key is configured. Force a provider with the
 * `VIDEO_PROVIDER` env var or the `provider` request body field.
 *
 * State is stored on `public_intake_leads.form_data.conceptVideo`:
 *   {
 *     status:       'pending' | 'processing' | 'completed' | 'failed',
 *     provider:     VideoProvider,
 *     jobId:        string,
 *     outputUrl?:   string,
 *     model?:       string,
 *     startedAt:    ISO string,
 *     completedAt?: ISO string,
 *     error?:       string,
 *   }
 *
 * The intake `status` itself stays `'concept_ready'` — video is supplemental.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { TIER_VIDEO_DEFAULTS, type VideoProvider } from '@kealee/core-rules'
import {
  generateVideo,
  getVideoStatus,
  buildArchitecturalVideoPrompt,
  pickVideoProvider,
  downloadSoraVideo,
} from '@/lib/ai-video'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PAID_INTAKE_STATUSES = new Set(['paid', 'concept_ready', 'processing'])

interface ConceptVideoState {
  status:       'pending' | 'processing' | 'completed' | 'failed'
  provider:     VideoProvider
  jobId:        string
  outputUrl?:   string
  model?:       string
  startedAt:    string
  completedAt?: string
  error?:       string
}

// ── POST — start a video generation job ─────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
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

    const formData    = (intake.form_data ?? {}) as Record<string, unknown>
    const tier        = typeof formData.tier === 'number' ? formData.tier : 1
    const tierKey     = (tier === 3 ? 3 : tier === 2 ? 2 : 1) as 1 | 2 | 3
    const tierDefault = TIER_VIDEO_DEFAULTS[tierKey]

    if (!tierDefault) {
      return NextResponse.json(
        { error: 'Video not included in this tier', tier: tierKey },
        { status: 400 },
      )
    }

    const existing = formData.conceptVideo as ConceptVideoState | undefined
    if (existing && existing.status === 'completed' && !regenerate) {
      return NextResponse.json({ ...existing, cached: true })
    }

    const conceptOutput = formData.conceptOutput as Record<string, any> | undefined
    const style    = (conceptOutput?.designConcept?.style as string) ?? 'modern'
    const roomType = inferRoomType(intake.project_path as string)
    const prompt   = buildArchitecturalVideoPrompt({
      style,
      roomType,
      motion: 'reveal',
      extra:  conceptOutput?.description as string | undefined,
    })

    // Use first render image as the starting frame when available
    const renderUrls = (conceptOutput?.renderUrls as string[] | undefined) ?? []
    const inputImageUrl = renderUrls[0]

    let provider: VideoProvider
    try {
      provider = providerOverride ?? tierDefault ?? pickVideoProvider()
    } catch (err) {
      return NextResponse.json(
        { error: 'No video provider configured', message: String((err as Error).message) },
        { status: 503 },
      )
    }

    const result = await generateVideo({
      prompt,
      inputImageUrl,
      durationSec: provider === 'kling-2.5' ? 5 : 8,
      size:        provider === 'sora-2-pro' ? '1920x1080' : '1280x720',
      aspectRatio: '16:9',
      provider,
    })

    const state: ConceptVideoState = {
      status:    'processing',
      provider:  result.provider,
      jobId:     result.jobId,
      model:     result.modelVersion,
      startedAt: new Date().toISOString(),
    }

    await supabase
      .from('public_intake_leads')
      .update({ form_data: { ...formData, conceptVideo: state } })
      .eq('id', intakeId)

    return NextResponse.json(state, { status: 202 })
  } catch (err: any) {
    console.error('[concept/video POST]', err?.message ?? err)
    return NextResponse.json(
      { error: 'Failed to start video generation', message: err?.message },
      { status: 500 },
    )
  }
}

// ── GET — poll status and lazily mirror completed Sora bytes to storage ────

export async function GET(req: NextRequest) {
  try {
    const intakeId = req.nextUrl.searchParams.get('intakeId')
    if (!intakeId) {
      return NextResponse.json({ error: 'intakeId is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: intake, error: fetchErr } = await supabase
      .from('public_intake_leads')
      .select('form_data')
      .eq('id', intakeId)
      .single()

    if (fetchErr || !intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    const formData = (intake.form_data ?? {}) as Record<string, unknown>
    const state    = formData.conceptVideo as ConceptVideoState | undefined

    if (!state) {
      return NextResponse.json({ status: 'not_started' })
    }
    if (state.status === 'completed' || state.status === 'failed') {
      return NextResponse.json(state)
    }

    // Poll provider for live status
    const live = await getVideoStatus(state.provider, state.jobId)

    let next: ConceptVideoState = { ...state, status: live.status, error: live.error }

    if (live.status === 'completed' && live.outputUrl) {
      let publicUrl = live.outputUrl

      // Sora returns binary content — mirror to Supabase Storage so the
      // browser can render it directly.
      if (publicUrl.startsWith('openai://')) {
        const sceneId = publicUrl.replace('openai://', '')
        try {
          const bytes = await downloadSoraVideo(sceneId)
          publicUrl   = await uploadVideoToStorage(supabase, intakeId, bytes)
        } catch (mirrorErr: any) {
          next = { ...next, status: 'failed', error: `Mirror failed: ${mirrorErr?.message}` }
        }
      }

      if (next.status === 'completed') {
        next = { ...next, outputUrl: publicUrl, completedAt: new Date().toISOString() }
      }
    }

    if (next.status !== state.status || next.outputUrl !== state.outputUrl) {
      await supabase
        .from('public_intake_leads')
        .update({ form_data: { ...formData, conceptVideo: next } })
        .eq('id', intakeId)
    }

    return NextResponse.json(next)
  } catch (err: any) {
    console.error('[concept/video GET]', err?.message ?? err)
    return NextResponse.json({ error: 'Failed to poll video status' }, { status: 500 })
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function inferRoomType(projectPath: string): string {
  if (projectPath.includes('kitchen'))  return 'kitchen'
  if (projectPath.includes('bath'))     return 'bathroom'
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
