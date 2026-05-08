/**
 * POST /api/leads/marketing
 *
 * Bot-friendly lead capture endpoint for Claude-powered marketing bots.
 * Accepts partial lead data (email + interest is enough) and:
 * 1. Creates a public_intake_leads record (source: 'marketing_bot')
 * 2. Sends a personalized welcome/nurture email via Resend
 * 3. Returns a direct funnel link for the bot to share with the user
 *
 * Auth: optional API key via x-marketing-bot-key header.
 *       If MARKETING_BOT_API_KEY env is not set, the endpoint is open.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'


// ── Service type label map ────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  kitchen_remodel:               'Kitchen Remodel',
  bathroom_remodel:              'Bathroom Remodel',
  exterior_concept:              'Exterior Concept',
  interior_reno_concept:         'Interior Renovation Concept',
  interior_renovation:           'Interior Renovation',
  whole_home_concept:            'Whole Home Concept',
  whole_home_remodel:            'Whole-Home Remodel',
  addition_expansion:            'Addition / Expansion',
  garden_concept:                'Garden Concept',
  capture_site_concept:          'Site Capture + Concept',
  design_build:                  'Design + Build',
  design_estimate_permit_bundle: 'Full Bundle',
  developer_concept:             'Developer Concept',
  single_lot_development:        'Single Lot Development',
  single_family_subdivision:     'SF Subdivision',
  townhome_subdivision:          'Townhome Subdivision',
  development_feasibility:       'Development Feasibility',
  mixed_use:                     'Mixed-Use',
  commercial_office:             'Commercial Office',
  multi_unit_residential:        'Multi-Unit Residential',
  permit_path_only:              'Permit Path Only',
  cost_estimate:                 'Cost Estimate',
  contractor_match:              'Contractor Match',
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

// ── Request body type ─────────────────────────────────────────────────────────

interface MarketingLeadBody {
  email:           string
  name?:           string
  phone?:          string
  projectInterest?: string   // project_path key (e.g., "kitchen_remodel")
  location?:       string    // city, state (e.g., "Austin, TX")
  budget?:         string    // e.g., "$50K–$100K"
  message?:        string    // original conversation text
  source?:         string    // "facebook_bot" | "instagram_dm" | "email_bot" | "chatbot" | etc.
  tier?:           number    // 1 | 2 | 3 from lead-bot qualification
}

// ─────────────────────────────────────────────────────────────────────────────

function buildFunnelUrl(projectInterest?: string, leadId?: string): string {
  const base = `${SITE_URL}/concept`
  const params = new URLSearchParams()
  if (projectInterest) params.set('service', projectInterest)
  if (leadId)          params.set('lead', leadId)
  return `${base}?${params}`
}

async function sendWelcomeEmail(
  email: string,
  name: string,
  funnelUrl: string,
  serviceLabel: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Kealee <hello@kealee.com>',
        to:      [email],
        subject: `Your ${serviceLabel} design concept is ready to start — Kealee`,
        html:    `
<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1A2B4A; margin-bottom: 8px;">Hi ${name || 'there'}!</h2>
  <p style="color: #4A5568; line-height: 1.6;">
    Thanks for your interest in a <strong>${serviceLabel}</strong> concept from Kealee.
    Our AI-powered design engine can generate floor plan direction, permit scope, cost estimates,
    and stunning concept renderings — all in one package.
  </p>
  <p style="color: #4A5568; line-height: 1.6;">
    <strong style="color: #1A2B4A;">And here's the best part:</strong> your concept package cost is
    <em>credited in full</em> toward your permit drawing plans when you're ready to build.
  </p>
  <div style="margin: 32px 0; text-align: center;">
    <a href="${funnelUrl}"
      style="display: inline-block; background: #2ABFBF; color: #fff; text-decoration: none;
             font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 12px;">
      Start Your Concept Package →
    </a>
  </div>
  <p style="color: #718096; font-size: 13px; line-height: 1.6;">
    Packages start at $99. Includes AI renderings, floor plan direction, permit scope brief,
    and itemized cost estimate. Delivered digitally — usually within your package window.
  </p>
  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
  <p style="color: #A0AEC0; font-size: 12px;">
    Kealee · hello@kealee.com · Austin, TX<br>
    <a href="${SITE_URL}" style="color: #2ABFBF;">kealee.com</a>
  </p>
</div>`,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Optional API key auth
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

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const serviceLabel   = SERVICE_LABELS[projectInterest ?? ''] ?? 'Home Design'
  const projectAddress = location ? `${location}` : 'Not yet provided'

  let leadId: string | null = null
  let savedToDb = false

  // Attempt Supabase insert
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path:    projectInterest ?? 'kitchen_remodel',
        client_name:     name ?? email.split('@')[0],
        contact_email:   email,
        contact_phone:   phone ?? null,
        project_address: projectAddress,
        budget_range:    budget ?? null,
        source:          'marketing_bot',
        status:          'new',
        requires_payment: true,
        payment_amount:   0,
        form_data: {
          tier:     tier ?? 1,
          source:   source ?? 'marketing_bot',
          message:  message ?? null,
          location: location ?? null,
        },
        metadata: {
          marketingSource: source ?? 'marketing_bot',
          message:         message ?? null,
          capturedAt:      new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (!error && data) {
      leadId   = data.id
      savedToDb = true
    } else {
      console.error('[leads/marketing] Supabase error:', error?.message)
    }
  } catch (e: any) {
    console.error('[leads/marketing] DB error:', e?.message)
  }

  // Fallback ID
  if (!leadId) {
    leadId = `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  const funnelUrl = buildFunnelUrl(projectInterest, leadId)

  // Send welcome email
  const emailSent = await sendWelcomeEmail(email, name ?? '', funnelUrl, serviceLabel)

  // Schedule 3-email drip sequence (Day 1, 3, 7)
  if (savedToDb) {
    try {
      const supabase  = getSupabaseAdmin()
      const now       = Date.now()
      const dripSteps = [
        { step: 1, delayDays: 1 },
        { step: 2, delayDays: 3 },
        { step: 3, delayDays: 7 },
      ]
      const dripRows = dripSteps.map(({ step, delayDays }) => ({
        lead_id:       leadId,
        email,
        name:          name ?? null,
        service_label: serviceLabel,
        funnel_url:    funnelUrl,
        sequence_step: step,
        send_at:       new Date(now + delayDays * 24 * 60 * 60 * 1000).toISOString(),
        status:        'pending',
      }))
      await supabase.from('marketing_drip_queue').insert(dripRows)
    } catch (e: any) {
      // Non-fatal — table may not exist yet; run the SQL in Supabase to enable drip
      console.warn('[leads/marketing] Drip schedule skipped:', e?.message)
    }
  }

  console.log(`[leads/marketing] Lead captured: email=${email} service=${projectInterest ?? 'unknown'} source=${source ?? 'unknown'} saved=${savedToDb} email=${emailSent}`)

  return NextResponse.json({
    leadId,
    funnelUrl,
    welcomeEmailSent: emailSent,
    saved:            savedToDb,
    serviceLabel,
  })
}

// ── Docs endpoint ─────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    endpoint:    'POST /api/leads/marketing',
    description: 'Bot-friendly lead capture for Claude-powered marketing bots',
    auth: {
      header:   'x-marketing-bot-key',
      required: !!process.env.MARKETING_BOT_API_KEY,
    },
    body: {
      email:           'string (required)',
      name:            'string (optional)',
      phone:           'string (optional)',
      projectInterest: 'string (optional) — project_path key e.g. "kitchen_remodel"',
      location:        'string (optional) — e.g. "Austin, TX"',
      budget:          'string (optional) — e.g. "$50K–$100K"',
      message:         'string (optional) — original conversation text',
      source:          'string (optional) — "facebook_bot" | "instagram_dm" | "email_bot" | "chatbot"',
      tier:            'number (optional) — 1 | 2 | 3 from lead qualification',
    },
    response: {
      leadId:           'string — UUID (or fallback ID)',
      funnelUrl:        'string — https://kealee.com/concept?service=...&lead=...',
      welcomeEmailSent: 'boolean',
      saved:            'boolean — whether DB record was created',
      serviceLabel:     'string — human-readable service name',
    },
    supportedServices: Object.keys(SERVICE_LABELS),
  })
}
