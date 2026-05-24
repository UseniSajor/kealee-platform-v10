/**
 * POST /api/leads/marketing — bot-friendly lead capture (Resend + drip, no GHL).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import {
  buildConceptFunnelUrl,
  sendWelcomeLeadEmail,
} from '@/lib/marketing/lifecycle'
import { schedulePrePaymentDrip } from '@/lib/marketing/drip-schedule'
import { mergeAttributionMetadata, parseUtmFromRequest } from '@/lib/marketing/utm-metadata'
import { trackLeadSubmitted } from '@/lib/marketing/ga4-server'

export const dynamic = 'force-dynamic'

const SERVICE_LABELS: Record<string, string> = {
  kitchen_remodel: 'Kitchen Remodel',
  bathroom_remodel: 'Bathroom Remodel',
  exterior_concept: 'Exterior Concept',
  interior_reno_concept: 'Interior Renovation Concept',
  interior_renovation: 'Interior Renovation',
  whole_home_concept: 'Whole Home Concept',
  whole_home_remodel: 'Whole-Home Remodel',
  addition_expansion: 'Addition / Expansion',
  garden_concept: 'Garden Concept',
  capture_site_concept: 'Site Capture + Concept',
  design_build: 'Design + Build',
  design_estimate_permit_bundle: 'Full Bundle',
  developer_concept: 'Developer Concept',
  single_lot_development: 'Single Lot Development',
  single_family_subdivision: 'SF Subdivision',
  townhome_subdivision: 'Townhome Subdivision',
  development_feasibility: 'Development Feasibility',
  mixed_use: 'Mixed-Use',
  commercial_office: 'Commercial Office',
  multi_unit_residential: 'Multi-Unit Residential',
  permit_path_only: 'Permit Path Only',
  cost_estimate: 'Cost Estimate',
  contractor_match: 'Contractor Match',
}

interface MarketingLeadBody {
  email: string
  name?: string
  phone?: string
  projectInterest?: string
  location?: string
  budget?: string
  message?: string
  source?: string
  tier?: number
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export async function POST(req: NextRequest) {
  const requiredKey = process.env.MARKETING_BOT_API_KEY
  if (requiredKey) {
    const providedKey = req.headers.get('x-marketing-bot-key')
    if (providedKey !== requiredKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: MarketingLeadBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, name, phone, projectInterest, location, budget, message, source, tier } = body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const serviceLabel = SERVICE_LABELS[projectInterest ?? ''] ?? 'Home Design'
  const projectAddress = location ? `${location}` : 'Not yet provided'
  const marketingSource = source ?? 'marketing_bot'
  const utm = parseUtmFromRequest(req, body as unknown as Record<string, unknown>)

  const metadata = mergeAttributionMetadata(null, utm, {
    funnelStage: 'lead',
    marketingSource,
    tags: ['kealee-lead', `source-${marketingSource}`],
    capturedAt: new Date().toISOString(),
    message: message ?? undefined,
  })

  let leadId: string | null = null
  let savedToDb = false

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path: projectInterest ?? 'kitchen_remodel',
        client_name: name ?? email.split('@')[0],
        contact_email: email,
        contact_phone: phone ?? null,
        project_address: projectAddress,
        budget_range: budget ?? 'Not provided',
        source: 'marketing_bot',
        status: 'new',
        requires_payment: true,
        payment_amount: 0,
        form_data: {
          tier: tier ?? 1,
          source: marketingSource,
          message: message ?? null,
          location: location ?? null,
          funnelStage: 'lead',
        },
        metadata,
      })
      .select('id')
      .single()

    if (!error && data) {
      leadId = data.id
      savedToDb = true
      void trackLeadSubmitted({
        intakeId: data.id,
        projectPath: projectInterest ?? 'kitchen_remodel',
        source: marketingSource,
        utm,
      })
    } else {
      console.error('[leads/marketing] Supabase error:', error?.message)
    }
  } catch (e: unknown) {
    console.error('[leads/marketing] DB error:', e instanceof Error ? e.message : e)
  }

  if (!leadId) {
    leadId = `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  const funnelUrl = buildConceptFunnelUrl(projectInterest, leadId)
  const emailSent = await sendWelcomeLeadEmail({
    email,
    name: name ?? '',
    funnelUrl,
    serviceLabel,
  })

  if (savedToDb) {
    try {
      await schedulePrePaymentDrip({
        leadId,
        email,
        name,
        serviceLabel,
        funnelUrl,
      })
    } catch (e: unknown) {
      console.warn('[leads/marketing] Drip schedule skipped:', e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({
    leadId,
    funnelUrl,
    welcomeEmailSent: emailSent,
    saved: savedToDb,
    serviceLabel,
  })
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/leads/marketing',
    description: 'Bot-friendly lead capture (Supabase + Resend drip, GHL disabled by default)',
    auth: {
      header: 'x-marketing-bot-key',
      required: !!process.env.MARKETING_BOT_API_KEY,
    },
    supportedServices: Object.keys(SERVICE_LABELS),
  })
}
