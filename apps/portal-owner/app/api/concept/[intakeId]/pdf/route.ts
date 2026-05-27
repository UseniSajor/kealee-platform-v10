/**
 * GET /api/concept/[intakeId]/pdf
 * Authenticated concept package PDF (owner portal only).
 * Serves the pre-generated PDF from storage — no sharp/concept-engine at build time.
 */
import { NextRequest, NextResponse } from 'next/server'
import { loadIntakeForPdf, verifyIntakeAccessForSession } from '@/lib/verify-intake-access'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { intakeId: string } },
) {
  const access = await verifyIntakeAccessForSession(params.intakeId)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const intake = await loadIntakeForPdf(params.intakeId)
  if (!intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const formData = (intake.form_data ?? {}) as Record<string, unknown>
  const co = (formData.conceptOutput ?? formData.v30ConceptOutput) as Record<string, unknown> | undefined
  const pdfUrl = typeof co?.pdfUrl === 'string' ? co.pdfUrl : null

  if (!pdfUrl) {
    return NextResponse.json(
      { error: 'PDF not ready yet — refresh the page in a moment.' },
      { status: 404 },
    )
  }

  try {
    const pdfRes = await fetch(pdfUrl)
    if (!pdfRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 502 })
    }

    const buffer = await pdfRes.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kealee-concept-${params.intakeId.slice(0, 8)}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF fetch failed'
    console.error('[portal-owner/concept/pdf]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
