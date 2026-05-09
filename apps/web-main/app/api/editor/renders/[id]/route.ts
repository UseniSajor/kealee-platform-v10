/**
 * GET /api/editor/renders/[id]  — Poll render job status
 *
 * Returns current status and output URLs when completed.
 * If still PROCESSING, also polls Replicate for live status.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Replicate from 'replicate'

export const dynamic = 'force-dynamic'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabaseAdmin()
    const { data: job, error } = await supabase
      .from('pascal_render_jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // If still processing and we have a Replicate job ID, poll for updates
    if (job.status === 'PROCESSING' && job.external_job_id && process.env.REPLICATE_API_TOKEN) {
      try {
        const prediction = await replicate.predictions.get(job.external_job_id)

        if (prediction.status === 'succeeded' && Array.isArray(prediction.output)) {
          await supabase.from('pascal_render_jobs')
            .update({
              status:      'COMPLETED',
              output_urls: prediction.output as string[],
              duration_ms: prediction.metrics?.predict_time ? Math.round(prediction.metrics.predict_time * 1000) : null,
            })
            .eq('id', params.id)

          return NextResponse.json({
            jobId:     params.id,
            status:    'COMPLETED',
            outputUrls: prediction.output,
          })
        }

        if (prediction.status === 'failed') {
          await supabase.from('pascal_render_jobs')
            .update({ status: 'FAILED', error_msg: prediction.error ?? 'Replicate failed' })
            .eq('id', params.id)

          return NextResponse.json({ jobId: params.id, status: 'FAILED', error: prediction.error })
        }
      } catch {
        // Replicate poll failed — return DB state
      }
    }

    return NextResponse.json({
      jobId:      job.id,
      status:     job.status,
      outputUrls: job.output_urls ?? [],
      renderMode: job.render_mode,
      style:      job.style,
    })
  } catch (err) {
    console.error('[editor/renders/[id] GET]', err)
    return NextResponse.json({ error: 'Failed to fetch render status' }, { status: 500 })
  }
}
