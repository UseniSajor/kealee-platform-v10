/**
 * GET /api/concept/[intakeId]/pdf
 * Authenticated concept package PDF (owner portal only).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serveConceptPackagePdf } from '@kealee/concept-engine'
import { uploadFile } from '@kealee/storage'
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

  try {
    const formData = (intake.form_data ?? {}) as Record<string, unknown>
    const co = (formData.conceptOutput ?? formData.v30ConceptOutput) as Record<string, unknown> | undefined
    const existingPdfUrl = typeof co?.pdfUrl === 'string' ? co.pdfUrl : null

    const { buffer, generated, cachedUrl } = await serveConceptPackagePdf(intake, {
      existingPdfUrl,
      upload: async (pdfBuffer, id) => {
        const result = await uploadFile({
          bucket: 'designs',
          path: `concept-packages/${id}/concept-package.pdf`,
          file: pdfBuffer,
          contentType: 'application/pdf',
        })
        return result.url
      },
    })

    if (generated && cachedUrl && co) {
      const key = formData.v30ConceptOutput ? 'v30ConceptOutput' : 'conceptOutput'
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      )
      await supabaseAdmin
        .from('public_intake_leads')
        .update({
          form_data: {
            ...formData,
            [key]: { ...co, pdfUrl: cachedUrl },
          },
        })
        .eq('id', params.intakeId)
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kealee-concept-${params.intakeId.slice(0, 8)}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF generation failed'
    console.error('[portal-owner/concept/pdf]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
