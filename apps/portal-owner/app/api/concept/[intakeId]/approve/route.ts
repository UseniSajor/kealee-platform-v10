/**
 * GET  /api/concept/[intakeId]/approve — is this concept approved by the customer?
 * POST /api/concept/[intakeId]/approve — the customer approves the recommended
 *      concept direction. Writes form_data.conceptConfirmedAt, which the package
 *      reads as the "Approved by customer" stamp, then re-renders the PDF so the
 *      stamp appears on the download. Approval is of the concept direction only;
 *      the package stays "Not for permit or construction".
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serveConceptPackagePdf } from '@kealee/concept-engine'
import { loadIntakeForPdf, verifyIntakeAccessForSession } from '@/lib/verify-intake-access'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

function approvalOf(formData: Record<string, unknown>) {
  const at = formData.conceptConfirmedAt ?? formData.v30ConceptConfirmedAt
  return typeof at === 'string'
    ? { approvedAt: at, generation: Number(formData.conceptApprovedGeneration ?? formData.conceptGeneration ?? 0) }
    : null
}

export async function GET(_req: NextRequest, { params }: { params: { intakeId: string } }) {
  const access = await verifyIntakeAccessForSession(params.intakeId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const intake = await loadIntakeForPdf(params.intakeId)
  if (!intake) return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  const formData = (intake.form_data ?? {}) as Record<string, unknown>
  const hasConcept = Boolean(formData.conceptOutput ?? formData.v30ConceptOutput)
  return NextResponse.json({ approval: approvalOf(formData), canApprove: hasConcept, generation: Number(formData.conceptGeneration ?? 0) })
}

export async function POST(_req: NextRequest, { params }: { params: { intakeId: string } }) {
  const access = await verifyIntakeAccessForSession(params.intakeId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const intake = await loadIntakeForPdf(params.intakeId)
  if (!intake) return NextResponse.json({ error: 'Intake not found' }, { status: 404 })

  const formData = (intake.form_data ?? {}) as Record<string, unknown>
  if (!(formData.conceptOutput ?? formData.v30ConceptOutput)) {
    return NextResponse.json({ error: 'Your concept package is still being prepared' }, { status: 409 })
  }
  const existing = approvalOf(formData)
  if (existing) return NextResponse.json({ approval: existing, alreadyApproved: true })

  const now = new Date().toISOString()
  const generation = Number(formData.conceptGeneration ?? 0)
  const approvedFormData: Record<string, unknown> = {
    ...formData,
    conceptConfirmedAt: now,
    conceptApprovedBy: access.email,
    conceptApprovedGeneration: generation,
  }

  const db = supabaseAdmin()
  const { error } = await db
    .from('public_intake_leads')
    .update({ form_data: approvedFormData })
    .eq('id', params.intakeId)
  if (error) return NextResponse.json({ error: 'Your approval could not be saved. Try again.' }, { status: 500 })

  // Re-render the package so the "Approved by customer" stamp is on the PDF.
  // A new storage path sidesteps the hour-long cache on the previous file.
  let pdfUrl: string | undefined
  try {
    const result = await serveConceptPackagePdf({ ...intake, form_data: approvedFormData }, {
      forceRegenerate: true,
      upload: async (buffer, intakeId) => {
        const path = `concept-packages/${intakeId}/concept-package-approved-${Date.now()}.pdf`
        const { error: uploadError } = await db.storage
          .from('designs')
          .upload(path, buffer, { contentType: 'application/pdf', cacheControl: '3600', upsert: true })
        if (uploadError) throw new Error(`Concept PDF upload failed: ${uploadError.message}`)
        return db.storage.from('designs').getPublicUrl(path).data.publicUrl
      },
    })
    pdfUrl = result.cachedUrl
    if (pdfUrl) {
      const key = approvedFormData.conceptOutput ? 'conceptOutput' : 'v30ConceptOutput'
      const conceptOutput = (approvedFormData[key] ?? {}) as Record<string, unknown>
      await db
        .from('public_intake_leads')
        .update({ form_data: { ...approvedFormData, [key]: { ...conceptOutput, pdfUrl } } })
        .eq('id', params.intakeId)
    }
  } catch (err) {
    // The approval stands; the stamped PDF is produced on the next download.
    console.warn('[concept/approve] stamped PDF not regenerated:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ approval: { approvedAt: now, generation }, pdfUrl })
}
