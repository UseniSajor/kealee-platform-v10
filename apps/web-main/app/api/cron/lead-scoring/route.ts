import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateLeadScore, type LeadData, type RoutingTag } from '@/lib/marketing/lead-scorer'
import { alertHotLead } from '@/lib/marketing/twilio-client'
import { createOrUpdateContact } from '@/lib/marketing/ghl-client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const CRON_SECRET = process.env.CRON_SECRET
const KEALEE_OPS_SECRET = process.env.KEALEE_OPS_SECRET

/**
 * POST /api/cron/lead-scoring
 *
 * Runs every 5 minutes to:
 * 1. Score new leads (status = 'new')
 * 2. Send SMS alert if lead is hot
 * 3. Create GHL contact
 * 4. Update intake_leads.lead_score + routing_tag
 */
export async function POST(req: NextRequest) {
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
            await supabase
              .from('sms_alert_log')
              .insert({
                intake_id: lead.id,
                message: `Alert sent for ${lead.name}`,
                status: 'sent',
                twilio_message_id: smsResult.messageId,
              })
              .catch((err) => console.error('SMS log error:', err))

            // Update sms_alert_sent_at
            await supabase
              .from('public_intake_leads')
              .update({ sms_alert_sent_at: new Date().toISOString() })
              .eq('id', lead.id)
              .catch((err) => console.error('Update sms_alert_sent_at error:', err))
          } else {
            console.error(`SMS alert failed for ${lead.id}:`, smsResult.error)
            await supabase
              .from('sms_alert_log')
              .insert({
                intake_id: lead.id,
                message: `Alert failed for ${lead.name}`,
                status: 'failed',
                error_message: smsResult.error,
              })
              .catch((err) => console.error('SMS log error:', err))
          }
        }

        // ── Create GHL contact ────────────────────────────────────────
        try {
          if (lead.email) {
            const ghlContact = await createOrUpdateContact({
              email: lead.email,
              firstName: lead.name?.split(' ')[0],
              lastName: lead.name?.split(' ').slice(1).join(' '),
              phone: lead.phone_number,
              source: lead.source || 'kealee-web',
              tags: [scoreResult.tag, lead.service_type || 'unknown'].filter(Boolean),
              customFields: [
                { key: 'lead_score', field_value: String(scoreResult.score) },
                { key: 'budget', field_value: leadData.budget ? `$${leadData.budget}` : 'N/A' },
                { key: 'timeline', field_value: leadData.timeline || 'N/A' },
                { key: 'kealee_intake_id', field_value: lead.id },
              ],
            })

            // Update intake_leads with GHL contact ID
            await supabase
              .from('public_intake_leads')
              .update({ ghl_contact_id: ghlContact.id })
              .eq('id', lead.id)

            // Log GHL sync
            await supabase
              .from('ghl_sync_log')
              .insert({
                intake_id: lead.id,
                ghl_contact_id: ghlContact.id,
                action: 'create',
                ghl_response: ghlContact,
              })
              .catch((err) => console.error('GHL sync log error:', err))
          }
        } catch (ghlErr) {
          console.error(`GHL contact creation failed for ${lead.id}:`, ghlErr)
          await supabase
            .from('ghl_sync_log')
            .insert({
              intake_id: lead.id,
              action: 'error',
              error_message: ghlErr instanceof Error ? ghlErr.message : String(ghlErr),
            })
            .catch((err) => console.error('GHL sync log error:', err))
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
