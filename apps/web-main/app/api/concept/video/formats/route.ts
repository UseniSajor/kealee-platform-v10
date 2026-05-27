/**
 * POST /api/concept/video/formats
 * Body: { intakeId: string }
 *
 * Idempotent — trims the completed master concept video into 30s, 15s, and
 * 10s cuts for Premium+ (tier 3) orders, then writes the URLs back to
 * conceptOutput.videoFormatUrls in Supabase.
 *
 * Called as fire-and-forget from /api/concept/video GET once the master
 * stitch completes. Safe to call multiple times — skips if formats are
 * already trimmed (detected by '30s Mobile' differing from '60s Full').
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { resolveConceptTier } from '@kealee/core-rules'
import { downloadUrlToBuffer } from '@/lib/marketing/card-media-storage'
import { trimMp4ToSeconds } from '@/lib/marketing/video-stitch'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'
export const maxDuration = 120 // trim + upload can take up to 90s for large masters

const VIDEO_FORMATS: Array<{ label: string; seconds: number; fileName: string }> = [
  { label: '30s Mobile',  seconds: 30, fileName: 'format-30s.mp4'  },
  { label: '15s Social',  seconds: 15, fileName: 'format-15s.mp4'  },
  { label: '10s Preview', seconds: 10, fileName: 'format-10s.mp4'  },
]

async function uploadFormatVideo(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  intakeId: string,
  fileName: string,
  bytes: Buffer,
): Promise<string> {
  const bucket   = process.env.SUPABASE_CONCEPT_VIDEO_BUCKET?.trim() || 'concept-videos'
  const filePath = `${intakeId}/${fileName}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, bytes, { contentType: 'video/mp4', upsert: true })

  if (error) throw new Error(`Storage upload failed (${bucket}/${filePath}): ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { intakeId?: string }
    const { intakeId } = body

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

    const formData      = (intake.form_data ?? {}) as Record<string, unknown>
    const tier          = resolveConceptTier(formData, { projectPath: intake.project_path as string })
    const conceptVideo  = formData.conceptVideo as { status?: string; outputUrl?: string } | undefined
    const conceptOutput = formData.conceptOutput as Record<string, unknown> | undefined

    if (tier < 3) {
      return NextResponse.json({ skipped: true, reason: 'not tier 3' })
    }

    if (!conceptVideo?.outputUrl || conceptVideo.status !== 'completed') {
      return NextResponse.json({ skipped: true, reason: 'master video not yet complete' })
    }

    const masterUrl     = conceptVideo.outputUrl
    const existingFmts  = conceptOutput?.videoFormatUrls as Record<string, string> | undefined

    // Idempotency: if the 30s format is already a different URL from the 60s
    // master, trimming was done in a previous invocation — skip.
    if (
      existingFmts?.['30s Mobile'] &&
      existingFmts['30s Mobile'] !== existingFmts?.['60s Full'] &&
      existingFmts['30s Mobile'] !== masterUrl
    ) {
      return NextResponse.json({ skipped: true, reason: 'formats already generated' })
    }

    // Download master video bytes once — reused for all three trim jobs
    let masterBytes: Buffer
    try {
      masterBytes = await downloadUrlToBuffer(masterUrl)
    } catch (dlErr) {
      console.error('[video/formats] Failed to download master:', dlErr)
      return NextResponse.json(
        { error: 'Could not download master video', detail: String(dlErr) },
        { status: 502 },
      )
    }

    const formatUrls: Record<string, string> = { '60s Full': masterUrl }

    for (const fmt of VIDEO_FORMATS) {
      try {
        const trimmed = await trimMp4ToSeconds(masterBytes, fmt.seconds)
        if (trimmed) {
          formatUrls[fmt.label] = await uploadFormatVideo(supabase, intakeId, fmt.fileName, trimmed)
          console.log(`[video/formats] ${fmt.label} uploaded for ${intakeId}`)
        } else {
          // FFmpeg unavailable — fall back to master URL
          formatUrls[fmt.label] = masterUrl
          console.warn(`[video/formats] FFmpeg unavailable for ${fmt.label}, using master URL`)
        }
      } catch (fmtErr) {
        console.warn(`[video/formats] ${fmt.label} trim/upload failed:`, fmtErr)
        formatUrls[fmt.label] = masterUrl
      }
    }

    // Write format URLs back to conceptOutput — preserves all other fields
    const updatedConceptOutput = {
      ...conceptOutput,
      videoUrl: masterUrl,
      videoFormatUrls: formatUrls,
    }

    const { error: updateErr } = await supabase
      .from('public_intake_leads')
      .update({ form_data: { ...formData, conceptOutput: updatedConceptOutput } })
      .eq('id', intakeId)

    if (updateErr) {
      console.error('[video/formats] DB update failed:', updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    const formatsReady = Object.values(formatUrls).some(u => u !== masterUrl)
    return NextResponse.json({ ok: true, formatsReady, formatUrls })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[video/formats] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
