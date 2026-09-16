/**
 * GET /api/concept/[intakeId]/pdf
 * Authenticated concept package PDF (owner portal only).
 * Serves the pre-generated PDF from storage — no sharp/concept-engine at build time.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serveConceptPackagePdf } from '@kealee/concept-engine'
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
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
    const currentFormData = (intake.form_data ?? {}) as Record<string, unknown>
    const currentOutput = (currentFormData.conceptOutput ?? currentFormData.v30ConceptOutput) as Record<string, unknown> | undefined
    const beforeUrls = Array.isArray(currentOutput?.beforeUrls) ? currentOutput.beforeUrls : []
    const renderUrls = Array.isArray(currentOutput?.renderUrls) ? currentOutput.renderUrls : []
    if (beforeUrls.length === 0 || renderUrls.length === 0) {
      return NextResponse.json(
        { error: 'The source-linked concept visuals are still under quality review.' },
        { status: 409 },
      )
    }

    const result = await serveConceptPackagePdf(intake, {
      upload: async (buffer, intakeId) => {
        const path = `concept-packages/${intakeId}/concept-package.pdf`
        const { error } = await supabaseAdmin.storage
          .from('designs')
          .upload(path, buffer, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: true,
          })
        if (error) throw new Error(`Concept PDF upload failed: ${error.message}`)
        return supabaseAdmin.storage.from('designs').getPublicUrl(path).data.publicUrl
      },
    })

    if (result.cachedUrl) {
      const formData = (intake.form_data ?? {}) as Record<string, unknown>
      const key = formData.conceptOutput ? 'conceptOutput' : 'v30ConceptOutput'
      const conceptOutput = (formData[key] ?? {}) as Record<string, unknown>
      await supabaseAdmin
        .from('public_intake_leads')
        .update({
          form_data: {
            ...formData,
            [key]: { ...conceptOutput, pdfUrl: result.cachedUrl },
          },
        })
        .eq('id', params.intakeId)
    }

    return new NextResponse(new Uint8Array(result.buffer), {
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
