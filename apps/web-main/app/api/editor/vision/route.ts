/**
 * POST /api/editor/vision
 *
 * AI Photo Understanding pipeline.
 *
 * Given an uploaded photo (room/exterior/floor plan/sketch):
 * 1. Calls Claude Vision API to analyze the image
 * 2. Extracts: walls, rooms, dimensions, windows, doors, appliances, layout
 * 3. Estimates square footage from visual context
 * 4. Returns structured geometry that can be converted to a Pascal scene
 * 5. Updates the PascalSceneUpload record with results
 *
 * Body:
 *   uploadId  — PascalSceneUpload id
 *   sceneId   — Parent scene id
 *   fileUrl   — Supabase Storage URL of the image
 *   imageType — 'room_photo' | 'floor_plan' | 'exterior' | 'sketch'  (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorizeEditorRequest, enforceOwnership } from '@/lib/editor-auth'
import Anthropic from '@anthropic-ai/sdk'
import { AI_MODELS } from '@kealee/core-rules'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VISION_SYSTEM_PROMPT = `You are an expert architectural analyst for Kealee, an AI construction platform.

Your task is to analyze architectural images and extract structured spatial data.

When given an image (room photo, floor plan, exterior photo, or hand sketch), you must:

1. Identify all visible walls and estimate their approximate lengths
2. Identify rooms and their approximate dimensions (width × depth in feet)
3. Identify openings: doors, windows, and their approximate sizes
4. Identify major elements: kitchen cabinets, appliances, bath fixtures, furniture
5. Estimate total square footage of the visible space
6. Identify the room type(s) visible
7. Detect the design style (modern, traditional, farmhouse, etc.)

Return ONLY valid JSON in this exact format:
{
  "rooms": [
    {
      "type": "kitchen|bathroom|bedroom|living|dining|other",
      "estimatedWidthFt": 12,
      "estimatedDepthFt": 14,
      "estimatedSqFt": 168,
      "description": "Open kitchen with island"
    }
  ],
  "walls": [
    { "estimatedLengthFt": 14, "type": "interior|exterior", "hasOpenings": true }
  ],
  "openings": [
    { "type": "door|window|sliding_door", "estimatedWidthFt": 3, "estimatedHeightFt": 7 }
  ],
  "majorElements": [
    { "type": "island|refrigerator|stove|cabinet|tub|shower|vanity|etc", "estimatedWidthFt": 4, "estimatedDepthFt": 3 }
  ],
  "totalEstimatedSqFt": 168,
  "style": "modern|farmhouse|contemporary|transitional|traditional|other",
  "confidence": 0.85,
  "notes": "Brief description of what was analyzed and key observations",
  "constructionScope": "Brief description of renovation scope visible"
}`

export async function POST(req: NextRequest) {
  const auth = await authorizeEditorRequest()
  if (!auth.ok) return auth.response

  const supabase = getSupabaseAdmin()
  let uploadId: string | undefined

  try {
    const body = await req.json()
    uploadId = body.uploadId
    const { sceneId, fileUrl, imageType = 'room_photo' } = body

    if (!fileUrl) return NextResponse.json({ error: 'fileUrl required' }, { status: 400 })

    // Enforce scene ownership before burning Anthropic vision credits.
    if (sceneId) {
      const { data: scene } = await supabase
        .from('pascal_scenes')
        .select('user_id')
        .eq('id', sceneId)
        .single()

      if (scene) {
        const ownershipBlock = enforceOwnership(auth, scene.user_id)
        if (ownershipBlock) return ownershipBlock
      }
    }

    // Mark as processing
    if (uploadId) {
      await supabase.from('pascal_scene_uploads')
        .update({ vision_status: 'processing' })
        .eq('id', uploadId)
    }

    // Fetch image from Supabase Storage and convert to base64
    const imageRes = await fetch(fileUrl)
    if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.status}`)

    const imageBuffer = await imageRes.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageRes.headers.get('content-type') ?? 'image/jpeg'

    // Skip non-image files (PDFs etc.)
    if (!mimeType.startsWith('image/')) {
      const fallback = { notes: 'PDF analysis not supported via vision — please upload a photo', confidence: 0, rooms: [], walls: [], openings: [], majorElements: [], totalEstimatedSqFt: 0, style: 'other', constructionScope: '' }
      if (uploadId) {
        await supabase.from('pascal_scene_uploads')
          .update({ vision_result: fallback, vision_status: 'completed', geometry_extracted: false })
          .eq('id', uploadId)
      }
      return NextResponse.json({ result: fallback })
    }

    // Call Claude Vision (model pinned in @kealee/core-rules AI_MODELS)
    const message = await anthropic.messages.create({
      model: AI_MODELS.vision,
      max_tokens: 2000,
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this ${imageType.replace(/_/g, ' ')} image and extract all spatial and architectural data. Return structured JSON only.`,
            },
          ],
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Vision API returned no valid JSON')

    const result = JSON.parse(jsonMatch[0])

    // Update upload record with results
    if (uploadId) {
      await supabase.from('pascal_scene_uploads')
        .update({
          vision_result: result,
          vision_status: 'completed',
          geometry_extracted: true,
        })
        .eq('id', uploadId)
    }

    return NextResponse.json({ result, sceneId })
  } catch (err) {
    console.error('[editor/vision POST]', err)

    // Mark as failed
    if (uploadId) {
      await supabase.from('pascal_scene_uploads')
        .update({ vision_status: 'failed' })
        .eq('id', uploadId)
        .catch(() => {})
    }

    return NextResponse.json({ error: 'Vision analysis failed' }, { status: 500 })
  }
}
