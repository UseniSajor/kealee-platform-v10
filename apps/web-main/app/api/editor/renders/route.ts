/**
 * POST /api/editor/renders
 *
 * Queue an AI render generation job.
 *
 * Image model is centralised in @kealee/core-rules AI_MODELS:
 *   • Default text-to-image: Flux 1.1 Pro Ultra (Replicate)
 *   • With input image:      Flux 1.1 Pro (better structural preservation)
 *   • Floor plans / drawings: Recraft V3 (style: 'floor_plan')
 *   • Legacy (back-compat):  Stable Diffusion XL
 *
 * Body:
 *   sceneId       — Pascal scene id (required)
 *   userId        — User id (optional, derived server-side once auth is wired)
 *   renderMode    — 'realistic' | 'cinematic' | 'sketch' | 'standard'
 *   style         — 'modern' | 'farmhouse' | etc.
 *   roomType      — 'kitchen' | 'bathroom' | 'living' | etc.
 *   prompt        — Additional user prompt (optional)
 *   inputImageUrl — Screenshot or uploaded image (optional; for img2img)
 *   provider      — 'flux-1.1-pro-ultra' | 'flux-1.1-pro' | 'recraft-v3' | 'sdxl'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorizeEditorRequest, enforceOwnership } from '@/lib/editor-auth'
import {
  generateImages,
  buildArchitecturalPrompt,
  defaultNegativePrompt,
} from '@/lib/ai-image'
import type { ImageProvider } from '@kealee/core-rules'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeEditorRequest()
    if (!auth.ok) return auth.response

    const body = await req.json()
    const {
      sceneId,
      renderMode = 'realistic',
      style      = 'modern',
      roomType   = 'living',
      prompt:    extraPrompt,
      inputImageUrl,
      provider,
    } = body as {
      sceneId: string
      renderMode?: 'sketch' | 'standard' | 'realistic' | 'cinematic'
      style?: string
      roomType?: string
      prompt?: string
      inputImageUrl?: string
      provider?: ImageProvider
    }

    if (!sceneId) return NextResponse.json({ error: 'sceneId required' }, { status: 400 })

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'AI rendering not configured' }, { status: 503 })
    }

    const supabase = getSupabaseAdmin()

    // Verify the caller owns the scene before queuing a (paid) Replicate job
    // against it — prevents resource-burning attacks via random scene UUIDs.
    const { data: scene, error: sceneErr } = await supabase
      .from('pascal_scenes')
      .select('user_id')
      .eq('id', sceneId)
      .single()

    if (sceneErr || !scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }

    const ownershipBlock = enforceOwnership(auth, scene.user_id)
    if (ownershipBlock) return ownershipBlock

    const { data: job, error: dbError } = await supabase
      .from('pascal_render_jobs')
      .insert({
        scene_id:       sceneId,
        // user_id is server-derived. NEVER from req.body.userId.
        user_id:        auth.userId,
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

    const fullPrompt = buildArchitecturalPrompt({ style, roomType, renderMode, extra: extraPrompt })

    // Submit to image provider — defaults to Flux 1.1 Pro Ultra (img2img → Flux Pro).
    generateImages({
      prompt:         fullPrompt,
      negativePrompt: defaultNegativePrompt(),
      inputImageUrl,
      provider,
      aspectRatio:    '16:9',
    })
      .then(result => {
        return supabase
          .from('pascal_render_jobs')
          .update({
            external_job_id: result.predictionId,
            status:          'PROCESSING',
            model_version:   result.modelVersion,
          })
          .eq('id', job.id)
      })
      .catch(err => {
        console.error('[renders] Image provider submit failed:', err)
        return supabase
          .from('pascal_render_jobs')
          .update({ status: 'FAILED', error_msg: String(err?.message ?? err) })
          .eq('id', job.id)
      })

    return NextResponse.json({ jobId: job.id, status: 'PENDING' }, { status: 202 })
  } catch (err) {
    console.error('[editor/renders POST]', err)
    return NextResponse.json({ error: 'Failed to queue render' }, { status: 500 })
  }
}
