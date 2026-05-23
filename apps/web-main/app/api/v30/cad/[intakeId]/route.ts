import { NextRequest, NextResponse } from 'next/server'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** GET /api/v30/cad/:intakeId — download concept DXF (Premium+ CAD export). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ intakeId: string }> },
) {
  if (!isV30Enabled()) {
    return NextResponse.json({ error: 'v30 disabled' }, { status: 503 })
  }

  const { intakeId } = await params
  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('form_data')
    .eq('id', intakeId)
    .single()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = (row.form_data as Record<string, unknown>) ?? {}
  const deliverables = formData.v30FloorplanDeliverables as
    | { cadExport?: { dxf?: string; dxfFilename?: string } }
    | undefined
  const cad = deliverables?.cadExport
  const dxf = cad?.dxf
  if (!dxf) {
    return NextResponse.json({ error: 'CAD export not ready — Premium+ with floorplan required' }, { status: 404 })
  }

  const filename = cad?.dxfFilename ?? 'kealee-layout.dxf'
  return new NextResponse(dxf, {
    headers: {
      'Content-Type': 'application/dxf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
