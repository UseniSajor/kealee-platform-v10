import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { buildDigitalTwinRecord, CreateDigitalTwinSchema } from '@kealee/intake'

// POST /api/twin — create twin (non-capture paths)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateDigitalTwinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const twinRecord = buildDigitalTwinRecord(parsed.data)
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('property_twins').insert(twinRecord)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ twinId: twinRecord.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/twin?twinId=xxx OR ?projectId=xxx
export async function GET(req: NextRequest) {
  const twinId = req.nextUrl.searchParams.get('twinId')
  const projectId = req.nextUrl.searchParams.get('projectId')

  const supabase = getSupabaseAdmin()

  let query = supabase.from('property_twins').select('*')
  if (twinId) {
    query = query.eq('id', twinId) as typeof query
  } else if (projectId) {
    query = query.eq('project_id', projectId) as typeof query
  } else {
    return NextResponse.json({ error: 'twinId or projectId required' }, { status: 400 })
  }

  const { data: twin, error } = twinId
    ? await query.single()
    : await query.maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!twin) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch related data
  const [spatialResult, systemResult, obsResult, assetsResult] = await Promise.all([
    supabase.from('property_twin_spatial_nodes').select('*').eq('twin_id', twin.id),
    supabase.from('property_twin_system_nodes').select('*').eq('twin_id', twin.id),
    supabase.from('property_twin_observations').select('*').eq('twin_id', twin.id).order('severity'),
    supabase.from('capture_assets').select('*').in(
      'capture_session_id',
      twin.source_capture_session_ids ?? [],
    ),
  ])

  return NextResponse.json({
    twin,
    spatialNodes: spatialResult.data ?? [],
    systemNodes: systemResult.data ?? [],
    observations: obsResult.data ?? [],
    assets: assetsResult.data ?? [],
  })
}
