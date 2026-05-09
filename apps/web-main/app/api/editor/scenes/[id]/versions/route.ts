/**
 * POST /api/editor/scenes/[id]/versions — Save an autosave version snapshot
 * GET  /api/editor/scenes/[id]/versions — List versions for this scene
 *
 * SECURITY (audit 2026-05-09): both handlers enforce ownership of the parent
 * `pascal_scenes` row before reading/writing version snapshots.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorizeEditorRequest, enforceOwnership } from '@/lib/editor-auth'

export const dynamic = 'force-dynamic'

async function loadSceneOwner(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sceneId: string,
): Promise<{ ownerUserId: string | null } | null> {
  const { data } = await supabase
    .from('pascal_scenes')
    .select('user_id')
    .eq('id', sceneId)
    .single()
  if (!data) return null
  return { ownerUserId: (data.user_id as string | null) ?? null }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await authorizeEditorRequest()
    if (!auth.ok) return auth.response

    const supabase = getSupabaseAdmin()
    const owner = await loadSceneOwner(supabase, params.id)
    if (!owner) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })

    const ownershipBlock = enforceOwnership(auth, owner.ownerUserId)
    if (ownershipBlock) return ownershipBlock

    const { sceneData, label } = await req.json()
    if (!sceneData) return NextResponse.json({ error: 'sceneData required' }, { status: 400 })

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
    const auth = await authorizeEditorRequest()
    if (!auth.ok) return auth.response

    const supabase = getSupabaseAdmin()
    const owner = await loadSceneOwner(supabase, params.id)
    if (!owner) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })

    const ownershipBlock = enforceOwnership(auth, owner.ownerUserId)
    if (ownershipBlock) return ownershipBlock

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
