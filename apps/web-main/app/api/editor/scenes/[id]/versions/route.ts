/**
 * POST /api/editor/scenes/[id]/versions — Save an autosave version snapshot
 * GET  /api/editor/scenes/[id]/versions — List versions for this scene
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { sceneData, label } = await req.json()
    if (!sceneData) return NextResponse.json({ error: 'sceneData required' }, { status: 400 })

    const supabase = getSupabaseAdmin()

    // Keep only last 20 versions per scene — prune oldest first
    const { data: existing } = await supabase
      .from('pascal_scene_versions')
      .select('id, created_at')
      .eq('scene_id', params.id)
      .order('created_at', { ascending: true })

    if (existing && existing.length >= 20) {
      const toDelete = existing.slice(0, existing.length - 19).map(v => v.id)
      await supabase.from('pascal_scene_versions').delete().in('id', toDelete)
    }

    const { data, error } = await supabase
      .from('pascal_scene_versions')
      .insert({ scene_id: params.id, scene_data: sceneData, label: label ?? 'Autosave' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ version: data }, { status: 201 })
  } catch (err) {
    console.error('[editor/scenes/versions POST]', err)
    return NextResponse.json({ error: 'Failed to save version' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('pascal_scene_versions')
      .select('id, label, created_at')
      .eq('scene_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ versions: data ?? [] })
  } catch (err) {
    console.error('[editor/scenes/versions GET]', err)
    return NextResponse.json({ error: 'Failed to list versions' }, { status: 500 })
  }
}
