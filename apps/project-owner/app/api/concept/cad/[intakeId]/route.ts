import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  return createClient(url, key, { auth: { persistSession: false } })
}

/** GET /api/concept/cad/:intakeId — DXF from form_data.conceptOutput.cadDxfInline (owner portal, mainline Premium+). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { intakeId: string } },
) {
  const { intakeId } = params
  if (!intakeId) {
    return NextResponse.json({ error: 'Missing intakeId' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: row, error } = await supabaseAdmin
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', intakeId)
    .single()

  if (error || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const formData = (row.form_data as Record<string, unknown>) ?? {}
  const co = (formData.conceptOutput ?? formData.v30ConceptOutput) as
    | { cadDxfInline?: string }
    | undefined
  const dxf = co?.cadDxfInline
  if (!dxf) {
    return NextResponse.json(
      { error: 'CAD export not ready — Premium+ with floor plan required' },
      { status: 404 },
    )
  }

  return new NextResponse(dxf, {
    headers: {
      'Content-Type': 'application/dxf',
      'Content-Disposition': `attachment; filename="kealee-concept-${intakeId.slice(0, 8)}.dxf"`,
    },
  })
}
