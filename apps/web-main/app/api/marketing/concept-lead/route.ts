/**
 * POST /api/marketing/concept-lead
 *
 * Public inbound endpoint for concept package inquiries from web, Google, Meta, etc.
 * 1. Validates request body
 * 2. Creates/updates GHL contact
 * 3. Creates GHL opportunity
 * 4. Schedules CONCEPT_SEQUENCE drip
 * 5. Saves to public_intake_leads (Supabase)
 * 6. Sends welcome email via Resend
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { createOrUpdateContact, createOpportunity } from '@/lib/marketing/ghl-client'
import { scheduleSequence } from '@/lib/marketing/sequences'
import { CONCEPT_KITCHEN_PRICE, CONCEPT_WHOLE_HOME_PRICE } from '@/lib/marketing/pricing'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

// ── Validation schema ─────────────────────────────────────────────────────────

const ConceptLeadSchema = z.object({
  email:       z.string().email(),
  firstName:   z.string().optional(),
  lastName:    z.string().optional(),
  phone:       z.string().optional(),
  projectType: z.string().optional(),    // e.g. "kitchen_remodel"
  location:    z.string().optional(),    // e.g. "Silver Spring, MD"
  budget:      z.string().optional(),
  message:     z.string().optional(),
  source:      z.string().optional().default('kealee-web'),
  utmSource:   z.string().optional(),
  utmMedium:   z.string().optional(),
  utmCampaign: z.string().optional(),
})

type ConceptLeadBody = z.infer<typeof ConceptLeadSchema>

// ── GHL pipeline config (from env) ───────────────────────────────────────────

const GHL_PIPELINE_ID       = process.env.GHL_PIPELINE_ID        ?? ''
const GHL_STAGE_NEW_INQUIRY = process.env.GHL_STAGE_NEW_INQUIRY  ?? ''

// ── Welcome email via Resend ──────────────────────────────────────────────────

async function sendWelcomeEmail(body: ConceptLeadBody): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  const name         = body.firstName ?? body.email.split('@')[0]
  const projectLabel = (body.projectType ?? 'home').replace(/_/g, ' ')
  const funnelUrl    = `${SITE_URL}/concept?service=${body.projectType ?? ''}&source=${body.source}`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Kealee <hello@kealee.com>',
        to:      [body.email],
        subject: `Your ${projectLabel} concept package — Kealee`,
        html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#1A2B4A">Hi ${name}!</h2>
  <p style="color:#4A5568;line-height:1.6">
    Thanks for your interest in a <strong>${projectLabel}</strong> concept from Kealee.
    Our AI-powered design engine generates floor plan direction, permit scope, cost estimates,
    and material palette — all in one digital package.
  </p>
  <p style="color:#4A5568;line-height:1.6">
    <strong style="color:#1A2B4A">Best part:</strong> your concept cost is
    <em>credited in full</em> toward permit drawings when you're ready to build.
  </p>
  <div style="margin:32px 0;text-align:center">
    <a href="${funnelUrl}"
      style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;
             font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px">
      Start My Concept Package →
    </a>
  </div>
  <p style="color:#718096;font-size:13px;line-height:1.6">
    Packages start at $195. Includes AI renderings, floor plan direction, permit scope,
    and cost estimate. Delivered digitally.
  </p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
  <p style="color:#A0AEC0;font-size:12px">
    Kealee · hello@kealee.com<br>
    <a href="${SITE_URL}" style="color:#2ABFBF">kealee.com</a> ·
    <a href="${SITE_URL}/api/marketing/unsubscribe?email=${encodeURIComponent(body.email)}" style="color:#A0AEC0">Unsubscribe</a>
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
  let body: ConceptLeadBody
  try {
    const raw = await req.json()
    const parsed = ConceptLeadSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let ghlContactId: string | null = null
  let conceptId:    string | null = null
  let savedToDb                   = false

  // ── 1. Save to Supabase ────────────────────────────────────────────────────
  try {
    const supabase  = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path:     body.projectType ?? 'kitchen_remodel',
        client_name:      [body.firstName, body.lastName].filter(Boolean).join(' ') || body.email.split('@')[0],
        contact_email:    body.email,
        contact_phone:    body.phone ?? null,
        project_address:  body.location ?? 'Not provided',
        budget_range:     body.budget ?? null,
        source:           body.source,
        status:           'new',
        requires_payment: true,
        payment_amount:   0,
        form_data: {
          source:      body.source,
          utmSource:   body.utmSource ?? null,
          utmMedium:   body.utmMedium ?? null,
          utmCampaign: body.utmCampaign ?? null,
          message:     body.message ?? null,
        },
        metadata: {
          marketingSource: body.source,
          capturedAt:      new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (!error && data) {
      conceptId = data.id
      savedToDb = true
    } else {
      console.error('[concept-lead] Supabase insert error:', error?.message)
    }
  } catch (e: any) {
    console.error('[concept-lead] Supabase error:', e?.message)
  }

  if (!conceptId) {
    conceptId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  // ── 2. GHL contact + opportunity + sequence (fire-and-forget) ─────────────
  void (async () => {
    try {
      if (!process.env.GHL_API_KEY) return

      const contact = await createOrUpdateContact({
        email:     body.email,
        firstName: body.firstName,
        lastName:  body.lastName,
        phone:     body.phone,
        source:    body.source,
        tags:      ['concept-inquiry', body.source ?? 'web'],
      })
      ghlContactId = contact.id

      if (GHL_PIPELINE_ID && GHL_STAGE_NEW_INQUIRY) {
        await createOpportunity({
          contactId:       contact.id,
          name:            `${body.firstName ?? body.email} — ${(body.projectType ?? 'Concept').replace(/_/g, ' ')}`,
          pipelineId:      GHL_PIPELINE_ID,
          pipelineStageId: GHL_STAGE_NEW_INQUIRY,
          source:          body.source,
        })
      }

      await scheduleSequence(
        conceptId ?? body.email,
        contact.id,
        'CONCEPT_SEQUENCE',
        {
          firstName:       body.firstName ?? 'there',
          projectType:     (body.projectType ?? 'home project').replace(/_/g, ' '),
          projectSlug:     body.projectType ?? '',
          location:        body.location ?? 'your area',
          conceptPrice:    String(CONCEPT_KITCHEN_PRICE),
          conceptPriceHigh: String(CONCEPT_WHOLE_HOME_PRICE),
        },
      )
    } catch (e: any) {
      console.error('[concept-lead] GHL/sequence error:', e?.message)
    }
  })()

  // ── 3. Welcome email ───────────────────────────────────────────────────────
  void sendWelcomeEmail(body)

  return NextResponse.json({
    success:                     true,
    conceptId,
    estimatedResponseMinutes:    3,
    saved:                       savedToDb,
  })
}
