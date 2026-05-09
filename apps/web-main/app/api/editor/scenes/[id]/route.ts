/**
 * GET    /api/editor/scenes/[id]  — Fetch a scene
 * PUT    /api/editor/scenes/[id]  — Update scene data + stats
 * DELETE /api/editor/scenes/[id]  — Soft-delete scene
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { calculateSceneStats } from '@kealee/pascal-wrapper'
import type { PascalSceneData } from '@kealee/pascal-wrapper'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('pascal_scenes')
      .select('*')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })

    return NextResponse.json({ scene: data })
  } catch (err) {
    console.error('[editor/scenes/[id] GET]', err)
    return NextResponse.json({ error: 'Failed to fetch scene' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PUT — save / autosave
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json()
    const { sceneData, name, style, address } = body as {
      sceneData?: PascalSceneData
      name?: string
      style?: string
      address?: string
    }

    const supabase = getSupabaseAdmin()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (name)      updates.name    = name
    if (style)     updates.style   = style
    if (address)   updates.address = address

    if (sceneData) {
      const stats = calculateSceneStats(sceneData)
      updates.scene_data     = sceneData
      updates.total_sq_ft    = stats.totalFloorAreaSqFt
      updates.room_count     = stats.roomCount
      updates.wall_length_ft = stats.totalWallLengthFt
      updates.floor_count    = stats.floorCount
      updates.door_count     = stats.doorCount
      updates.window_count   = stats.windowCount
      updates.exterior_perim_ft = stats.exteriorPerimeterFt
    }

    const { data, error } = await supabase
      .from('pascal_scenes')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ scene: data })
  } catch (err) {
    console.error('[editor/scenes/[id] PUT]', err)
    return NextResponse.json({ error: 'Failed to update scene' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — soft delete
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('pascal_scenes')
      .update({ is_deleted: true })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[editor/scenes/[id] DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete scene' }, { status: 500 })
  }
}
