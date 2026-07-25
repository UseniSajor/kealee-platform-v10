/**
 * GET /api/intake/:intakeId
 * Server-side route — uses service_role key so it bypasses RLS.
 * The deliverables page fetches through here instead of directly from Supabase
 * (anon key is blocked by RLS on public_intake_leads).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  return createClient(url, key, { auth: { persistSession: false } })
}

/** The concept worker stores the complete delivery in concept_packages.  Keep
 * the portal compatible with both the legacy form_data payload and the
 * canonical worker/API record. */
async function getConceptPackage(intakeId: string) {
  const base = (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')
  for (const path of [`/concepts/package/${intakeId}`, `/api/v1/concepts/package/${intakeId}`]) {
    try {
      const response = await fetch(`${base}${path}`, { cache: 'no-store' })
      if (response.ok) return await response.json()
    } catch {
      // The API may be unavailable during local-only development; legacy data
      // below remains a valid fallback.
    }
  }
  return null
}

export async function GET(
  _req: Request,
  { params }: { params: { intakeId: string } }
) {
  const { intakeId } = params

  if (!intakeId) {
    return NextResponse.json({ error: 'Missing intakeId' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('public_intake_leads')
    .select('*')
    .eq('id', intakeId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const conceptPackage = await getConceptPackage(intakeId)
  if (conceptPackage) {
    const formData = (data.form_data ?? {}) as Record<string, unknown>
    const legacy = (formData.conceptOutput ?? formData.v30ConceptOutput) as Record<string, unknown> | undefined
    data.form_data = {
      ...formData,
      conceptOutput: {
        ...(legacy ?? {}),
        conceptPackageId: conceptPackage.id,
        packageJson: conceptPackage.packageJson ?? legacy?.packageJson,
        pdfUrl: conceptPackage.pdfUrl ?? legacy?.pdfUrl,
        floorplanUrl: conceptPackage.floorplanUrl ?? legacy?.floorplanUrl,
        renderImageUrls: conceptPackage.renderImageUrls ?? legacy?.renderImageUrls,
        generatedAt: conceptPackage.completedAt ?? conceptPackage.createdAt ?? legacy?.generatedAt,
      },
    }
    if (conceptPackage.status && data.status !== 'concept_ready') data.status = 'concept_ready'
  }

  // Also fetch service chain gate for contractor matching unlock status
  const { data: gate } = await supabaseAdmin
    .from('service_chain_gates')
    .select('contractorMatchingUnlocked, permitSubmitted, permitApproved, noPermitRequired')
    .eq('conceptIntakeId', intakeId)
    .maybeSingle()

  return NextResponse.json({ intake: data, gate: gate ?? null })
}
