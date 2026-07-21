import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  return createClient(url, key, { auth: { persistSession: false } })
}

/** GET /api/v30/cad/:intakeId — DXF from form_data.v30FloorplanDeliverables (owner portal). */
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
  const deliverables = formData.v30FloorplanDeliverables as
    | { cadExport?: { dxf?: string; dxfFilename?: string } }
    | undefined
  const dxf = deliverables?.cadExport?.dxf
  if (!dxf) {
    return NextResponse.json(
      { error: 'CAD export not ready — Premium+ with floorplan required' },
      { status: 404 },
    )
  }

  const filename = deliverables?.cadExport?.dxfFilename ?? 'kealee-layout.dxf'
  return new NextResponse(dxf, {
    headers: {
      'Content-Type': 'application/dxf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
