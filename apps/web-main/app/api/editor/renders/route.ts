/**
 * POST /api/editor/renders
 *
 * Queue an AI render generation job using Replicate (Stable Diffusion XL).
 * Replicate is already a dependency in web-main.
 *
 * Body:
 *   sceneId     — Pascal scene id
 *   userId      — User id (optional)
 *   renderMode  — 'realistic' | 'cinematic' | 'sketch' | 'standard'
 *   style       — 'modern' | 'farmhouse' | 'contemporary' | 'luxury' | etc.
 *   roomType    — 'kitchen' | 'bathroom' | 'living' | 'bedroom' | 'exterior'
 *   prompt      — Additional user prompt (optional)
 *   inputImageUrl — Screenshot or uploaded image (optional; for img2img)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Replicate from 'replicate'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

// Stable Diffusion XL — img2img for architectural renders
const SDXL_VERSION = 'stability-ai/sdxl:39ed52f2319f9bfb5cc8a19eccf9d8e90261c2a7c5e31e1dab895d29fba1aa4'

function buildPrompt(style: string, roomType: string, renderMode: string, extra?: string): string {
  const styleMap: Record<string, string> = {
    modern:       'modern minimalist, clean lines, white and gray palette, high-end materials',
    farmhouse:    'modern farmhouse, shiplap walls, warm wood tones, cozy aesthetic',
    contemporary: 'contemporary design, bold textures, mixed materials, sophisticated',
    luxury:       'ultra-luxury, marble surfaces, designer fixtures, premium finishes',
    traditional:  'traditional style, crown molding, warm wood cabinets, classic elegance',
    industrial:   'industrial aesthetic, exposed brick, metal accents, concrete floors',
    coastal:      'coastal style, white and blue palette, natural wood, beachy feel',
  }

  const qualityMap: Record<string, string> = {
    sketch:    'architectural sketch, hand-drawn, clean line art',
    standard:  'architectural visualization, professional render',
    realistic: 'photorealistic interior design, 8K, professional photography',
    cinematic: 'cinematic architectural photography, dramatic lighting, bokeh, magazine quality',
  }

  const styleDesc = styleMap[style] ?? 'modern design'
  const qualityDesc = qualityMap[renderMode] ?? 'professional render'
  const room = roomType.replace(/_/g, ' ')

  return [
    `${qualityDesc}, ${styleDesc} ${room},`,
    'beautiful interior design, professional architectural visualization,',
    'high quality, detailed,',
    extra?.trim(),
  ].filter(Boolean).join(' ')
}

function buildNegativePrompt(): string {
  return 'ugly, blurry, low quality, distorted, unrealistic proportions, bad architecture, deformed, watermark, text, logo, oversaturated, dark, gloomy'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      sceneId,
      userId,
      renderMode = 'realistic',
      style = 'modern',
      roomType = 'living',
      prompt: extraPrompt,
      inputImageUrl,
    } = body

    if (!sceneId) return NextResponse.json({ error: 'sceneId required' }, { status: 400 })

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'AI rendering not configured' }, { status: 503 })
    }

    const supabase = getSupabaseAdmin()

    // Create render job record
    const { data: job, error: dbError } = await supabase
      .from('pascal_render_jobs')
      .insert({
        scene_id:       sceneId,
        user_id:        userId ?? null,
        render_mode:    renderMode.toUpperCase(),
        style,
        room_type:      roomType,
        prompt:         extraPrompt ?? null,
        input_image_url: inputImageUrl ?? null,
        status:         'PENDING',
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Build prompt
    const fullPrompt = buildPrompt(style, roomType, renderMode, extraPrompt)
    const negativePrompt = buildNegativePrompt()

    // Submit to Replicate (non-blocking — poll via /api/editor/renders/[id])
    const replicateInput: Record<string, unknown> = {
      prompt:          fullPrompt,
      negative_prompt: negativePrompt,
      num_outputs:     2,
      guidance_scale:  7.5,
      num_inference_steps: renderMode === 'cinematic' ? 50 : 30,
      width:  1024,
      height: 768,
    }

    if (inputImageUrl) {
      replicateInput.image          = inputImageUrl
      replicateInput.prompt_strength = 0.65  // 35% original image preservation
    }

    // Fire prediction async
    replicate.predictions.create({
      version: SDXL_VERSION,
      input: replicateInput,
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/editor/renders/webhook`,
      webhook_events_filter: ['completed'],
    }).then(prediction => {
      supabase.from('pascal_render_jobs')
        .update({ external_job_id: prediction.id, status: 'PROCESSING', model_version: SDXL_VERSION })
        .eq('id', job.id)
        .then(() => {})
    }).catch(err => {
      console.error('[renders] Replicate submit failed:', err)
      supabase.from('pascal_render_jobs')
        .update({ status: 'FAILED', error_msg: String(err) })
        .eq('id', job.id)
        .then(() => {})
    })

    return NextResponse.json({ jobId: job.id, status: 'PENDING' }, { status: 202 })
  } catch (err) {
    console.error('[editor/renders POST]', err)
    return NextResponse.json({ error: 'Failed to queue render' }, { status: 500 })
  }
}
