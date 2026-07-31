import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { buildImmediateIntakeDeliverables } from '@/lib/immediate-intake-deliverables'
import * as Sentry from '@sentry/nextjs'
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
    const uploadedFiles = Array.isArray(fd.uploadedFiles)
      ? fd.uploadedFiles.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : []
    if (uploadedFiles.length === 0) {
      return NextResponse.json({
        error: 'Add at least one project photo, sketch/plan, or voice description before submitting your intake.',
      }, { status: 400 })
    }

    const deliverable = SERVICE_DELIVERABLES[path]
    const resolvedFormData: Record<string, unknown> = { ...fd, funnelStage: 'lead' }
    resolvedFormData.immediateDeliverables = buildImmediateIntakeDeliverables({
      projectPath: path,
      projectAddress: String(projectAddress),
      formData: fd,
    })
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
      console.error('[intake] Supabase insert failed:', intakeErr?.message)
      Sentry.captureMessage('Public intake persistence failed', {
        level: 'error',
        tags: { area: 'sales-funnel', stage: 'lead-persistence', projectPath: path },
        extra: { databaseError: intakeErr?.message, contactEmail: String(contactEmail) },
      })
      return NextResponse.json(
        {
          error: 'We could not save your project securely. Nothing was charged. Please try again or contact hello@kealee.com.',
          code: 'INTAKE_PERSISTENCE_FAILED',
        },
        { status: 503 },
      )
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
    Sentry.captureException(err, {
      tags: { area: 'sales-funnel', stage: 'lead-creation' },
    })
    return NextResponse.json(
      {
        error: 'We could not save your project securely. Nothing was charged. Please try again or contact hello@kealee.com.',
        code: 'INTAKE_CREATE_FAILED',
      },
      { status: 503 },
    )
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
    immediateDeliveryReady: Boolean(data.form_data?.immediateDeliverables),
    immediateDeliverables: data.form_data?.immediateDeliverables ?? null,
    contractorMatchingUnlocked
  })
}
