import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** GET /api/concept/cad/:intakeId — download concept DXF (Premium+ CAD export, mainline pipeline). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ intakeId: string }> },
) {
  const { intakeId } = await params
  const supabase = getSupabaseAdmin()
  const { data: row, error } = await supabase
    .from('public_intake_leads')
    .select('form_data, status')
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
