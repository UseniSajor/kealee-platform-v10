import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateLeadScore, type LeadData, type RoutingTag } from '@/lib/marketing/lead-scorer'
import { alertHotLead } from '@/lib/marketing/twilio-client'
import { createOrUpdateContact } from '@/lib/marketing/hubspot-client'

/**
 * POST /api/cron/lead-scoring
 *
 * Runs every 5 minutes to:
 * 1. Score new leads (status = 'new')
 * 2. Send SMS alert if lead is hot
 * 3. Create HubSpot contact
 * 4. Update intake_leads.lead_score + routing_tag
 */
export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const CRON_SECRET = process.env.CRON_SECRET
  const KEALEE_OPS_SECRET = process.env.KEALEE_OPS_SECRET

  // ── Authenticate ─────────────────────────────────────────────────────────
  const auth = req.headers.get('Authorization')
  const xKealeeOps = req.headers.get('x-kealee-ops')

  const secret = KEALEE_OPS_SECRET || CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET or KEALEE_OPS_SECRET not set' },
      { status: 500 }
    )
  }

  const isValid =
    (auth && auth === `Bearer ${secret}`) ||
    (xKealeeOps && xKealeeOps === secret)

  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // ── Fetch unscored leads ──────────────────────────────────────────────
    const { data: unscored, error: fetchErr } = await supabase
      .from('public_intake_leads')
      .select('*')
      .eq('status', 'new')
      .is('lead_score', null)
      .limit(50)

    if (fetchErr) throw new Error(`Fetch unscored: ${fetchErr.message}`)

    if (!unscored || unscored.length === 0) {
      return NextResponse.json({
        processed: 0,
        hotCount: 0,
        message: 'No new leads to score',
      })
    }

    let hotCount = 0
    const results: unknown[] = []

    for (const lead of unscored) {
      try {
        // ── Extract lead data ───────────────────────────────────────────
        const formData = lead.form_data || {}
        const leadData: LeadData = {
          source: lead.source || formData.source,
          budget: formData.budget ? parseInt(formData.budget) : undefined,
          timeline: formData.timeline,
          service: lead.service_type || formData.serviceType,
          hasPhoto: lead.area_photo_url ? true : false,
          hasDocuments: formData.attachment_urls && formData.attachment_urls.length > 0,
          phone: lead.phone_number,
        }

        // ── Calculate score ────────────────────────────────────────────
        const scoreResult = calculateLeadScore(leadData)
        const isHot = scoreResult.tag === 'hot'

        if (isHot) hotCount++

        // ── Update intake_leads ────────────────────────────────────────
        const { error: updateErr } = await supabase
          .from('public_intake_leads')
          .update({
            lead_score: scoreResult.score,
            routing_tag: scoreResult.tag,
          })
          .eq('id', lead.id)

        if (updateErr) throw new Error(`Update score: ${updateErr.message}`)

        // ── If hot: send SMS alert ────────────────────────────────────
        if (isHot) {
          const smsResult = await alertHotLead({
            name: lead.name || 'Unknown',
            service: leadData.service || 'Unknown',
            budget: leadData.budget ? `$${leadData.budget}` : 'N/A',
            timeline: leadData.timeline || 'N/A',
            intakePath: `/intake/${lead.id}`,
            email: lead.email,
          })

          // Log SMS result
          if (smsResult.success) {
            const { error: smsLogErr } = await supabase
              .from('sms_alert_log')
              .insert({
                intake_id: lead.id,
                message: `Alert sent for ${lead.name}`,
                status: 'sent',
                twilio_message_id: smsResult.messageId,
              })
            if (smsLogErr) console.error('SMS log error:', smsLogErr)

            // Update sms_alert_sent_at
            const { error: smsUpdateErr } = await supabase
              .from('public_intake_leads')
              .update({ sms_alert_sent_at: new Date().toISOString() })
              .eq('id', lead.id)
            if (smsUpdateErr) console.error('Update sms_alert_sent_at error:', smsUpdateErr)
          } else {
            console.error(`SMS alert failed for ${lead.id}:`, smsResult.error)
            const { error: smsFailLogErr } = await supabase
              .from('sms_alert_log')
              .insert({
                intake_id: lead.id,
                message: `Alert failed for ${lead.name}`,
                status: 'failed',
                error_message: smsResult.error,
              })
            if (smsFailLogErr) console.error('SMS log error:', smsFailLogErr)
          }
        }

        // ── Create HubSpot contact ──────────────────────────────────────
        try {
          if (lead.email) {
            const hsContact = await createOrUpdateContact(lead.email, {
              email: lead.email,
              firstname: lead.name?.split(' ')[0],
              lastname: lead.name?.split(' ').slice(1).join(' '),
              phone: lead.phone_number,
              lead_source: lead.source || 'kealee-web',
              hs_lead_status: scoreResult.tag,
              lifecyclestage: scoreResult.tag === 'hot' ? 'subscriber' : 'lead',
              budget: leadData.budget ? `$${leadData.budget}` : 'N/A',
              timeline: leadData.timeline || 'N/A',
              project_type: leadData.service || 'unknown',
              lead_score: scoreResult.score,
              hot_lead: scoreResult.tag === 'hot',
              kealee_intake_id: lead.id,
            })

            // Update intake_leads with HubSpot contact ID
            await supabase
              .from('public_intake_leads')
              .update({ ghl_contact_id: hsContact.id })
              .eq('id', lead.id)

            // Log HubSpot sync
            const { error: hsLogErr } = await supabase
              .from('ghl_sync_log')
              .insert({
                intake_id: lead.id,
                ghl_contact_id: hsContact.id,
                action: 'create',
                ghl_response: hsContact,
              })
            if (hsLogErr) console.error('HubSpot sync log error:', hsLogErr)
          }
        } catch (hsErr) {
          console.error(`HubSpot contact creation failed for ${lead.id}:`, hsErr)
          const { error: hsErrLogErr } = await supabase
            .from('ghl_sync_log')
            .insert({
              intake_id: lead.id,
              action: 'error',
              error_message: hsErr instanceof Error ? hsErr.message : String(hsErr),
            })
          if (hsErrLogErr) console.error('HubSpot sync log error:', hsErrLogErr)
        }

        results.push({
          id: lead.id,
          score: scoreResult.score,
          tag: scoreResult.tag,
          isHot,
        })
      } catch (err) {
        console.error(`Lead scoring error for ${lead.id}:`, err)
        results.push({
          id: lead.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({
      processed: unscored.length,
      hotCount,
      results,
    })
  } catch (err) {
    console.error('Lead scoring cron error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
