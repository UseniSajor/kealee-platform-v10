import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { randomUUID } from 'crypto'
import { mergeAttributionMetadata, parseUtmFromRequest } from '@/lib/marketing/utm-metadata'
import { trackLeadSubmitted } from '@/lib/marketing/ga4-server'
import {
  buildConceptFunnelUrl,
  schedulePrePaymentDrip,
} from '@/lib/marketing/drip-schedule'

export const dynamic = 'force-dynamic'


// POST /api/intake — create a new intake record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      projectPath,
      clientName,
      contactEmail,
      contactPhone,
      projectAddress,
      budgetRange,
      formData,
      attribution,
    } = body as Record<string, unknown>

    const utm = parseUtmFromRequest(req, {
      ...(typeof attribution === 'object' && attribution ? (attribution as Record<string, unknown>) : {}),
      ...(formData && typeof formData === 'object' ? (formData as Record<string, unknown>) : {}),
    })

    if (!projectPath || !clientName || !contactEmail || !projectAddress) {
      return NextResponse.json({ error: 'Missing required intake fields' }, { status: 400 })
    }

    const path = String(projectPath)
    const supabase = getSupabaseAdmin()
    const fd = formData && typeof formData === 'object' ? (formData as Record<string, unknown>) : {}

    const deliverable = SERVICE_DELIVERABLES[path]
    const resolvedFormData: Record<string, unknown> = { ...fd, funnelStage: 'lead' }
    if (utm.source) resolvedFormData.utm_source = utm.source
    if (utm.medium) resolvedFormData.utm_medium = utm.medium
    if (utm.campaign) resolvedFormData.utm_campaign = utm.campaign
    if (deliverable) {
      resolvedFormData.serviceLabel = deliverable.label
      resolvedFormData.serviceCategory = deliverable.category
      resolvedFormData.serviceIncludes = deliverable.includes
      resolvedFormData.serviceDeliveryDays = deliverable.deliveryDays
    }

    const metadata = mergeAttributionMetadata(null, utm, {
      funnelStage: 'lead',
      marketingSource: 'web-main',
      capturedAt: new Date().toISOString(),
    })

    // Refresh-and-retry on the payment step used to mint a fresh intake every
    // time, leaving orphan lead rows and making the admin queue unreadable.
    // Reuse an unpaid intake for the same person, product, and property when it
    // is recent enough to be the same attempt.
    const DUPLICATE_WINDOW_MS = 6 * 60 * 60 * 1000
    const { data: recent } = await supabase
      .from('public_intake_leads')
      .select('id, created_at, form_data')
      .eq('project_path', path)
      .eq('contact_email', String(contactEmail))
      .eq('project_address', String(projectAddress))
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(1)

    const reusable = recent?.[0]
    if (
      reusable?.created_at &&
      Date.now() - Date.parse(reusable.created_at) < DUPLICATE_WINDOW_MS
    ) {
      // Keep the newest answers — the customer may have edited before retrying.
      await supabase
        .from('public_intake_leads')
        .update({
          client_name: String(clientName),
          contact_phone: contactPhone ? String(contactPhone) : null,
          form_data: {
            ...((reusable.form_data as Record<string, unknown>) ?? {}),
            ...resolvedFormData,
          },
          metadata,
        })
        .eq('id', reusable.id)

      return NextResponse.json({ intakeId: reusable.id, reused: true })
    }

    const { data: intake, error: intakeErr } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path: path,
        client_name: String(clientName),
        contact_email: String(contactEmail),
        contact_phone: contactPhone ? String(contactPhone) : null,
        project_address: String(projectAddress),
        budget_range: budgetRange
          ? String(budgetRange)
          : fd.budget
            ? String(fd.budget)
            : 'Not provided',
        source: 'web-main',
        status: 'new',
        requires_payment: true,
        payment_amount: 0,
        metadata,
        form_data: resolvedFormData,
      })
      .select('id')
      .single()

    if (intakeErr || !intake) {
      // Table may not exist yet in this environment — return a deterministic
      // fallback UUID so the Stripe checkout can still proceed.
      // Concept generation will fail gracefully with a 404 in this case.
      console.error('[intake] Supabase insert failed:', intakeErr?.message)
      const fallbackId = randomUUID()
      return NextResponse.json({ intakeId: fallbackId, fallback: true })
    }

    void trackLeadSubmitted({
      intakeId: intake.id,
      projectPath: path,
      source: 'web-main',
      utm,
    })

    void (async () => {
      try {
        await schedulePrePaymentDrip({
          leadId: intake.id,
          email: String(contactEmail),
          name: String(clientName),
          serviceLabel: deliverable?.label ?? path,
          funnelUrl: buildConceptFunnelUrl(path, intake.id),
        })
      } catch (dripErr: unknown) {
        console.warn(
          '[intake] pre-payment drip skipped:',
          dripErr instanceof Error ? dripErr.message : dripErr,
        )
      }
    })()

    return NextResponse.json({ intakeId: intake.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    console.error('[intake] Unexpected error:', msg)
    // Fallback so Stripe checkout is never blocked by a DB error
    return NextResponse.json({ intakeId: randomUUID(), fallback: true })
  }
}

// GET /api/intake?intakeId=xxx
export async function GET(req: NextRequest) {
  const intakeId = req.nextUrl.searchParams.get('intakeId')
  if (!intakeId) {
    return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('*')
    .eq('id', intakeId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Also query service_chain_gates for checking permit status and matching unlock status
  const { data: gate } = await supabase
    .from('service_chain_gates')
    .select('permitSubmitted, permitApproved, contractorMatchingUnlocked, noPermitRequired')
    .eq('conceptIntakeId', intakeId)
    .maybeSingle()

  const hasDesign = data.status === 'concept_ready' || !!(data.form_data?.conceptOutput || data.form_data?.v30ConceptOutput)
  const hasPermit = !!(gate?.permitSubmitted || gate?.permitApproved)
  const contractorMatchingUnlocked = !!(
    gate?.contractorMatchingUnlocked ||
    hasPermit ||
    gate?.noPermitRequired ||
    data.form_data?.contractorMatchResult
  )

  return NextResponse.json({
    ...data,
    hasDesign,
    hasPermit,
    contractorMatchingUnlocked
  })
}
