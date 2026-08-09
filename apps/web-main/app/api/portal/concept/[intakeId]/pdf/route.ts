/**
 * GET /api/portal/concept/[intakeId]/pdf
 * Auth-gated concept PDF for logged-in customers (web-main session).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { serveConceptPackagePdf } from '@kealee/concept-engine'
import { uploadFile } from '@kealee/storage'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PAID_STATUSES = new Set(['paid', 'concept_ready', 'processing'])

export async function GET(
  _req: NextRequest,
  { params }: { params: { intakeId: string } },
) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: intake, error } = await supabase
    .from('public_intake_leads')
    .select(
      'id, project_path, client_name, contact_email, contact_phone, project_address, budget_range, status, form_data',
    )
    .eq('id', params.intakeId)
    .single()

  if (error || !intake) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const contactEmail = (intake.contact_email as string | null)?.toLowerCase()
  if (contactEmail && contactEmail !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  if (!PAID_STATUSES.has(intake.status as string)) {
    return NextResponse.json({ error: 'Payment required' }, { status: 402 })
  }

  try {
    const formData = (intake.form_data ?? {}) as Record<string, unknown>
    const co = (formData.conceptOutput ?? formData.v30ConceptOutput) as Record<string, unknown> | undefined
    const existingPdfUrl = typeof co?.pdfUrl === 'string' ? co.pdfUrl : null

    const { buffer, generated, cachedUrl } = await serveConceptPackagePdf(intake, {
      existingPdfUrl,
      upload: async (pdfBuffer: Buffer, id: string) => {
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
      await supabase
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
    console.error('[portal/concept/pdf]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
