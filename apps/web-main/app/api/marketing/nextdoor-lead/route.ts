/**
 * POST /api/marketing/nextdoor-lead
 *
 * Public endpoint for Nextdoor lead ads and organic form submissions.
 * Same schema as concept-lead with source: 'nextdoor'.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { getSupabaseAdmin }          from '@/lib/supabase-server'
import { createOrUpdateContact }     from '@kealee/core-rules'
import { scheduleSequence }          from '@/lib/marketing/sequences'

const NextdoorLeadSchema = z.object({
  email:       z.string().email(),
  firstName:   z.string().optional(),
  lastName:    z.string().optional(),
  phone:       z.string().optional(),
  projectType: z.string().optional().default('kitchen_remodel'),
  location:    z.string().optional(),
  budget:      z.string().optional(),
  message:     z.string().optional(),
  neighborhood: z.string().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: z.infer<typeof NextdoorLeadSchema>

  try {
    const raw    = await req.json()
    const parsed = NextdoorLeadSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  let leadId:  string | null = null
  let savedToDb              = false

  // Save to Supabase
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path:     body.projectType,
        client_name:      [body.firstName, body.lastName].filter(Boolean).join(' ') || body.email.split('@')[0],
        contact_email:    body.email,
        contact_phone:    body.phone ?? null,
        project_address:  body.location ?? body.neighborhood ?? 'Not provided',
        budget_range:     body.budget ?? null,
        source:           'nextdoor',
        status:           'new',
        requires_payment: true,
        payment_amount:   0,
        form_data: {
          neighborhood: body.neighborhood ?? null,
          message:      body.message ?? null,
          source:       'nextdoor',
        },
        metadata: {
          source:     'nextdoor',
          capturedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (!error && data) {
      leadId   = data.id
      savedToDb = true
    } else {
      console.error('[nextdoor-lead] Supabase error:', error?.message)
    }
  } catch (e: any) {
    console.error('[nextdoor-lead] DB error:', e?.message)
  }

  if (!leadId) {
    leadId = `nd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  // GHL + sequence (fire-and-forget)
  void (async () => {
    try {
      if (!process.env.GHL_API_KEY) return

      const contact = await createOrUpdateContact({
        email:     body.email,
        firstName: body.firstName,
        lastName:  body.lastName,
        phone:     body.phone,
        source:    'nextdoor',
        tags:      ['nextdoor-lead', 'concept-inquiry'],
      })

      await scheduleSequence(
        leadId!,
        contact.id,
        'CONCEPT_SEQUENCE',
        {
          firstName:        body.firstName ?? 'there',
          projectType:      (body.projectType ?? 'home project').replace(/_/g, ' '),
          projectSlug:      body.projectType ?? '',
          location:         body.location ?? body.neighborhood ?? 'your area',
          conceptPrice:     '395',
          conceptPriceHigh: '585',
        },
      )
    } catch (e: any) {
      console.error('[nextdoor-lead] GHL error:', e?.message)
    }
  })()

  return NextResponse.json({ success: true, leadId, saved: savedToDb })
}
