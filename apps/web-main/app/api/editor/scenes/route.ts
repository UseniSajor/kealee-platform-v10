/**
 * GET  /api/editor/scenes   — List scenes for the current user
 * POST /api/editor/scenes   — Create a new Pascal scene
 *
 * Pascal scenes are stored in the `pascal_scenes` Supabase table.
 * They persist independently of the intake pipeline and are optionally
 * linked to a Project once the user converts.
 *
 * SECURITY (audit 2026-05-09): `userId` is now derived server-side from the
 * Supabase auth cookie via `authorizeEditorRequest()`. The previous version
 * trusted a `userId` field in the request body, allowing trivial spoofing.
 * Anonymous callers receive `userId = null` (they only see/create anonymous
 * scenes) when `ALLOW_ANONYMOUS_EDITOR` is unset or `'true'`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorizeEditorRequest } from '@/lib/editor-auth'
import { createDefaultScene } from '@kealee/pascal-wrapper'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET — list scenes (filtered to the caller's own scenes)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeEditorRequest()
    if (!auth.ok) return auth.response

    const supabase  = getSupabaseAdmin()
    const projectId = req.nextUrl.searchParams.get('projectId')

    let query = supabase
      .from('pascal_scenes')
      .select('id, name, project_type, total_sq_ft, room_count, style, address, created_at, updated_at')
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .limit(50)

    // Authenticated users see only their own scenes; anonymous callers see
    // only anonymous (user_id IS NULL) scenes — prevents enumeration.
    if (auth.userId) {
      query = query.eq('user_id', auth.userId)
    } else {
      query = query.is('user_id', null)
    }

    if (projectId) query = query.eq('project_id', projectId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ scenes: data ?? [] })
  } catch (err) {
    console.error('[editor/scenes GET]', err)
    return NextResponse.json({ error: 'Failed to list scenes' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST — create scene
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeEditorRequest()
    if (!auth.ok) return auth.response

    const body = await req.json().catch(() => ({}))
    const {
      projectId,
      projectType = 'addition',
      name = 'New Project',
      sceneData,
      address,
      style,
    } = body

    const supabase = getSupabaseAdmin()
    const finalSceneData = sceneData ?? createDefaultScene(projectType, name)

    const { data, error } = await supabase
      .from('pascal_scenes')
      .insert({
        // user_id is server-derived. NEVER from req.body.userId.
        user_id:      auth.userId,
        project_id:   projectId ?? null,
        name,
        project_type: projectType.toUpperCase().replace(/-/g, '_'),
        scene_data:   finalSceneData,
        total_sq_ft:  finalSceneData.stats?.totalFloorAreaSqFt ?? 0,
        room_count:   finalSceneData.stats?.roomCount ?? 0,
        floor_count:  finalSceneData.stats?.floorCount ?? 1,
        style:        style ?? null,
        address:      address ?? null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ scene: data }, { status: 201 })
  } catch (err) {
    console.error('[editor/scenes POST]', err)
    return NextResponse.json({ error: 'Failed to create scene' }, { status: 500 })
  }
}
