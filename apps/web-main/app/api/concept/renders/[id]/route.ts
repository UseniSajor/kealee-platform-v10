/**
 * GET /api/concept/renders/[id]
 *
 * Polls a Replicate prediction by its ID and returns current status + output URL.
 * Used by the concept portal to check AI render jobs stored in form_data.renderJobs.
 *
 * Auth note: Replicate prediction IDs are unguessable UUIDs issued per-job.
 * No additional auth layer is needed here.
 */

import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export const dynamic = 'force-dynamic'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Image generation not configured' }, { status: 503 })
  }

  try {
    const prediction = await replicate.predictions.get(params.id)

    if (prediction.status === 'succeeded') {
      const outputUrl = Array.isArray(prediction.output)
        ? (prediction.output[0] as string)
        : (prediction.output as string)
      return NextResponse.json({ status: 'completed', outputUrl })
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return NextResponse.json({ status: 'failed', error: prediction.error ?? 'Prediction failed' })
    }

    // still starting / processing
    return NextResponse.json({ status: 'processing' })
  } catch (err: any) {
    console.error('[concept/renders/[id]]', err?.message)
    return NextResponse.json({ error: 'Failed to fetch render status' }, { status: 500 })
  }
}
